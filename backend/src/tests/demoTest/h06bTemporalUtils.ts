import net from 'net';
import mongoose from 'mongoose';
import { Connection, Client, WorkflowHandle } from '@temporalio/client';
import { env } from '../../config/env';
import { Appointment } from '../../models/Appointment.model';
import { Case } from '../../models/Case.model';
import { Customer } from '../../models/Customer.model';
import { CustomerInteraction } from '../../models/CustomerInteraction.model';
import { IdempotencyRecord } from '../../models/IdempotencyRecord.model';
import { ManagedEntity } from '../../models/ManagedEntity.model';
import { ResourceReservation } from '../../models/ResourceReservation.model';
import { TimelineEvent } from '../../models/TimelineEvent.model';
import { getWorkflowProcessContext, startScheduleConsultation } from '../../services/agentSim.service';
import { getTemporalConnectionOptions } from '../../temporal/connectionOptions';
import { TASK_QUEUE } from '../../temporal/types';

export const BUSINESS_SLUG = 'demo_test';
export const TEMPORAL_NAMESPACE = 'default';
export const READINESS_PREFIX = 'hermes-h06b-readiness-';

export type CheckResult = {
  name: string;
  passed: boolean;
  code?: string;
  detail?: string;
};

export type ResidueSummary = {
  customerInteractions: number;
  customers: number;
  managedEntities: number;
  cases: number;
  timelineEvents: number;
  appointments: number;
  resourceReservations: number;
  idempotencyRecords: number;
};

export type ProbeSummary = {
  conversationId: string;
  workflowId: string;
  initialStatus: string;
  terminalStatus: string;
  processContext: {
    workflowType?: string;
    status?: string;
    awaitingType?: string;
    allowedActions: string[];
    optionCount: number;
  };
  workflowStatusAfterCleanup: string;
  readinessPrefixRunningCount: number;
  residue: ResidueSummary;
};

export const makeConversationId = () => `${READINESS_PREFIX}${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

export const connectMongo = async () => {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 10000 });
};

export const disconnectMongo = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};

export const tcpCheck = async (host: string, port: number, timeoutMs = 5000) =>
  new Promise<void>((resolve, reject) => {
    const socket = new net.Socket();
    const onError = (error: Error) => {
      socket.destroy();
      reject(error);
    };
    socket.setTimeout(timeoutMs);
    socket.once('error', onError);
    socket.once('timeout', () => onError(new Error('TCP timeout')));
    socket.connect(port, host, () => {
      socket.end();
      resolve();
    });
  });

export const createTemporalClient = async () => {
  const connectionOptions = getTemporalConnectionOptions();
  const address = connectionOptions.address;
  const [host, rawPort] = address.split(':');
  const port = Number(rawPort || '7233');
  await tcpCheck(host, port, 5000);
  const connection = await Connection.connect(connectionOptions);
  const client = new Client({ connection, namespace: TEMPORAL_NAMESPACE });
  return { address, connection, client };
};

export const describeNamespace = async (connection: Connection) => {
  const response = await connection.workflowService.describeNamespace({
    namespace: TEMPORAL_NAMESPACE,
  } as any);
  return response;
};

export const countReadinessResidue = async (workflowId?: string): Promise<ResidueSummary> => {
  const conversationRx = new RegExp(`^${READINESS_PREFIX}`);

  return {
    customerInteractions: await CustomerInteraction.countDocuments({ conversationId: conversationRx }),
    customers: await Customer.countDocuments({ _id: conversationRx }),
    managedEntities: await ManagedEntity.countDocuments({ _id: conversationRx }),
    cases: await Case.countDocuments({ _id: conversationRx }),
    timelineEvents: await TimelineEvent.countDocuments({ _id: conversationRx }),
    appointments: await Appointment.countDocuments({
      $or: [
        { _id: conversationRx },
        ...(workflowId ? [{ resourceReservationId: workflowId }] : []),
      ],
    }),
    resourceReservations: await ResourceReservation.countDocuments({
      $or: [
        { _id: conversationRx },
        ...(workflowId ? [{ workflowId }] : []),
      ],
    }),
    idempotencyRecords: await IdempotencyRecord.countDocuments({
      $or: [
        { idempotencyKey: conversationRx },
        ...(workflowId ? [{ 'execution.workflowId': workflowId }] : []),
      ],
    }),
  };
};

const deleteDocsByIds = async (model: any, ids: string[]) => {
  for (const id of ids) {
    await model.deleteOne({ _id: id }).exec();
  }
};

export const cleanupReadinessResidue = async (workflowId?: string) => {
  const conversationRx = new RegExp(`^${READINESS_PREFIX}`);

  const interactions = await CustomerInteraction.find({ conversationId: conversationRx }).select({ _id: 1 }).lean().exec();
  const customers = await Customer.find({ _id: conversationRx }).select({ _id: 1 }).lean().exec();
  const managed = await ManagedEntity.find({ _id: conversationRx }).select({ _id: 1 }).lean().exec();
  const cases = await Case.find({ _id: conversationRx }).select({ _id: 1 }).lean().exec();
  const timeline = await TimelineEvent.find({ _id: conversationRx }).select({ _id: 1 }).lean().exec();
  const appointments = await Appointment.find({
    $or: [
      { _id: conversationRx },
      ...(workflowId ? [{ resourceReservationId: workflowId }] : []),
    ],
  }).select({ _id: 1 }).lean().exec();
  const reservations = await ResourceReservation.find({
    $or: [
      { _id: conversationRx },
      ...(workflowId ? [{ workflowId }] : []),
    ],
  }).select({ _id: 1 }).lean().exec();
  const idempotency = await IdempotencyRecord.find({
    $or: [
      { idempotencyKey: conversationRx },
      ...(workflowId ? [{ 'execution.workflowId': workflowId }] : []),
    ],
  }).select({ _id: 1 }).lean().exec();

  await deleteDocsByIds(CustomerInteraction, interactions.map((doc: any) => String(doc._id)));
  await deleteDocsByIds(Customer, customers.map((doc: any) => String(doc._id)));
  await deleteDocsByIds(ManagedEntity, managed.map((doc: any) => String(doc._id)));
  await deleteDocsByIds(Case, cases.map((doc: any) => String(doc._id)));
  await deleteDocsByIds(TimelineEvent, timeline.map((doc: any) => String(doc._id)));
  await deleteDocsByIds(Appointment, appointments.map((doc: any) => String(doc._id)));
  await deleteDocsByIds(ResourceReservation, reservations.map((doc: any) => String(doc._id)));
  await deleteDocsByIds(IdempotencyRecord, idempotency.map((doc: any) => String(doc._id)));
};

const waitForTerminalStatus = async (handle: WorkflowHandle) => {
  let workflowResult: any;
  try {
    workflowResult = await handle.result();
  } catch {
    // This probe uses an in-workflow cancel signal rather than server-side cancellation.
  }

  for (let attempt = 0; attempt < 20; attempt++) {
    const description = await handle.describe();
    if (description.status.name !== 'RUNNING') {
      return {
        executionStatus: description.status.name,
        workflowStatus: String(workflowResult?.status || ''),
      };
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  const description = await handle.describe();
  return {
    executionStatus: description.status.name,
    workflowStatus: String(workflowResult?.status || ''),
  };
};

export const runTemporalProbe = async (): Promise<ProbeSummary> => {
  const conversationId = makeConversationId();
  const startedState = await startScheduleConsultation(BUSINESS_SLUG);
  const workflowId = String(startedState.workflowId || '');
  if (!workflowId) {
    throw new Error('TEMPORAL_WORKFLOW_NOT_REGISTERED: workflow probe did not return a workflowId.');
  }

  const { connection, client } = await createTemporalClient();
  const handle = client.workflow.getHandle(workflowId);

  const processContext = await getWorkflowProcessContext(workflowId) as any;
  await handle.signal('cancelWorkflow', { reason: `cleanup:${conversationId}` });
  const terminal = await waitForTerminalStatus(handle);
  const description = await handle.describe();

  let readinessPrefixRunningCount = 0;
  for await (const execution of client.workflow.list({ query: 'ExecutionStatus="Running"' })) {
    if (execution.workflowId.startsWith(READINESS_PREFIX)) {
      readinessPrefixRunningCount += 1;
    }
  }

  await connectMongo();
  const residue = await countReadinessResidue(workflowId);
  await disconnectMongo();
  await connection.close();

  return {
    conversationId,
    workflowId,
    initialStatus: startedState.status,
    terminalStatus: terminal.workflowStatus || description.status.name,
    processContext: {
      workflowType: processContext?.process?.workflowType,
      status: processContext?.process?.status,
      awaitingType: processContext?.awaiting?.type,
      allowedActions: Array.isArray(processContext?.allowedActions) ? processContext.allowedActions : [],
      optionCount: Array.isArray(processContext?.availableOptions) ? processContext.availableOptions.length : 0,
    },
    workflowStatusAfterCleanup: description.status.name,
    readinessPrefixRunningCount,
    residue,
  };
};

export const summarizeChecks = (checks: CheckResult[]) => {
  const failed = checks.filter((check) => !check.passed);
  return {
    ok: failed.length === 0,
    total: checks.length,
    passed: checks.length - failed.length,
    failed: failed.length,
    checks,
  };
};
