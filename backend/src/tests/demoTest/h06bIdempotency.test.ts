import assert from 'assert';
import { runHermesSchedulingBridgeTurn } from '../../agent/hermes/scheduling/hermesSchedulingBridge.service';
import { assertBridgeHandled } from './h06bAssertions';
import {
  cleanupH06BFixtures,
  enableH06BTestFlags,
  finishH06BFixtures,
  h06bConversationId,
} from './h06bFixtures';

const run = async () => {
  enableH06BTestFlags();
  const conversationId = h06bConversationId('idem');
  try {
    await cleanupH06BFixtures(conversationId);

    const first = assertBridgeHandled(await runHermesSchedulingBridgeTurn({
      businessSlug: 'demo_test',
      conversationId,
      message: 'Quiero reservar una consulta.',
      messageId: `${conversationId}-m1`,
      correlationId: `${conversationId}-corr1`,
      channel: 'web_agent',
    }), 'first start must be handled');

    const replay = assertBridgeHandled(await runHermesSchedulingBridgeTurn({
      businessSlug: 'demo_test',
      conversationId,
      message: 'Quiero reservar una consulta.',
      messageId: `${conversationId}-m1`,
      correlationId: `${conversationId}-corr1b`,
      channel: 'web_agent',
    }), 'same-message replay must stay in bridge');

    assert(first.workflowId, 'first workflow id required');
    assert.equal(replay.workflowId, first.workflowId);
    assert(replay.executionResults.some((item) => item.outcome === 'REPLAYED'), 'same request must replay safely');
    const offeringName = String(((first.processContext?.availableOptions?.[0] as any)?.name) || '');
    assert(offeringName, 'workflow must expose an authoritative offering option');

    assertBridgeHandled(await runHermesSchedulingBridgeTurn({
      businessSlug: 'demo_test',
      conversationId,
      message: offeringName,
      messageId: `${conversationId}-m2`,
      correlationId: `${conversationId}-corr2`,
      channel: 'web_agent',
    }), 'offering continuation must be handled');

    assertBridgeHandled(await runHermesSchedulingBridgeTurn({
      businessSlug: 'demo_test',
      conversationId,
      message: 'Ricardo.',
      messageId: `${conversationId}-m3`,
      correlationId: `${conversationId}-corr3`,
      channel: 'web_agent',
    }), 'first customer data turn must be handled');

    const customerConflict = assertBridgeHandled(await runHermesSchedulingBridgeTurn({
      businessSlug: 'demo_test',
      conversationId,
      message: 'Roberto.',
      messageId: `${conversationId}-m3`,
      correlationId: `${conversationId}-corr3b`,
      channel: 'web_agent',
    }), 'conflict response must still be owned by bridge');

    assert(
      customerConflict.executionResults.some((item) => item.error?.code === 'IDEMPOTENCY_CONFLICT'),
      'different payload with same message id must conflict'
    );

    console.log('h06b-idempotency: PASS');
  } finally {
    await finishH06BFixtures(conversationId).catch(() => undefined);
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
