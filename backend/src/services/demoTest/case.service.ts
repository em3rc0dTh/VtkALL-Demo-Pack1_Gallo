import { randomUUID } from 'crypto';
import { Case } from '../../models/Case.model';
import { Customer } from '../../models/Customer.model';
import { ManagedEntity } from '../../models/ManagedEntity.model';
import { DemoTestDomainError, assertRequired } from './errors';
import { ExecutionContext, executeIdempotentCommand } from './core';
import { recordTimelineEvent } from './timeline.service';
import { CreateOperationalCaseInput, GetCaseByIdInput, UpdateCaseStatusInput } from './types';

const normalizeBusinessSlugForCaseNumber = (businessSlug: string) =>
  businessSlug.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'DEMO_TEST';

const getInitialStatus = (verticalType?: string) => {
  if (verticalType === 'custom_orders') {
    return 'inquiry';
  }
  return 'lead';
};

const getInitialStatusGroup = (status: string) => {
  if (status === 'inquiry') {
    return 'inquiry';
  }
  return 'lead';
};

const ensureCustomer = async (businessSlug: string, customerId: string) => {
  const customer = await Customer.findOne({ _id: customerId, businessSlug }).exec();
  if (!customer) {
    throw new DemoTestDomainError('CUSTOMER_NOT_FOUND', 'Customer was not found.', { customerId, businessSlug }, 404);
  }
  return customer;
};

const ensureManagedEntity = async (businessSlug: string, managedEntityId: string, customerId: string) => {
  const managedEntity = await ManagedEntity.findOne({ _id: managedEntityId, businessSlug }).exec();
  if (!managedEntity) {
    throw new DemoTestDomainError('MANAGED_ENTITY_NOT_FOUND', 'ManagedEntity was not found.', {
      managedEntityId,
      businessSlug,
    }, 404);
  }

  if ((managedEntity as any).customerId !== customerId) {
    throw new DemoTestDomainError('VALIDATION_ERROR', 'ManagedEntity must belong to the same Customer.', {
      managedEntityId,
      customerId,
      actualCustomerId: (managedEntity as any).customerId,
    }, 400);
  }

  return managedEntity;
};

const buildCaseNumber = async (businessSlug: string) => {
  const year = new Date().getUTCFullYear();
  const prefix = `${normalizeBusinessSlugForCaseNumber(businessSlug)}-${year}`;
  // TODO(PR-007): replace count-based numbering with an atomic counter scoped by businessSlug + year.
  const existingCases = await Case.countDocuments({ businessSlug, caseNumber: { $regex: `^${prefix}-` } }).exec();
  return `${prefix}-${String(existingCases + 1).padStart(4, '0')}`;
};

// Policy: Case is the operational root. Cita/Appointment must not become the canonical demo_test root.
const createOperationalCaseOnce = async (input: CreateOperationalCaseInput, context?: ExecutionContext): Promise<unknown> => {
  assertRequired(input.businessSlug, 'businessSlug');
  assertRequired(input.customerId, 'customerId');

  await ensureCustomer(input.businessSlug, input.customerId);
  if (input.managedEntityId) {
    await ensureManagedEntity(input.businessSlug, input.managedEntityId, input.customerId);
  }

  const status = input.status || getInitialStatus(input.verticalType);
  const caseId = `case_${randomUUID()}`;
  const caseNumber = await buildCaseNumber(input.businessSlug);
  const operationalCase = await (Case as any).create({
    _id: caseId,
    businessSlug: input.businessSlug,
    customerId: input.customerId,
    ...(input.managedEntityId ? { managedEntityId: input.managedEntityId } : {}),
    verticalType: input.verticalType || 'other',
    caseNumber,
    status,
    statusGroup: input.statusGroup || getInitialStatusGroup(status),
    priority: input.priority || 'normal',
    ...(input.source ? { source: input.source } : {}),
    ...(input.intent ? { intent: input.intent } : {}),
    metadata: {
      ...(input.metadata || {}),
      ...(context?.idempotencyKey ? { idempotencyKey: context.idempotencyKey } : {}),
      ...(context?.correlationId ? { correlationId: context.correlationId } : {}),
    },
  });

  try {
    await recordTimelineEvent({
      businessSlug: input.businessSlug,
      caseId,
      eventType: 'case.created',
      title: 'Case created',
      description: `Operational case ${caseNumber} was created.`,
      visibility: 'internal',
      actor: { type: 'system', name: 'demo_test' },
      metadata: {
        caseNumber,
        customerId: input.customerId,
        managedEntityId: input.managedEntityId,
        verticalType: input.verticalType || 'other',
      },
    }, context);
  } catch (error) {
    throw new DemoTestDomainError('TIMELINE_WRITE_FAILED', 'Case was created but timeline write failed.', {
      caseId,
      caseNumber,
      cause: error instanceof Error ? error.message : String(error),
    }, 500);
  }

  return operationalCase;
};

export const createOperationalCase = async (input: CreateOperationalCaseInput, context?: ExecutionContext): Promise<unknown> => {
  if (!context?.idempotencyKey) return createOperationalCaseOnce(input, context);

  const idempotent = await executeIdempotentCommand<CreateOperationalCaseInput, unknown>({
    scope: 'case.create',
    operation: 'createOperationalCase',
    input,
    context,
    execute: () => createOperationalCaseOnce(input, context),
    entityRefs: (operationalCase) => [{ type: 'Case', id: String((operationalCase as any)._id) }],
  });

  return idempotent.result;
};

export const getCaseById = async (input: GetCaseByIdInput): Promise<unknown> => {
  assertRequired(input.businessSlug, 'businessSlug');
  assertRequired(input.caseId, 'caseId');

  const operationalCase = await Case.findOne({ _id: input.caseId, businessSlug: input.businessSlug }).exec();
  if (!operationalCase) {
    throw new DemoTestDomainError('CASE_NOT_FOUND', 'Case was not found.', {
      caseId: input.caseId,
      businessSlug: input.businessSlug,
    }, 404);
  }

  return operationalCase;
};

export const updateCaseStatus = async (input: UpdateCaseStatusInput, context?: ExecutionContext): Promise<unknown> => {
  assertRequired(input.businessSlug, 'businessSlug');
  assertRequired(input.caseId, 'caseId');
  assertRequired(input.status, 'status');

  const updatedCase = await Case.findOneAndUpdate(
    { _id: input.caseId, businessSlug: input.businessSlug },
    {
      $set: {
        status: input.status,
        ...(input.statusGroup ? { statusGroup: input.statusGroup } : {}),
      },
    },
    { returnDocument: 'after' }
  ).exec();

  if (!updatedCase) {
    throw new DemoTestDomainError('CASE_NOT_FOUND', 'Case was not found.', {
      caseId: input.caseId,
      businessSlug: input.businessSlug,
    }, 404);
  }

  await recordTimelineEvent({
    businessSlug: input.businessSlug,
    caseId: input.caseId,
    eventType: 'status.changed',
    title: 'Status changed',
    description: input.reason || `Case status changed to ${input.status}.`,
    visibility: 'internal',
    actor: { type: 'system', name: 'demo_test' },
    metadata: {
      status: input.status,
      statusGroup: input.statusGroup,
    },
  }, context);

  return updatedCase;
};
