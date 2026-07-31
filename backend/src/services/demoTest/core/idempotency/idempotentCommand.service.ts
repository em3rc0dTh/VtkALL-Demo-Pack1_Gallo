import { randomUUID } from 'crypto';
import { IdempotencyRecord } from '../../../../models/IdempotencyRecord.model';
import { Appointment } from '../../../../models/Appointment.model';
import { ResourceReservation } from '../../../../models/ResourceReservation.model';
import { Case } from '../../../../models/Case.model';
import { ExecutionContext, withExecutionScope } from '../ExecutionContext';
import { SemanticError } from '../SemanticError';
import { toSemanticError } from '../errorSerialization';
import { fingerprintCommandInput } from './canonicalFingerprint';

export type IdempotentCommandResult<TResult> = {
  result: TResult;
  replayed: boolean;
  originalCorrelationId?: string;
};

type EntityRef = {
  type: string;
  id: string;
};

type ExecuteIdempotentCommandInput<TInput, TResult> = {
  scope: string;
  operation: string;
  input: TInput;
  context: ExecutionContext;
  requireKey?: boolean;
  leaseMs?: number;
  execute: () => Promise<TResult>;
  buildReplayPayload?: (result: TResult) => unknown;
  entityRefs?: (result: TResult) => EntityRef[];
  reconcile?: (args: {
    input: TInput;
    context: ExecutionContext;
    requestFingerprint: string;
  }) => Promise<TResult | null>;
};

const DEFAULT_LEASE_MS = 2 * 60 * 1000;

const finalFailureCodes = new Set([
  'VALIDATION_ERROR',
  'CUSTOMER_NOT_FOUND',
  'MANAGED_ENTITY_NOT_FOUND',
  'CASE_NOT_FOUND',
  'WORK_TEAM_NOT_FOUND',
  'CATALOG_OFFERING_NOT_FOUND',
  'NO_AVAILABILITY',
  'DOUBLE_BOOKING_CONFLICT',
  'IDEMPOTENCY_CONFLICT',
  'INVALID_STATE_TRANSITION',
]);

const duplicateKey = (error: any) => error?.code === 11000;

const replayContext = (context: ExecutionContext, originalCorrelationId?: string) =>
  withExecutionScope({
    ...context,
    metadata: {
      ...(context.metadata || {}),
      idempotentReplay: true,
      originalCorrelationId,
    },
  }, {});

export const getReplayExecutionContext = replayContext;

const toStoredFailure = (error: unknown) => {
  const semantic = toSemanticError(error);
  return {
    code: semantic.code,
    message: semantic.message,
    retryable: semantic.retryable,
  };
};

const throwStoredFailure = (failure?: { code: string; message: string; retryable: boolean }) => {
  if (!failure) {
    throw new SemanticError({
      code: 'IDEMPOTENCY_RECORD_FAILED',
      message: 'Idempotency record is missing failure data.',
    });
  }

  throw new SemanticError({
    code: failure.code as any,
    message: failure.message,
    retryable: failure.retryable,
  });
};

const replayStoredSuccess = <TResult>(record: any): IdempotentCommandResult<TResult> => {
  if (!record.result || record.result.kind !== 'success') {
    throw new SemanticError({
      code: 'IDEMPOTENCY_RECORD_FAILED',
      message: 'Idempotency record is missing success data.',
    });
  }

  return {
    result: record.result.payload as TResult,
    replayed: true,
    originalCorrelationId: record.execution?.correlationId,
  };
};

const assertSameFingerprint = (record: any, requestFingerprint: string) => {
  if (record.requestFingerprint !== requestFingerprint) {
    throw new SemanticError({
      code: 'IDEMPOTENCY_CONFLICT',
      message: 'Idempotency-Key was already used for a different command payload.',
      details: {
        scope: record.scope,
      },
    });
  }
};

const createProcessingRecord = async (
  input: {
    businessSlug: string;
    scope: string;
    operation: string;
    idempotencyKey: string;
    requestFingerprint: string;
    context: ExecutionContext;
    ownerToken: string;
    leaseExpiresAt: Date;
  }
) =>
  (IdempotencyRecord as any).create({
    _id: `idem_${randomUUID()}`,
    businessSlug: input.businessSlug,
    scope: input.scope,
    operation: input.operation,
    idempotencyKey: input.idempotencyKey,
    requestFingerprint: input.requestFingerprint,
    status: 'processing',
    ownerToken: input.ownerToken,
    leaseExpiresAt: input.leaseExpiresAt,
    execution: {
      correlationId: input.context.correlationId,
      firstCausationId: input.context.causationId,
      lastCausationId: input.context.causationId,
      workflowId: input.context.workflowId,
      workflowRunId: input.context.workflowRunId,
      activityId: input.context.activityId,
      channel: input.context.channel,
    },
    attempts: 1,
  });

const acquireExistingRecord = async (record: any, ownerToken: string, leaseExpiresAt: Date, context: ExecutionContext) => {
  const acquired = await IdempotencyRecord.findOneAndUpdate(
    {
      _id: record._id,
      status: { $in: ['processing', 'failed_retryable'] },
      $or: [
        { status: 'failed_retryable' },
        { leaseExpiresAt: { $exists: false } },
        { leaseExpiresAt: { $lte: new Date() } },
      ],
    },
    {
      $set: {
        status: 'processing',
        ownerToken,
        leaseExpiresAt,
        'execution.lastCausationId': context.causationId,
        'execution.workflowId': context.workflowId,
        'execution.workflowRunId': context.workflowRunId,
        'execution.activityId': context.activityId,
      },
      $inc: { attempts: 1 },
      $unset: { failure: '' },
    },
    { returnDocument: 'after' }
  ).exec();

  return acquired;
};

const completeSuccess = async <TResult>(
  recordId: string,
  ownerToken: string,
  result: TResult,
  payload: unknown,
  entityRefs: EntityRef[] | undefined,
  context: ExecutionContext
) => {
  const updated = await IdempotencyRecord.findOneAndUpdate(
    { _id: recordId, ownerToken, status: 'processing' },
    {
      $set: {
        status: 'succeeded',
        result: {
          kind: 'success',
          httpStatus: 200,
          payload,
          entityRefs: entityRefs || [],
        },
        completedAt: new Date(),
        'execution.lastCausationId': context.causationId,
      },
      $unset: { ownerToken: '', leaseExpiresAt: '', failure: '' },
    },
    { returnDocument: 'after' }
  ).exec();

  if (!updated) {
    throw new SemanticError({
      code: 'IDEMPOTENCY_RECORD_FAILED',
      message: 'Failed to persist idempotency success result.',
    });
  }

  return { result, replayed: false };
};

const completeFailure = async (recordId: string, ownerToken: string, error: unknown, context: ExecutionContext) => {
  const failure = toStoredFailure(error);
  const status = finalFailureCodes.has(failure.code) ? 'failed_final' : 'failed_retryable';
  await IdempotencyRecord.findOneAndUpdate(
    { _id: recordId, ownerToken, status: 'processing' },
    {
      $set: {
        status,
        failure,
        completedAt: new Date(),
        'execution.lastCausationId': context.causationId,
      },
      $unset: { ownerToken: '', leaseExpiresAt: '', result: '' },
    }
  ).exec();
};

export const requireIdempotencyKey = (context: ExecutionContext, operation: string) => {
  if (!context.idempotencyKey) {
    throw new SemanticError({
      code: 'IDEMPOTENCY_KEY_REQUIRED',
      message: 'An Idempotency-Key header is required for this operation.',
      details: { operation },
    });
  }
  return context.idempotencyKey;
};

export const executeIdempotentCommand = async <TInput, TResult>(
  command: ExecuteIdempotentCommandInput<TInput, TResult>
): Promise<IdempotentCommandResult<TResult>> => {
  const businessSlug = command.context.businessSlug || (command.input as any)?.businessSlug;
  if (!businessSlug) {
    throw new SemanticError({
      code: 'VALIDATION_ERROR',
      message: 'businessSlug is required for idempotent commands.',
      details: { scope: command.scope },
    });
  }

  const idempotencyKey = command.requireKey
    ? requireIdempotencyKey(command.context, command.operation)
    : command.context.idempotencyKey;
  if (!idempotencyKey) {
    const result = await command.execute();
    return { result, replayed: false };
  }

  const requestFingerprint = fingerprintCommandInput(command.input);
  const ownerToken = `owner_${randomUUID()}`;
  const leaseExpiresAt = new Date(Date.now() + (command.leaseMs || DEFAULT_LEASE_MS));

  let record: any;
  let ownsRecord = false;
  try {
    record = await createProcessingRecord({
      businessSlug,
      scope: command.scope,
      operation: command.operation,
      idempotencyKey,
      requestFingerprint,
      context: command.context,
      ownerToken,
      leaseExpiresAt,
    });
    ownsRecord = true;
  } catch (error) {
    if (!duplicateKey(error)) throw error;
    record = await IdempotencyRecord.findOne({ businessSlug, scope: command.scope, idempotencyKey }).exec();
    if (!record) {
      throw new SemanticError({
        code: 'IDEMPOTENCY_RECORD_FAILED',
        message: 'Idempotency conflict occurred but record could not be loaded.',
      });
    }
  }

  assertSameFingerprint(record, requestFingerprint);

  if (!ownsRecord) {
    if (record.status === 'succeeded') return replayStoredSuccess<TResult>(record);
    if (record.status === 'failed_final') throwStoredFailure(record.failure);

    const acquired = await acquireExistingRecord(record, ownerToken, leaseExpiresAt, command.context);
    if (!acquired) {
      throw new SemanticError({
        code: 'COMMAND_IN_PROGRESS',
        message: 'The idempotent command is already processing.',
        retryable: true,
        details: {
          scope: command.scope,
          idempotencyKey,
        },
      });
    }

    record = acquired;
    ownsRecord = true;
  }

  if (command.reconcile) {
    const reconciled = await command.reconcile({
      input: command.input,
      context: command.context,
      requestFingerprint,
    });
    if (reconciled) {
      return completeSuccess(
        record._id,
        ownerToken,
        reconciled,
        command.buildReplayPayload ? command.buildReplayPayload(reconciled) : reconciled,
        command.entityRefs?.(reconciled),
        command.context
      );
    }
  }

  try {
    const result = await command.execute();
    return await completeSuccess(
      record._id,
      ownerToken,
      result,
      command.buildReplayPayload ? command.buildReplayPayload(result) : result,
      command.entityRefs?.(result),
      command.context
    );
  } catch (error) {
    await completeFailure(record._id, ownerToken, error, command.context);
    throw error;
  }
};

export const reconcileScheduleConsultationResult = async (input: any) => {
  const appointment = await Appointment.findOne({
    businessSlug: input.businessSlug,
    caseId: input.caseId,
    'workflow.idempotencyKey': input.idempotencyKey,
  }).lean().exec();

  if (!appointment) return null;

  const resourceReservation = await ResourceReservation.findOne({
    _id: (appointment as any).resourceReservationId,
    businessSlug: input.businessSlug,
  }).lean().exec();

  if (!resourceReservation) return null;

  const operationalCase = await Case.findOne({
    _id: input.caseId,
    businessSlug: input.businessSlug,
  }).lean().exec();

  if (!operationalCase) return null;

  return {
    appointment,
    resourceReservation,
    case: {
      _id: (operationalCase as any)._id,
      status: (operationalCase as any).status,
    },
  };
};
