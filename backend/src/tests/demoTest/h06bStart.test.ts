import assert from 'assert';
import { CustomerInteraction } from '../../models/CustomerInteraction.model';
import { runHermesSchedulingBridgeTurn } from '../../agent/hermes/scheduling/hermesSchedulingBridge.service';
import { connectMongo } from '../../agent/hermes/tests/h04TestUtils';
import { assertBridgeHandled } from './h06bAssertions';
import { cleanupH06BFixtures, enableH06BTestFlags, finishH06BFixtures, h06bConversationId } from './h06bFixtures';

const run = async () => {
  enableH06BTestFlags();

  const conversationA = h06bConversationId('start');
  const conversationB = h06bConversationId('facts');

  try {
    await cleanupH06BFixtures(conversationA);
    await cleanupH06BFixtures(conversationB);

    const started = assertBridgeHandled(await runHermesSchedulingBridgeTurn({
      businessSlug: 'demo_test',
      conversationId: conversationA,
      message: 'Quiero reservar una consulta.',
      messageId: `${conversationA}-m1`,
      correlationId: `${conversationA}-corr`,
      channel: 'web_agent',
    }), 'simple start must be handled');
    assert.equal(started.bridgeOutcome, 'EXECUTED');
    assert.equal(started.processContext?.awaiting.type, 'offering_selection');
    assert.equal(started.executionResults[0]?.action, 'START_SCHEDULE_CONSULTATION');

    const startedWithFacts = assertBridgeHandled(await runHermesSchedulingBridgeTurn({
      businessSlug: 'demo_test',
      conversationId: conversationB,
      message: 'Hola, soy Ricardo. Quiero agendar una cita.',
      messageId: `${conversationB}-m1`,
      correlationId: `${conversationB}-corr`,
      channel: 'web_agent',
    }), 'start with name must be handled');
    assert(startedWithFacts.semanticActions.length <= 2, 'max actions per turn must stay bounded');
    assert(!/como te llamas|cual es tu nombre/i.test(startedWithFacts.message), 'must not repeat name question');

    await connectMongo();
    const visibleA = await CustomerInteraction.countDocuments({
      businessSlug: 'demo_test',
      conversationId: conversationA,
      visibility: 'customer',
      direction: 'outbound',
      'participant.runtime': 'hermes',
    });
    const visibleB = await CustomerInteraction.countDocuments({
      businessSlug: 'demo_test',
      conversationId: conversationB,
      visibility: 'customer',
      direction: 'outbound',
      'participant.runtime': 'hermes',
    });
    assert.equal(visibleA, 1, 'simple start must persist one visible outbound');
    assert.equal(visibleB, 1, 'start with facts must persist one visible outbound');

    console.log('h06b-start: PASS');
  } finally {
    await finishH06BFixtures(conversationA).catch(() => undefined);
    await finishH06BFixtures(conversationB).catch(() => undefined);
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
