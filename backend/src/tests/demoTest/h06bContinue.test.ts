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
  const conversationId = h06bConversationId('continue');
  try {
    await cleanupH06BFixtures(conversationId);

    const started = assertBridgeHandled(await runHermesSchedulingBridgeTurn({
      businessSlug: 'demo_test',
      conversationId,
      message: 'Quiero reservar una consulta.',
      messageId: `${conversationId}-m1`,
      correlationId: `${conversationId}-corr1`,
      channel: 'web_agent',
    }), 'workflow must start before continue');
    assert(started.workflowId, 'workflow id must exist before continue');
    const offeringName = String(((started.processContext?.availableOptions?.[0] as any)?.name) || '');
    assert(offeringName, 'workflow must expose an authoritative offering option');

    const offering = assertBridgeHandled(await runHermesSchedulingBridgeTurn({
      businessSlug: 'demo_test',
      conversationId,
      message: offeringName,
      messageId: `${conversationId}-m2`,
      correlationId: `${conversationId}-corr2`,
      channel: 'web_agent',
    }), 'offering selection must be handled');
    assert(offering.semanticActions.includes('SUBMIT_OFFERING_SELECTION'));
    assert.equal(offering.processContext?.awaiting.type, 'customer_information');

    const customer = assertBridgeHandled(await runHermesSchedulingBridgeTurn({
      businessSlug: 'demo_test',
      conversationId,
      message: 'Soy Ricardo Perez y mi telefono es 999999999.',
      messageId: `${conversationId}-m3`,
      correlationId: `${conversationId}-corr3`,
      channel: 'web_agent',
    }), 'customer data must be handled');
    assert(customer.semanticActions.includes('SUBMIT_CUSTOMER_INFORMATION'));
    assert(customer.executionResults.every((item) => item.action !== 'START_SCHEDULE_CONSULTATION'), 'continue turn must not restart');

    const sideQuestion = assertBridgeHandled(await runHermesSchedulingBridgeTurn({
      businessSlug: 'demo_test',
      conversationId,
      message: 'Antes, cuanto dura la consulta?',
      messageId: `${conversationId}-m4`,
      correlationId: `${conversationId}-corr4`,
      channel: 'web_agent',
    }), 'side question during supported process must be handled');
    assert.equal(sideQuestion.bridgeOutcome, 'NO_CHANGE');
    assert(/60 minutos|90 minutos/.test(sideQuestion.message), 'side question must answer from catalog context');

    console.log('h06b-continue: PASS');
  } finally {
    await finishH06BFixtures(conversationId).catch(() => undefined);
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
