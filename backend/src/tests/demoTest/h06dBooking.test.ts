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
  const conversationId = h06dConversationId('booking');
  let cleanupProcessContext;
  let cleanupWorkflowId: string | undefined;
  try {
    const prepared = await prepareH06DSlotSelectionWorkflow(conversationId);
    cleanupWorkflowId = prepared.workflowId;
    const firstToken = prepared.availability.availabilityPresentation?.slots[0]?.token;
    assert(firstToken, 'H06D booking requires at least one public slot token.');

    const booked = assertBridgeHandled(await runHermesSchedulingBridgeTurn({
      businessSlug: 'demo_test',
      conversationId,
      message: firstToken,
      messageId: `${conversationId}-m3`,
      correlationId: `${conversationId}-corr3`,
      channel: 'web_agent',
    }), 'slot booking must be handled');

    assert.equal(booked.bridgeOutcome, 'EXECUTED');
    assert(booked.semanticActions.includes('SUBMIT_SLOT_SELECTION'));
    assert.equal(String(booked.processContext?.process.status || ''), 'APPOINTMENT_BOOKED');
    assert(/confirmada/i.test(booked.message));
    cleanupProcessContext = booked.processContext;

    const counts = await countH06DSideEffects(conversationId, booked.processContext);
    assert(counts.selectSlotSignals >= 1, 'slot selection must persist at least one visible/internal event');
    assert.equal(counts.resourceReservations, 1, 'booking must create exactly one ResourceReservation');
    assert.equal(counts.appointments, 1, 'booking must create exactly one Appointment');

    console.log(JSON.stringify({
      ok: true,
      workflowId: prepared.workflowId,
      bridgeOutcome: booked.bridgeOutcome,
      processStatus: booked.processContext?.process.status,
      counts,
    }, null, 2));
  } finally {
    await finishH06DArtifacts([{
      conversationId,
      processContext: cleanupProcessContext,
      workflowId: cleanupWorkflowId,
    }]).catch(() => undefined);
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
