import { Appointment } from '../../models/Appointment.model';
import { CatalogOffering } from '../../models/CatalogOffering.model';
import { Case } from '../../models/Case.model';
import { Customer } from '../../models/Customer.model';
import { CustomerInteraction } from '../../models/CustomerInteraction.model';
import { IdempotencyRecord } from '../../models/IdempotencyRecord.model';
import { ManagedEntity } from '../../models/ManagedEntity.model';
import { ResourceReservation } from '../../models/ResourceReservation.model';
import { TimelineEvent } from '../../models/TimelineEvent.model';
import { connectMongo, disconnectMongo } from '../../agent/hermes/tests/h04TestUtils';
import { signalWorkflow } from '../../services/agentSim.service';

export const enableH06BTestFlags = () => {
  process.env.HERMES_SCHEDULING_BRIDGE_ENABLED = 'true';
  process.env.HERMES_SCHEDULING_BRIDGE_CANARY_PERCENT = '100';
  process.env.HERMES_SCHEDULING_BRIDGE_FAIL_OPEN_PRE_COMMIT = 'true';
  process.env.HERMES_SCHEDULING_BRIDGE_POST_COMMIT_LEGACY_FALLBACK = 'false';
  process.env.HERMES_SCHEDULING_BRIDGE_MAX_ACTIONS_PER_TURN = '2';
  process.env.HERMES_SCHEDULING_PRE_AVAILABILITY_ONLY = 'true';
  process.env.HERMES_CONTEXT_ENABLED = 'true';
  process.env.HERMES_READ_BUSINESS_CONTEXT = 'true';
  process.env.HERMES_READ_CATALOG_CONTEXT = 'true';
  process.env.HERMES_READ_CUSTOMER_CONTEXT = 'true';
  process.env.HERMES_READ_CASE_CONTEXT = 'true';
  process.env.HERMES_READ_PROCESS_CONTEXT = 'true';
};

export const h06bConversationId = (label: string) =>
  `hermes-h06b-${label}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

export const createH06BOfferingFixtures = async (conversationId: string) => {
  await connectMongo();
  const suffix = conversationId.replace(/[^a-z]/gi, '').slice(-8) || 'fixture';
  const offerings = [
    {
      _id: `${conversationId}-off-basic`,
      businessSlug: 'demo_test',
      active: true,
      publicVisible: true,
      name: `Consulta basica ${suffix}`,
      description: 'Consulta inicial H06B',
      durationMinutes: 60,
      pricing: { type: 'not_published', currency: 'PEN' },
    },
    {
      _id: `${conversationId}-off-plus`,
      businessSlug: 'demo_test',
      active: true,
      publicVisible: true,
      name: `Consulta plus ${suffix}`,
      description: 'Consulta avanzada H06B',
      durationMinutes: 90,
      pricing: { type: 'not_published', currency: 'PEN' },
    },
  ];
  await (CatalogOffering as any).create(offerings);
  return offerings;
};

const deleteByIds = async (model: any, ids: string[]) => {
  for (const id of ids) {
    await model.deleteOne({ _id: id }).exec();
  }
};

export const cleanupH06BFixtures = async (conversationId: string) => {
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
  const customerIds = (await Customer.find({ _id: prefix }).select({ _id: 1 }).lean().exec()).map((doc: any) => String(doc._id));
  const managedIds = (await ManagedEntity.find({ _id: prefix }).select({ _id: 1 }).lean().exec()).map((doc: any) => String(doc._id));
  const caseIds = (await Case.find({ _id: prefix }).select({ _id: 1 }).lean().exec()).map((doc: any) => String(doc._id));
  const timelineIds = (await TimelineEvent.find({ _id: prefix }).select({ _id: 1 }).lean().exec()).map((doc: any) => String(doc._id));
  const offeringIds = (await CatalogOffering.find({ _id: prefix }).select({ _id: 1 }).lean().exec()).map((doc: any) => String(doc._id));
  const idemIds = (await IdempotencyRecord.find({
    $or: [
      { idempotencyKey: new RegExp(conversationId) },
      { 'execution.workflowId': { $in: workflowIds } },
    ],
  }).select({ _id: 1 }).lean().exec()).map((doc: any) => String(doc._id));
  const appointmentIds = (await Appointment.find({ $or: [{ _id: prefix }, { resourceReservationId: { $in: workflowIds } }] }).select({ _id: 1 }).lean().exec())
    .map((doc: any) => String(doc._id));
  const reservationIds = (await ResourceReservation.find({ $or: [{ _id: prefix }, { workflowId: { $in: workflowIds } }] }).select({ _id: 1 }).lean().exec())
    .map((doc: any) => String(doc._id));

  await deleteByIds(CustomerInteraction, ciIds);
  await deleteByIds(Customer, customerIds);
  await deleteByIds(ManagedEntity, managedIds);
  await deleteByIds(Case, caseIds);
  await deleteByIds(TimelineEvent, timelineIds);
  await deleteByIds(CatalogOffering, offeringIds);
  await deleteByIds(IdempotencyRecord, idemIds);
  await deleteByIds(Appointment, appointmentIds);
  await deleteByIds(ResourceReservation, reservationIds);
};

export const countH06BResidue = async () => {
  await connectMongo();
  const prefix = /^hermes-h06b-/;
  return {
    customerInteractions: await CustomerInteraction.countDocuments({ conversationId: prefix }),
    customers: await Customer.countDocuments({ _id: prefix }),
    managedEntities: await ManagedEntity.countDocuments({ _id: prefix }),
    cases: await Case.countDocuments({ _id: prefix }),
    timelineEvents: await TimelineEvent.countDocuments({ _id: prefix }),
    offerings: await CatalogOffering.countDocuments({ _id: prefix }),
    idempotencyRecords: await IdempotencyRecord.countDocuments({ idempotencyKey: prefix }),
    appointments: await Appointment.countDocuments({ _id: prefix }),
    resourceReservations: await ResourceReservation.countDocuments({ _id: prefix }),
  };
};

export const finishH06BFixtures = async (conversationId: string) => {
  await cleanupH06BFixtures(conversationId);
  await disconnectMongo();
};
