import assert from 'assert';
import { runHermesSchedulingBridgeTurn } from '../../agent/hermes/scheduling/hermesSchedulingBridge.service';
import { assertBridgeDeclined, assertBridgeHandled } from './h06bAssertions';
import {
  H06C_BLOCKED_DATE,
  countH06CSideEffects,
  createH06CFixtures,
  enableH06CTestFlags,
  finishH06CFixtures,
  h06cConversationId,
  prepareH06CReadyWorkflow,
} from './h06cFixtures';

const run = async () => {
  enableH06CTestFlags();
  const conversationId = h06cConversationId('no-booking');
  try {
    const fixtures = await createH06CFixtures(conversationId);
    const prepared = await prepareH06CReadyWorkflow(conversationId, fixtures.offeringId);

    const unavailable = assertBridgeHandled(await runHermesSchedulingBridgeTurn({
      businessSlug: 'demo_test',
      conversationId,
      message: 'Que horarios tienen el 25 de julio?',
      messageId: `${conversationId}-m3`,
      correlationId: `${conversationId}-corr3`,
      channel: 'web_agent',
    }), 'no-availability flow must still be handled');

    assert.equal(unavailable.bridgeOutcome, 'EXECUTED');
    assert.equal(unavailable.availabilityPresentation?.date, H06C_BLOCKED_DATE);
    assert.equal(unavailable.availabilityPresentation?.slots.length, 0);
    assert(/Quieres consultar otra fecha\?/i.test(unavailable.message));

    const slotAttempt = assertBridgeDeclined(await runHermesSchedulingBridgeTurn({
      businessSlug: 'demo_test',
      conversationId,
      message: 'El de las 9.',
      messageId: `${conversationId}-m4`,
      correlationId: `${conversationId}-corr4`,
      channel: 'web_agent',
    }), 'slot selection must remain out of scope in H06C');

    assert.equal(slotAttempt.reason, 'ACTION_OUT_OF_SCOPE');

    const counts = await countH06CSideEffects(conversationId, prepared.workflowId);
    assert.equal(counts.selectSlotSignals, 0, 'H06C must not emit slot selection signals');
    assert.equal(counts.resourceReservations, 0, 'H06C must not create resource reservations');
    assert.equal(counts.appointments, 0, 'H06C must not create appointments');
    assert.equal(counts.scheduleConsultationCalls, 0, 'H06C must not finalize scheduleConsultation');

    console.log(JSON.stringify({
      ok: true,
      workflowId: prepared.workflowId,
      noAvailabilityDate: unavailable.availabilityPresentation?.date,
      counts,
    }, null, 2));
  } finally {
    await finishH06CFixtures(conversationId).catch(() => undefined);
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
