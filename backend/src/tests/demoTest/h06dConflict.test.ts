import assert from 'assert';
import { runHermesSchedulingBridgeTurn } from '../../agent/hermes/scheduling/hermesSchedulingBridge.service';
import { assertBridgeHandled } from './h06bAssertions';
import {
  countH06DSideEffects,
  enableH06DTestFlags,
  finishH06DArtifacts,
  h06dConversationId,
  prepareH06DSlotSelectionWorkflow,
} from './h06dFixtures';

const run = async () => {
  enableH06DTestFlags();
  const conversationA = h06dConversationId('conflict-a');
  const conversationB = h06dConversationId('conflict-b');
  let cleanupAProcessContext;
  let cleanupAWorkflowId: string | undefined;
  let cleanupBProcessContext;
  let cleanupBWorkflowId: string | undefined;

  try {
    const preparedA = await prepareH06DSlotSelectionWorkflow(conversationA);
    const preparedB = await prepareH06DSlotSelectionWorkflow(conversationB);
    cleanupAWorkflowId = preparedA.workflowId;
    cleanupBWorkflowId = preparedB.workflowId;

    const firstA = preparedA.availability.availabilityPresentation?.slots[0];
    const firstB = preparedB.availability.availabilityPresentation?.slots[0];
    assert(firstA?.token && firstB?.start, 'conflict flow requires authoritative slots in both conversations');

    const bookedA = assertBridgeHandled(await runHermesSchedulingBridgeTurn({
      businessSlug: 'demo_test',
      conversationId: conversationA,
      message: 'La primera opcion.',
      messageId: `${conversationA}-m3`,
      correlationId: `${conversationA}-corr3`,
      channel: 'web_agent',
    }), 'first slot booking must be handled');

    assert.equal(bookedA.bridgeOutcome, 'EXECUTED');
    assert.equal(String(bookedA.processContext?.process.status || ''), 'APPOINTMENT_BOOKED');
    cleanupAProcessContext = bookedA.processContext;

    const replayA = assertBridgeHandled(await runHermesSchedulingBridgeTurn({
      businessSlug: 'demo_test',
      conversationId: conversationA,
      message: 'La primera opcion.',
      messageId: `${conversationA}-m3`,
      correlationId: `${conversationA}-corr3-replay`,
      channel: 'web_agent',
    }), 'same slot replay must be handled');

    assert.equal(replayA.bridgeOutcome, 'REPLAYED');

    const startHour = String(firstB.start).split(':')[0].replace(/^0/, '') || '9';
    const staleSelection = assertBridgeHandled(await runHermesSchedulingBridgeTurn({
      businessSlug: 'demo_test',
      conversationId: conversationB,
      message: `El de las ${startHour}.`,
      messageId: `${conversationB}-m3`,
      correlationId: `${conversationB}-corr3`,
      channel: 'web_agent',
    }), 'stale slot selection must still be handled');

    assert.equal(staleSelection.bridgeOutcome, 'NO_CHANGE');
    assert.equal(staleSelection.executionResults[0]?.outcome, 'SEMANTIC_ERROR');
    assert(['DOUBLE_BOOKING_CONFLICT', 'SLOT_UNAVAILABLE'].includes(String(staleSelection.executionResults[0]?.error?.code || '')));
    assert.equal(String(staleSelection.processContext?.process.status || ''), 'WAITING_FOR_SLOT_SELECTION');
    assert(String(staleSelection.message || '').trim().length > 0);
    cleanupBProcessContext = staleSelection.processContext;

    const sameMessageDifferentSlot = assertBridgeHandled(await runHermesSchedulingBridgeTurn({
      businessSlug: 'demo_test',
      conversationId: conversationA,
      message: String(firstA.token),
      messageId: `${conversationA}-m3`,
      correlationId: `${conversationA}-corr3-conflict`,
      channel: 'web_agent',
    }), 'same messageId with different slot payload must be handled as conflict');

    assert.equal(sameMessageDifferentSlot.bridgeOutcome, 'VALIDATION_REJECTED');
    assert.equal(sameMessageDifferentSlot.executionResults[0]?.error?.code, 'IDEMPOTENCY_CONFLICT');

    const countsA = await countH06DSideEffects(conversationA, bookedA.processContext);
    const countsB = await countH06DSideEffects(conversationB, staleSelection.processContext);
    assert.equal(countsA.resourceReservations, 1, 'conversation A must keep exactly one reservation');
    assert.equal(countsA.appointments, 1, 'conversation A must keep exactly one appointment');
    assert.equal(countsB.resourceReservations, 0, 'conversation B must not create a second reservation');
    assert.equal(countsB.appointments, 0, 'conversation B must not create a second appointment');

    console.log(JSON.stringify({
      ok: true,
      workflowA: preparedA.workflowId,
      workflowB: preparedB.workflowId,
      replayOutcome: replayA.bridgeOutcome,
      staleSelectionOutcome: staleSelection.executionResults[0]?.outcome,
      sameMessageDifferentSlot: sameMessageDifferentSlot.executionResults[0]?.error?.code,
      countsA,
      countsB,
    }, null, 2));
  } finally {
    await finishH06DArtifacts([
      {
        conversationId: conversationA,
        processContext: cleanupAProcessContext,
        workflowId: cleanupAWorkflowId,
      },
      {
        conversationId: conversationB,
        processContext: cleanupBProcessContext,
        workflowId: cleanupBWorkflowId,
      },
    ]).catch(() => undefined);
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
