import assert from 'assert';
import { CustomerInteraction } from '../../../models/CustomerInteraction.model';
import { cleanupRunFixtures, connectMongo, disconnectMongo } from './h04TestUtils';
import { createH06AFixtures, enableH06ATestFlags, countH06AShadowRows } from './h06aFixtures';
import { buildHermesReadOnlyContext } from '../context/hermesContextBuilder.service';
import { runHermesSchedulingDryRun } from '../scheduling/hermesSchedulingDryRun.service';

const conversationId = 'hermes-h06a-dry-run';

const run = async () => {
  enableH06ATestFlags();
  await connectMongo();
  await createH06AFixtures(conversationId);

  const context = (await buildHermesReadOnlyContext({
    businessSlug: 'demo_test',
    conversationId,
    channel: 'web_agent',
  })).context;

  const start = await runHermesSchedulingDryRun({
    businessSlug: 'demo_test',
    conversationId,
    message: 'Hola, soy Ricardo. Quiero agendar una cita.',
    messageId: 'start-booking',
    correlationId: 'corr-start-booking',
    context,
    persist: true,
  });
  assert.equal(start.intent.type, 'start_booking');
  assert.equal(start.result.status, 'VALID_DRY_RUN');
  assert.equal(start.result.knownFacts.phonePresent, false);

  const contextual = await runHermesSchedulingDryRun({
    businessSlug: 'demo_test',
    conversationId,
    workflowId: 'wf-h06a-customer',
    message: 'Ricardo.',
    messageId: 'short-name',
    correlationId: 'corr-short-name',
    context,
    processState: {
      status: 'WAITING_FOR_CUSTOMER_DATA',
      awaiting: { nextRecommendedField: 'firstName' },
      requiredFields: [{ key: 'firstName' }],
    },
    persist: true,
  });
  assert.equal(contextual.intent.type, 'provide_customer_data');
  assert.equal(contextual.proposal.action, 'SUBMIT_CUSTOMER_INFORMATION');
  assert.equal(contextual.result.status, 'VALID_DRY_RUN');

  const sideQuestion = await runHermesSchedulingDryRun({
    businessSlug: 'demo_test',
    conversationId,
    workflowId: 'wf-h06a-side-question',
    message: 'Antes, cuanto dura la consulta?',
    messageId: 'side-question',
    correlationId: 'corr-side-question',
    context,
    processState: {
      status: 'WAITING_FOR_CUSTOMER_DATA',
      awaiting: { nextRecommendedField: 'phone' },
    },
    persist: true,
  });
  assert.equal(sideQuestion.result.proposedAction, 'NO_ACTION');
  assert.equal(sideQuestion.result.status, 'NO_ACTION');

  const duplicate = await runHermesSchedulingDryRun({
    businessSlug: 'demo_test',
    conversationId,
    message: 'Hola, soy Ricardo. Quiero agendar una cita.',
    messageId: 'start-booking',
    correlationId: 'corr-start-booking',
    context,
    persist: true,
  });
  assert.equal(duplicate.result.status, 'VALID_DRY_RUN');

  let conflictRaised = false;
  try {
    await runHermesSchedulingDryRun({
      businessSlug: 'demo_test',
      conversationId,
      message: 'Cancela mi reserva.',
      messageId: 'start-booking',
      correlationId: 'corr-start-booking',
      context,
      processState: {
        status: 'WAITING_FOR_CUSTOMER_DATA',
      },
      persist: true,
    });
  } catch (error: any) {
    conflictRaised = /Conflicting conversation message replay/i.test(String(error?.message || error));
  }
  assert(conflictRaised, 'Conflicting dry-run persistence must reject message replay with different payload.');

  const persisted = await CustomerInteraction.find({
    businessSlug: 'demo_test',
    conversationId,
    visibility: 'shadow',
    interactionType: 'system_event',
    'metadata.runtimeMode': 'scheduling_dry_run',
  }).lean().exec();
  assert(persisted.length >= 3, 'Dry-run shadow evidence must be persisted.');
  assert(persisted.every((row: any) => row.metadata?.phonePresent !== undefined), 'Redacted presence flags must be stored.');
  assert.equal(await countH06AShadowRows(conversationId), persisted.length);

  await cleanupRunFixtures(conversationId);
  await disconnectMongo();
  console.log('h06a-dry-run: PASS');
};

run().catch(async (error) => {
  console.error(error);
  await cleanupRunFixtures(conversationId).catch(() => undefined);
  await disconnectMongo().catch(() => undefined);
  process.exit(1);
});
