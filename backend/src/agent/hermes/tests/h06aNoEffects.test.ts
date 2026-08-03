import assert from 'assert';
import { Appointment } from '../../../models/Appointment.model';
import { Case } from '../../../models/Case.model';
import { Customer } from '../../../models/Customer.model';
import { CustomerInteraction } from '../../../models/CustomerInteraction.model';
import { ManagedEntity } from '../../../models/ManagedEntity.model';
import { ResourceReservation } from '../../../models/ResourceReservation.model';
import { TimelineEvent } from '../../../models/TimelineEvent.model';
import { cleanupRunFixtures, connectMongo, disconnectMongo } from './h04TestUtils';
import { createH06AFixtures, enableH06ATestFlags } from './h06aFixtures';
import { buildHermesReadOnlyContext } from '../context/hermesContextBuilder.service';
import { runHermesSchedulingDryRun } from '../scheduling/hermesSchedulingDryRun.service';

const conversationId = 'hermes-h06a-no-effects';

const counts = async () => ({
  customer: await Customer.countDocuments({ businessSlug: 'demo_test', _id: new RegExp(`^${conversationId}`) }),
  managedEntity: await ManagedEntity.countDocuments({ businessSlug: 'demo_test', _id: new RegExp(`^${conversationId}`) }),
  case: await Case.countDocuments({ businessSlug: 'demo_test', _id: new RegExp(`^${conversationId}`) }),
  appointment: await Appointment.countDocuments({ businessSlug: 'demo_test', caseId: new RegExp(`^${conversationId}`) }),
  reservation: await ResourceReservation.countDocuments({ businessSlug: 'demo_test', caseId: new RegExp(`^${conversationId}`) }),
  timeline: await TimelineEvent.countDocuments({ businessSlug: 'demo_test', caseId: new RegExp(`^${conversationId}`) }),
  interaction: await CustomerInteraction.countDocuments({ businessSlug: 'demo_test', conversationId }),
});

const run = async () => {
  enableH06ATestFlags();
  await connectMongo();
  await createH06AFixtures(conversationId);
  const context = (await buildHermesReadOnlyContext({
    businessSlug: 'demo_test',
    conversationId,
    channel: 'web_agent',
  })).context;

  const before = await counts();
  const result = await runHermesSchedulingDryRun({
    businessSlug: 'demo_test',
    conversationId,
    message: 'Quiero reservar una consulta.',
    messageId: 'no-effects',
    correlationId: 'corr-no-effects',
    context,
    persist: false,
  });
  const after = await counts();

  assert.equal(result.result.temporalCalled, false);
  assert.equal(result.result.databaseWritten, false);
  assert.deepEqual(
    { ...after, interaction: before.interaction },
    before,
    'Dry-run must not create business entities or timeline artifacts.'
  );
  assert.equal(after.interaction, before.interaction, 'Persist=false must not create dry-run interaction evidence.');

  await cleanupRunFixtures(conversationId);
  await disconnectMongo();
  console.log('h06a-no-effects: PASS');
};

run().catch(async (error) => {
  console.error(error);
  await cleanupRunFixtures(conversationId).catch(() => undefined);
  await disconnectMongo().catch(() => undefined);
  process.exit(1);
});
