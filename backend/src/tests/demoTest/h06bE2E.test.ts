import assert from 'assert';
import { Appointment } from '../../models/Appointment.model';
import { ResourceReservation } from '../../models/ResourceReservation.model';
import { runHermesSchedulingBridgeTurn } from '../../agent/hermes/scheduling/hermesSchedulingBridge.service';
import { connectMongo } from '../../agent/hermes/tests/h04TestUtils';
import { assertBridgeHandled } from './h06bAssertions';
import {
  cleanupH06BFixtures,
  enableH06BTestFlags,
  finishH06BFixtures,
  h06bConversationId,
} from './h06bFixtures';

const run = async () => {
  enableH06BTestFlags();
  const conversationId = h06bConversationId('e2e');
  const otherConversationId = h06bConversationId('e2e-other');
  try {
    await cleanupH06BFixtures(conversationId);
    await cleanupH06BFixtures(otherConversationId);

    const start = assertBridgeHandled(await runHermesSchedulingBridgeTurn({
      businessSlug: 'demo_test',
      conversationId,
      message: 'Quiero reservar una consulta.',
      messageId: `${conversationId}-m1`,
      correlationId: `${conversationId}-corr1`,
    }), 'workflow start must be handled');
    assert(start.workflowId, 'workflow must be created');
    const offeringName = String(((start.processContext?.availableOptions?.[0] as any)?.name) || '');
    assert(offeringName, 'workflow must expose an authoritative offering option');

    const reuse = assertBridgeHandled(await runHermesSchedulingBridgeTurn({
      businessSlug: 'demo_test',
      conversationId,
      message: 'Ya dije que quiero agendar.',
      messageId: `${conversationId}-m2`,
      correlationId: `${conversationId}-corr2`,
    }), 'active workflow message must be handled');
    assert.equal(reuse.workflowId, start.workflowId, 'workflow must be reused');

    const offering = assertBridgeHandled(await runHermesSchedulingBridgeTurn({
      businessSlug: 'demo_test',
      conversationId,
      message: offeringName,
      messageId: `${conversationId}-m3`,
      correlationId: `${conversationId}-corr3`,
    }), 'offering turn must be handled');
    assert.equal(offering.processContext?.awaiting.type, 'customer_information', 'must advance after offering');

    assertBridgeHandled(await runHermesSchedulingBridgeTurn({
      businessSlug: 'demo_test',
      conversationId,
      message: 'Ricardo Perez y mi telefono es 999999999.',
      messageId: `${conversationId}-m4`,
      correlationId: `${conversationId}-corr4`,
    }), 'customer turn must be handled');

    const otherStart = assertBridgeHandled(await runHermesSchedulingBridgeTurn({
      businessSlug: 'demo_test',
      conversationId: otherConversationId,
      message: 'Quiero reservar una consulta.',
      messageId: `${otherConversationId}-m1`,
      correlationId: `${otherConversationId}-corr1`,
    }), 'cross-conversation start must be handled');
    assert(otherStart.workflowId && otherStart.workflowId !== start.workflowId, 'cross-conversation must isolate workflows');

    await connectMongo();
    const appointments = await Appointment.countDocuments({ _id: /^hermes-h06b-/ });
    const reservations = await ResourceReservation.countDocuments({ _id: /^hermes-h06b-/ });
    assert.equal(appointments, 0, 'H06B must not create appointments');
    assert.equal(reservations, 0, 'H06B must not create reservations');

    console.log('h06b-e2e: PASS');
  } finally {
    await finishH06BFixtures(conversationId).catch(() => undefined);
    await finishH06BFixtures(otherConversationId).catch(() => undefined);
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
