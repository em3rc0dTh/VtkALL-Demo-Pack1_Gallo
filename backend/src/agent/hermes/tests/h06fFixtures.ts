import http from 'http';
import type { AddressInfo } from 'net';
import mongoose from 'mongoose';
import app from '../../../app';
import { connectMongo, disconnectMongo } from './h04TestUtils';
import { Appointment } from '../../../models/Appointment.model';
import { CustomerInteraction } from '../../../models/CustomerInteraction.model';
import { IdempotencyRecord } from '../../../models/IdempotencyRecord.model';
import { ResourceReservation } from '../../../models/ResourceReservation.model';
import { signalWorkflow } from '../../../services/agentSim.service';

export const enableH06FShadowOnlyFlags = () => {
  process.env.TEMPORAL_ADDRESS = process.env.TEMPORAL_ADDRESS || '127.0.0.1:7233';
  process.env.HERMES_ENABLED = 'true';
  process.env.HERMES_SHADOW_ENABLED = 'false';
  process.env.HERMES_PERSIST_SHADOW = 'false';
  process.env.HERMES_CONTEXT_ENABLED = 'true';
  process.env.HERMES_READ_BUSINESS_CONTEXT = 'true';
  process.env.HERMES_READ_CATALOG_CONTEXT = 'true';
  process.env.HERMES_READ_CUSTOMER_CONTEXT = 'true';
  process.env.HERMES_READ_CASE_CONTEXT = 'true';
  process.env.HERMES_READ_PROCESS_CONTEXT = 'true';
  process.env.HERMES_QA_VISIBLE_ENABLED = 'false';
  process.env.HERMES_QA_CANARY_PERCENT = '0';
  process.env.HERMES_QA_FAIL_OPEN = 'true';
  process.env.HERMES_SCHEDULING_BRIDGE_ENABLED = 'false';
  process.env.HERMES_SCHEDULING_BRIDGE_CANARY_PERCENT = '0';
  process.env.HERMES_AVAILABILITY_ENABLED = 'false';
  process.env.HERMES_BOOKING_ENABLED = 'false';
};

export const enableH06FVisibleFlags = (canaryPercent: number) => {
  enableH06FShadowOnlyFlags();
  process.env.HERMES_VISIBLE_RUNTIME_ENABLED = 'true';
  process.env.HERMES_VISIBLE_RUNTIME_CANARY_PERCENT = String(canaryPercent);
  process.env.HERMES_VISIBLE_RUNTIME_FAIL_OPEN = 'true';
  process.env.HERMES_VISIBLE_RUNTIME_POST_COMMIT_LEGACY_FALLBACK = 'false';
};

export const h06fConversationId = (label: string) =>
  `hermes-h06f-${label}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

export const forbiddenDtoTerms = [
  'dispatchPlan',
  'skillInvocation',
  'skillResult',
  'responseCandidate',
  'selectedSkill',
  'scheduling-specialist',
  'catalog-advisor',
  'recovery-escalation',
  'prompt',
];

export const assertNoDtoLeak = (payload: unknown) => {
  const text = JSON.stringify(payload);
  if (forbiddenDtoTerms.some((term) => text.includes(term))) {
    throw new Error('Internal Hermes DTO fields leaked into the public response.');
  }
};

export const startH06FServer = async () => {
  await connectMongo();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as AddressInfo).port;
  return {
    server,
    baseUrl: `http://127.0.0.1:${port}`,
    close: async () => {
      await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    },
  };
};

export const restartMongo = async () => {
  await disconnectMongo();
  await connectMongo();
};

export const apiPost = async (baseUrl: string, path: string, body: Record<string, unknown>, headers: Record<string, string> = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  const json = text ? JSON.parse(text) : undefined;
  return { ok: response.ok, status: response.status, body: json };
};

export const apiGet = async (baseUrl: string, path: string) => {
  const response = await fetch(`${baseUrl}${path}`);
  const text = await response.text();
  const json = text ? JSON.parse(text) : undefined;
  return { ok: response.ok, status: response.status, body: json };
};

export const countVisibleOutbounds = async (businessSlug: string, conversationId: string) =>
  CustomerInteraction.countDocuments({
    businessSlug,
    conversationId,
    direction: 'outbound',
    visibility: 'customer',
  });

export const collectTurnDocs = async (businessSlug: string, conversationId: string, correlationId: string) =>
  CustomerInteraction.find({
    businessSlug,
    conversationId,
    'execution.correlationId': correlationId,
  }).sort({ createdAt: 1, _id: 1 }).lean().exec();

export const summarizeTurnArtifacts = async (businessSlug: string, conversationId: string, correlationId: string) => {
  const docs: any[] = await collectTurnDocs(businessSlug, conversationId, correlationId);
  const byRuntimeMode = (mode: string) => docs.filter((doc) => doc?.metadata?.runtimeMode === mode);
  return {
    docs,
    inbound: docs.filter((doc) => doc.direction === 'inbound' && doc.visibility === 'customer').length,
    visibleOutbound: docs.filter((doc) => doc.direction === 'outbound' && doc.visibility === 'customer').length,
    dispatchPlans: byRuntimeMode('reception_desk_orchestrator').length,
    skillInvocations: byRuntimeMode('skill_dispatch_registry').filter((doc) => String(doc.body || '').includes('Hermes skill invocation')).length,
    skillResults: byRuntimeMode('skill_dispatch_registry').filter((doc) => String(doc.body || '').includes('Hermes skill result')).length,
    responseCandidates: byRuntimeMode('response_candidate_synthesizer').length,
    leakedInternalVisible: docs.some((doc) =>
      doc.visibility === 'customer'
      && /Hermes dispatch plan|Hermes skill invocation|Hermes skill result|Hermes response candidate/i.test(String(doc.body || ''))
    ),
  };
};

export const extractOfferingName = (state: any) =>
  String(
    state?.catalog?.[0]?.name
    || state?.availableOptions?.[0]?.name
    || state?.selectedOffering?.name
    || state?.selectedOffering?.displayName
    || ''
  ).trim();

export const ensureAppointmentFree = async (workflowId?: string) => {
  const reservationCount = workflowId
    ? await ResourceReservation.countDocuments({ workflowId })
    : 0;
  const appointmentCount = workflowId
    ? await Appointment.countDocuments({ resourceReservationId: workflowId })
    : 0;
  if (reservationCount !== 0 || appointmentCount !== 0) {
    throw new Error('Shadow-only flow created operational booking artifacts.');
  }
};

export const cleanupH06FConversation = async (businessSlug: string, conversationId: string) => {
  await connectMongo();
  const workflowIds = (await CustomerInteraction.find({
    businessSlug,
    conversationId,
    workflowId: { $exists: true, $ne: null },
  }).select({ workflowId: 1 }).lean().exec())
    .map((doc: any) => String(doc.workflowId))
    .filter(Boolean);

  for (const workflowId of [...new Set(workflowIds)]) {
    try {
      await signalWorkflow(workflowId, 'cancelWorkflow', { reason: `cleanup:${conversationId}` });
    } catch {}
  }

  await CustomerInteraction.deleteMany({ businessSlug, conversationId }).exec();
  await IdempotencyRecord.deleteMany({
    $or: [
      { idempotencyKey: new RegExp(conversationId) },
      { 'execution.workflowId': { $in: workflowIds } },
    ],
  }).exec();
  await Appointment.deleteMany({
    $or: [
      { _id: new RegExp(conversationId) },
      ...(workflowIds.length ? [{ resourceReservationId: { $in: workflowIds } }] : []),
    ],
  }).exec();
  await ResourceReservation.deleteMany({
    $or: [
      { _id: new RegExp(conversationId) },
      ...(workflowIds.length ? [{ workflowId: { $in: workflowIds } }] : []),
    ],
  }).exec();
};

export const countH06FResidue = async () => {
  await connectMongo();
  const prefix = /^hermes-h06f-/;
  return {
    customerInteractions: await CustomerInteraction.countDocuments({ conversationId: prefix }),
    idempotencyRecords: await IdempotencyRecord.countDocuments({ idempotencyKey: prefix }),
    appointments: await Appointment.countDocuments({ _id: prefix }),
    resourceReservations: await ResourceReservation.countDocuments({ _id: prefix }),
  };
};

export const resetConnections = async () => {
  if (mongoose.connection.readyState !== 0) {
    await disconnectMongo();
  }
};
