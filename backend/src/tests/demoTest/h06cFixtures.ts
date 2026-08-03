import { Appointment } from '../../models/Appointment.model';
import { CatalogOffering } from '../../models/CatalogOffering.model';
import { CustomerInteraction } from '../../models/CustomerInteraction.model';
import { IdempotencyRecord } from '../../models/IdempotencyRecord.model';
import { ResourceReservation } from '../../models/ResourceReservation.model';
import { WorkTeam } from '../../models/WorkTeam.model';
import { WorkTeamScheduleOverride } from '../../models/WorkTeamScheduleOverride.model';
import { WorkTeamScheduleRule } from '../../models/WorkTeamScheduleRule.model';
import { connectMongo, disconnectMongo } from '../../agent/hermes/tests/h04TestUtils';
import { runHermesSchedulingBridgeTurn } from '../../agent/hermes/scheduling/hermesSchedulingBridge.service';
import { agentCapabilityGateway } from '../../agent/capabilities/agentCapabilityGateway';
import { assertBridgeHandled } from './h06bAssertions';
import { signalWorkflow } from '../../services/agentSim.service';

export const H06C_AVAILABLE_DATE = '2026-07-21';
export const H06C_BLOCKED_DATE = '2026-07-25';

export const enableH06CTestFlags = () => {
  process.env.HERMES_SCHEDULING_BRIDGE_ENABLED = 'true';
  process.env.HERMES_SCHEDULING_BRIDGE_CANARY_PERCENT = '100';
  process.env.HERMES_SCHEDULING_BRIDGE_FAIL_OPEN_PRE_COMMIT = 'true';
  process.env.HERMES_SCHEDULING_BRIDGE_POST_COMMIT_LEGACY_FALLBACK = 'false';
  process.env.HERMES_SCHEDULING_BRIDGE_MAX_ACTIONS_PER_TURN = '2';
  process.env.HERMES_AVAILABILITY_ENABLED = 'true';
  process.env.HERMES_AVAILABILITY_CANARY_PERCENT = '100';
  process.env.HERMES_AVAILABILITY_MAX_SLOTS_PRESENTED = '5';
  process.env.HERMES_AVAILABILITY_REUSE_VALID_RESULTS = 'true';
  process.env.HERMES_CONTEXT_ENABLED = 'true';
  process.env.HERMES_READ_BUSINESS_CONTEXT = 'true';
  process.env.HERMES_READ_CATALOG_CONTEXT = 'true';
  process.env.HERMES_READ_CUSTOMER_CONTEXT = 'true';
  process.env.HERMES_READ_CASE_CONTEXT = 'true';
  process.env.HERMES_READ_PROCESS_CONTEXT = 'true';
};

export const h06cConversationId = (label: string) =>
  `hermes-h06c-${label}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

export const createH06CFixtures = async (conversationId: string) => {
  await connectMongo();
  const suffix = conversationId.replace(/[^a-z0-9]/gi, '').slice(-8) || 'h06c';
  const teamId = `${conversationId}-team`;
  const offeringId = `${conversationId}-offering`;

  await (WorkTeam as any).create({
    _id: teamId,
    businessSlug: 'demo_test',
    name: `Equipo H06C ${suffix}`,
    type: 'consultation',
    capacity: 1,
    slotGranularityMinutes: 60,
    active: true,
  });

  await (CatalogOffering as any).create({
    _id: offeringId,
    businessSlug: 'demo_test',
    active: true,
    publicVisible: true,
    name: `Consulta H06C ${suffix}`,
    description: 'Consulta real H06C',
    durationMinutes: 60,
    pricing: { type: 'not_published', currency: 'PEN' },
    fulfillmentPolicy: {
      suggestedTeamId: teamId,
      estimatedDurationMinutes: 60,
      slotGranularityMinutes: 60,
      appointmentType: 'consultation',
    },
  });

  for (const weekday of [2, 3]) {
    await (WorkTeamScheduleRule as any).create({
      _id: `${conversationId}-rule-${weekday}`,
      businessSlug: 'demo_test',
      teamId,
      weekday,
      startTime: '09:00',
      endTime: '12:00',
      capacity: 1,
      active: true,
    });
  }

  await (WorkTeamScheduleOverride as any).create({
    _id: `${conversationId}-override-blocked`,
    businessSlug: 'demo_test',
    teamId,
    date: H06C_BLOCKED_DATE,
    mode: 'block',
    windows: [],
    active: true,
  });

  return {
    teamId,
    offeringId,
    offeringName: `Consulta H06C ${suffix}`,
  };
};

export const prepareH06CReadyWorkflow = async (conversationId: string, offeringId: string) => {
  const started = assertBridgeHandled(await runHermesSchedulingBridgeTurn({
    businessSlug: 'demo_test',
    conversationId,
    message: 'Quiero reservar una consulta.',
    messageId: `${conversationId}-m1`,
    correlationId: `${conversationId}-corr1`,
    channel: 'web_agent',
  }), 'workflow start must be handled');

  const workflowId = String(started.workflowId || '');
  if (!workflowId) {
    throw new Error('H06C workflowId was not resolved.');
  }

  const startedProcess = await agentCapabilityGateway.getProcessContext({ workflowId });
  if (!startedProcess) {
    throw new Error('H06C could not read the started process context.');
  }
  const authoritativeOfferings = Array.isArray((startedProcess as any).availableOptions)
    ? (startedProcess as any).availableOptions
    : [];
  const selectedOption = authoritativeOfferings.find((option: any) =>
    String(option?.id || option?._id || '') === offeringId
  ) || authoritativeOfferings[0];
  const selectedOfferingId = String(selectedOption?.id || selectedOption?._id || '');
  const selectedTeamId = String(selectedOption?.fulfillmentPolicy?.suggestedTeamId || '');
  if (!selectedOfferingId) {
    throw new Error('H06C could not resolve an authoritative offering from the started workflow.');
  }
  if (!selectedTeamId) {
    throw new Error('H06C could not resolve an authoritative team for availability overrides.');
  }

  await (WorkTeamScheduleOverride as any).findOneAndUpdate(
    { _id: `${conversationId}-override-available` },
    {
      $set: {
        _id: `${conversationId}-override-available`,
        businessSlug: 'demo_test',
        teamId: selectedTeamId,
        date: H06C_AVAILABLE_DATE,
        mode: 'replace',
        windows: [{ startTime: '09:00', endTime: '12:00', capacity: 1 }],
        active: true,
      },
    },
    { upsert: true }
  ).exec();
  await (WorkTeamScheduleOverride as any).findOneAndUpdate(
    { _id: `${conversationId}-override-blocked-runtime` },
    {
      $set: {
        _id: `${conversationId}-override-blocked-runtime`,
        businessSlug: 'demo_test',
        teamId: selectedTeamId,
        date: H06C_BLOCKED_DATE,
        mode: 'block',
        windows: [],
        active: true,
      },
    },
    { upsert: true }
  ).exec();

  await agentCapabilityGateway.continueProcess({
    process: startedProcess,
    conversationId,
    action: 'submit_offering_selection',
    data: {
      catalogOfferingId: selectedOfferingId,
    },
  });
  const offeringProcess = await agentCapabilityGateway.getProcessContext({ workflowId });
  if (!offeringProcess || String(offeringProcess.process?.status || '') !== 'WAITING_FOR_CUSTOMER_DATA') {
    throw new Error(`Expected WAITING_FOR_CUSTOMER_DATA after offering selection, received ${String(offeringProcess?.process?.status || 'UNKNOWN')}.`);
  }

  const continued = await agentCapabilityGateway.continueProcess({
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
  const authoritative = await agentCapabilityGateway.getProcessContext({ workflowId });
  const state = (authoritative as any)?.rawState || (continued as any)?.rawState || { status: (authoritative as any)?.process?.status || (continued as any)?.process?.status };

  if (String(state?.status || '') !== 'CUSTOMER_DATA_VALIDATED') {
    throw new Error(`Expected CUSTOMER_DATA_VALIDATED, received ${String(state?.status || 'UNKNOWN')}.`);
  }

  return {
    workflowId,
    state,
  };
};

export const countH06CSideEffects = async (conversationId: string, workflowId?: string) => {
  await connectMongo();
  return {
    selectSlotSignals: await CustomerInteraction.countDocuments({
      businessSlug: 'demo_test',
      conversationId,
      'metadata.semanticAction': /SUBMIT_SLOT_SELECTION/,
    }),
    resourceReservations: await ResourceReservation.countDocuments({
      $or: [
        { _id: new RegExp(`^${conversationId}`) },
        ...(workflowId ? [{ workflowId }] : []),
      ],
    }),
    appointments: await Appointment.countDocuments({
      $or: [
        { _id: new RegExp(`^${conversationId}`) },
        ...(workflowId ? [{ resourceReservationId: workflowId }] : []),
      ],
    }),
    scheduleConsultationCalls: await IdempotencyRecord.countDocuments({
      $or: [
        { idempotencyKey: new RegExp(`schedule-consultation:.*${conversationId}`) },
        ...(workflowId ? [{ 'execution.workflowId': workflowId, semanticAction: 'SUBMIT_SLOT_SELECTION' }] : []),
      ],
    }),
  };
};

const deleteByIds = async (model: any, ids: string[]) => {
  for (const id of ids) {
    await model.deleteOne({ _id: id }).exec();
  }
};

export const cleanupH06CFixtures = async (conversationId: string) => {
  await connectMongo();
  const workflowIds = (await CustomerInteraction.find({
    businessSlug: 'demo_test',
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

  const prefix = new RegExp(`^${conversationId}`);
  const ciIds = (await CustomerInteraction.find({ businessSlug: 'demo_test', conversationId }).select({ _id: 1 }).lean().exec())
    .map((doc: any) => String(doc._id));
  const offeringIds = (await CatalogOffering.find({ _id: prefix }).select({ _id: 1 }).lean().exec()).map((doc: any) => String(doc._id));
  const teamIds = (await WorkTeam.find({ _id: prefix }).select({ _id: 1 }).lean().exec()).map((doc: any) => String(doc._id));
  const ruleIds = (await WorkTeamScheduleRule.find({ _id: prefix }).select({ _id: 1 }).lean().exec()).map((doc: any) => String(doc._id));
  const overrideIds = (await WorkTeamScheduleOverride.find({ _id: prefix }).select({ _id: 1 }).lean().exec()).map((doc: any) => String(doc._id));
  const appointmentIds = (await Appointment.find({
    $or: [
      { _id: prefix },
      { resourceReservationId: { $in: workflowIds } },
    ],
  }).select({ _id: 1 }).lean().exec()).map((doc: any) => String(doc._id));
  const reservationIds = (await ResourceReservation.find({
    $or: [
      { _id: prefix },
      { workflowId: { $in: workflowIds } },
    ],
  }).select({ _id: 1 }).lean().exec()).map((doc: any) => String(doc._id));
  const idemIds = (await IdempotencyRecord.find({
    $or: [
      { idempotencyKey: new RegExp(conversationId) },
      { 'execution.workflowId': { $in: workflowIds } },
    ],
  }).select({ _id: 1 }).lean().exec()).map((doc: any) => String(doc._id));

  await deleteByIds(CustomerInteraction, ciIds);
  await deleteByIds(CatalogOffering, offeringIds);
  await deleteByIds(WorkTeamScheduleRule, ruleIds);
  await deleteByIds(WorkTeamScheduleOverride, overrideIds);
  await deleteByIds(WorkTeam, teamIds);
  await deleteByIds(Appointment, appointmentIds);
  await deleteByIds(ResourceReservation, reservationIds);
  await deleteByIds(IdempotencyRecord, idemIds);
};

export const countH06CResidue = async () => {
  await connectMongo();
  const prefix = /^hermes-h06c-/;
  return {
    customerInteractions: await CustomerInteraction.countDocuments({ conversationId: prefix }),
    offerings: await CatalogOffering.countDocuments({ _id: prefix }),
    teams: await WorkTeam.countDocuments({ _id: prefix }),
    rules: await WorkTeamScheduleRule.countDocuments({ _id: prefix }),
    overrides: await WorkTeamScheduleOverride.countDocuments({ _id: prefix }),
    appointments: await Appointment.countDocuments({ _id: prefix }),
    resourceReservations: await ResourceReservation.countDocuments({ _id: prefix }),
    idempotencyRecords: await IdempotencyRecord.countDocuments({ idempotencyKey: prefix }),
  };
};

export const finishH06CFixtures = async (conversationId: string) => {
  await cleanupH06CFixtures(conversationId);
  await disconnectMongo();
};
