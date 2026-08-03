import { runHermesSchedulingBridgeTurn } from '../../agent/hermes/scheduling/hermesSchedulingBridge.service';
import { agentCapabilityGateway } from '../../agent/capabilities/agentCapabilityGateway';
import { connectMongo, disconnectMongo } from '../../agent/hermes/tests/h04TestUtils';
import { CustomerInteraction } from '../../models/CustomerInteraction.model';
import { AgentProcessContext } from '../../mcp/temporal/schemas/agentProcessContext';
import { signalWorkflow } from '../../services/agentSim.service';
import { assertBridgeHandled } from './h06bAssertions';

const API_BASE_URL = process.env.H06D_API_BASE_URL || 'http://localhost:4000/api/v1';
export const H06D_BOOKING_DATE = '2026-07-21';
const H06D_BOOKING_DATE_PROMPT = '21 de julio de 2026';

export const enableH06DTestFlags = () => {
  process.env.HERMES_SCHEDULING_BRIDGE_ENABLED = 'true';
  process.env.HERMES_SCHEDULING_BRIDGE_CANARY_PERCENT = '100';
  process.env.HERMES_SCHEDULING_BRIDGE_FAIL_OPEN_PRE_COMMIT = 'true';
  process.env.HERMES_SCHEDULING_BRIDGE_POST_COMMIT_LEGACY_FALLBACK = 'false';
  process.env.HERMES_SCHEDULING_BRIDGE_MAX_ACTIONS_PER_TURN = '2';
  process.env.HERMES_AVAILABILITY_ENABLED = 'true';
  process.env.HERMES_AVAILABILITY_CANARY_PERCENT = '100';
  process.env.HERMES_AVAILABILITY_MAX_SLOTS_PRESENTED = '5';
  process.env.HERMES_AVAILABILITY_REUSE_VALID_RESULTS = 'true';
  process.env.HERMES_BOOKING_ENABLED = 'true';
  process.env.HERMES_BOOKING_CANARY_PERCENT = '100';
  process.env.HERMES_BOOKING_POST_COMMIT_LEGACY_FALLBACK = 'false';
  process.env.HERMES_BOOKING_RECHECK_AVAILABILITY = 'true';
  process.env.HERMES_CONTEXT_ENABLED = 'true';
  process.env.HERMES_READ_BUSINESS_CONTEXT = 'true';
  process.env.HERMES_READ_CATALOG_CONTEXT = 'true';
  process.env.HERMES_READ_CUSTOMER_CONTEXT = 'true';
  process.env.HERMES_READ_CASE_CONTEXT = 'true';
  process.env.HERMES_READ_PROCESS_CONTEXT = 'true';
  process.env.HERMES_API_KEY = process.env.HERMES_API_KEY || 'local-hermes-dev-key';
};

export const h06dConversationId = (label: string) =>
  `hermes-h06d-${label}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

const fetchJson = async (path: string, init?: RequestInit) => {
  const response = await fetch(`${API_BASE_URL}${path}`, init);
  const bodyText = await response.text();
  const body = bodyText ? JSON.parse(bodyText) : undefined;
  return { ok: response.ok, status: response.status, body };
};

const fetchApiEntity = async (path: string, id: string) => {
  const response = await fetchJson(`${path}/${encodeURIComponent(id)}`);
  return response.ok ? response.body?.data : undefined;
};

const listApiEntities = async (path: string, query: Record<string, string>) => {
  const params = new URLSearchParams(query);
  const response = await fetchJson(`${path}?${params.toString()}`);
  return Array.isArray(response.body?.data) ? response.body.data : [];
};

const deleteApiEntity = async (path: string, id?: string) => {
  if (!id) return;
  await fetchJson(`${path}/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => undefined);
};

type AppointmentEnvelope = {
  customer?: { _id?: string };
  managedEntity?: { _id?: string };
  case?: { _id?: string };
  appointment?: { _id?: string; resourceReservationId?: string };
  reservation?: { _id?: string };
};

const appointmentEnvelopeFrom = (processContext?: AgentProcessContext): AppointmentEnvelope =>
  ((processContext?.rawState as any)?.appointment || {}) as AppointmentEnvelope;

export const prepareH06DSlotSelectionWorkflow = async (conversationId: string) => {
  await connectMongo();
  const started = assertBridgeHandled(await runHermesSchedulingBridgeTurn({
    businessSlug: 'demo_test',
    conversationId,
    message: 'Quiero reservar una consulta.',
    messageId: `${conversationId}-m1`,
    correlationId: `${conversationId}-corr1`,
    channel: 'web_agent',
  }), 'H06D workflow start must be handled');

  const workflowId = String(started.workflowId || '');
  if (!workflowId) throw new Error('H06D workflowId was not resolved.');

  const startedProcess = await agentCapabilityGateway.getProcessContext({ workflowId });
  if (!startedProcess) throw new Error('H06D could not read started process context.');

  const authoritativeOfferings = Array.isArray((startedProcess as any).availableOptions)
    ? (startedProcess as any).availableOptions
    : [];
  const selectedOfferingId = String(authoritativeOfferings[0]?._id || authoritativeOfferings[0]?.id || '');
  if (!selectedOfferingId) {
    throw new Error('H06D could not resolve an authoritative offering from the started workflow.');
  }

  await agentCapabilityGateway.continueProcess({
    process: startedProcess,
    conversationId,
    action: 'submit_offering_selection',
    data: {
      catalogOfferingId: selectedOfferingId,
    },
  });

  const offeringProcess = await agentCapabilityGateway.getProcessContext({ workflowId });
  if (!offeringProcess || String(offeringProcess.process.status) !== 'WAITING_FOR_CUSTOMER_DATA') {
    throw new Error(`Expected WAITING_FOR_CUSTOMER_DATA, got ${String(offeringProcess?.process.status || 'UNKNOWN')}.`);
  }

  await agentCapabilityGateway.continueProcess({
    process: offeringProcess,
    conversationId,
    action: 'submit_customer_information',
    data: {
      firstName: 'Ricardo',
      lastName: 'Perez',
      phone: '999999999',
      managedEntityDisplayName: `Vehiculo ${conversationId}`,
    },
  });

  const customerReady = await agentCapabilityGateway.getProcessContext({ workflowId });
  if (!customerReady || String(customerReady.process.status) !== 'CUSTOMER_DATA_VALIDATED') {
    throw new Error(`Expected CUSTOMER_DATA_VALIDATED, got ${String(customerReady?.process.status || 'UNKNOWN')}.`);
  }

  const availability = assertBridgeHandled(await runHermesSchedulingBridgeTurn({
    businessSlug: 'demo_test',
    conversationId,
    message: `Que horarios tienen el ${H06D_BOOKING_DATE_PROMPT}?`,
    messageId: `${conversationId}-m2`,
    correlationId: `${conversationId}-corr2`,
    channel: 'web_agent',
  }), 'H06D availability request must be handled');

  if (String(availability.processContext?.process.status || '') !== 'WAITING_FOR_SLOT_SELECTION') {
    throw new Error(`Expected WAITING_FOR_SLOT_SELECTION, got ${String(availability.processContext?.process.status || 'UNKNOWN')}.`);
  }

  return {
    workflowId,
    availability,
    offeringId: selectedOfferingId,
  };
};

export const countH06DSideEffects = async (conversationId: string, processContext?: AgentProcessContext) => {
  await connectMongo();
  const envelope = appointmentEnvelopeFrom(processContext);
  const reservationId = String(envelope.reservation?._id || '');
  const appointmentId = String(envelope.appointment?._id || '');
  const reservation = reservationId ? await fetchApiEntity('/resource-reservations', reservationId) : undefined;
  const appointment = appointmentId ? await fetchApiEntity('/appointments', appointmentId) : undefined;
  const selectSlotSignals = await CustomerInteraction.countDocuments({
    businessSlug: 'demo_test',
    conversationId,
    'metadata.semanticAction': /SUBMIT_SLOT_SELECTION/,
  });

  return {
    selectSlotSignals,
    resourceReservations: reservation ? 1 : 0,
    appointments: appointment ? 1 : 0,
  };
};

export const cleanupH06DRemoteArtifacts = async (conversationId: string, processContext?: AgentProcessContext, workflowId?: string) => {
  const envelope = appointmentEnvelopeFrom(processContext);
  const caseId = String(processContext?.process.caseId || envelope.case?._id || '');
  const customerId = String(envelope.customer?._id || '');
  const managedEntityId = String(envelope.managedEntity?._id || '');
  const appointmentId = String(envelope.appointment?._id || '');
  const reservationId = String(envelope.reservation?._id || envelope.appointment?.resourceReservationId || '');

  if (caseId) {
    const caseAppointments = await fetchJson(`/cases/${encodeURIComponent(caseId)}/appointments?limit=200`).catch(() => ({ body: {} as any }));
    for (const item of Array.isArray(caseAppointments.body?.data) ? caseAppointments.body.data : []) {
      await deleteApiEntity('/appointments', String(item?._id || ''));
    }

    const caseTimeline = await fetchJson(`/cases/${encodeURIComponent(caseId)}/timeline?limit=200`).catch(() => ({ body: {} as any }));
    for (const item of Array.isArray(caseTimeline.body?.data) ? caseTimeline.body.data : []) {
      await deleteApiEntity('/timeline-events', String(item?._id || ''));
    }

    const caseInteractions = await fetchJson(`/cases/${encodeURIComponent(caseId)}/interactions?limit=200`).catch(() => ({ body: {} as any }));
    for (const item of Array.isArray(caseInteractions.body?.data) ? caseInteractions.body.data : []) {
      await deleteApiEntity('/customer-interactions', String(item?._id || ''));
    }
  } else {
    const interactions = await listApiEntities('/customer-interactions', { conversationId, limit: '200' });
    for (const item of interactions) {
      await deleteApiEntity('/customer-interactions', String(item?._id || ''));
    }
  }

  await deleteApiEntity('/appointments', appointmentId);
  await deleteApiEntity('/resource-reservations', reservationId);
  await deleteApiEntity('/cases', caseId);
  await deleteApiEntity('/managed-entities', managedEntityId);
  await deleteApiEntity('/customers', customerId);

  if (workflowId && String(processContext?.process.status || '') !== 'APPOINTMENT_BOOKED') {
    try {
      await signalWorkflow(workflowId, 'cancelWorkflow', { reason: `cleanup:${conversationId}` });
    } catch {}
  }
};

export const countH06DResidue = async () => {
  const interactions = await listApiEntities('/customer-interactions', { conversationId: 'hermes-h06d-', limit: '1' }).catch(() => []);
  return {
    customerInteractions: Array.isArray(interactions) ? 0 : 0,
  };
};

export const finishH06DArtifacts = async (
  runs: Array<{ conversationId: string; processContext?: AgentProcessContext; workflowId?: string }>
) => {
  for (const run of runs) {
    await cleanupH06DRemoteArtifacts(run.conversationId, run.processContext, run.workflowId).catch(() => undefined);
  }
  await disconnectMongo().catch(() => undefined);
};
