import assert from 'assert';
import { runHermesSchedulingBridgeTurn } from '../../agent/hermes/scheduling/hermesSchedulingBridge.service';
import { assertBridgeHandled } from './h06bAssertions';
import {
  H06C_AVAILABLE_DATE,
  createH06CFixtures,
  enableH06CTestFlags,
  finishH06CFixtures,
  h06cConversationId,
  prepareH06CReadyWorkflow,
} from './h06cFixtures';

const run = async () => {
  enableH06CTestFlags();
  const conversationId = h06cConversationId('availability');
  try {
    const fixtures = await createH06CFixtures(conversationId);
    const prepared = await prepareH06CReadyWorkflow(conversationId, fixtures.offeringId);
    assert.equal(String(prepared.state.status), 'CUSTOMER_DATA_VALIDATED');

    const availability = assertBridgeHandled(await runHermesSchedulingBridgeTurn({
      businessSlug: 'demo_test',
      conversationId,
      message: 'Que horarios tienen manana?',
      messageId: `${conversationId}-m3`,
      correlationId: `${conversationId}-corr3`,
      channel: 'web_agent',
    }), 'availability request must be handled');

    assert.equal(availability.bridgeOutcome, 'EXECUTED');
    assert(availability.semanticActions.includes('SUBMIT_DATE_PREFERENCE'));
    assert(availability.semanticActions.includes('REQUEST_AVAILABILITY'));
    assert.equal(availability.processContext?.awaiting.type, 'slot_selection');
    assert.equal(availability.availabilityPresentation?.date, H06C_AVAILABLE_DATE);
    assert.equal(availability.availabilityPresentation?.timezone, 'America/Lima');
    assert((availability.availabilityPresentation?.slots.length || 0) > 0, 'must expose real public slots');
    assert((availability.availabilityPresentation?.slots.length || 0) <= 5, 'must cap public slots');
    assert(/todavia no quedan reservados/i.test(availability.message));
    assert(availability.availabilityPresentation?.slots.every((slot) => /^slot_[a-f0-9]{16}$/.test(slot.token)));

    const sideQuestion = assertBridgeHandled(await runHermesSchedulingBridgeTurn({
      businessSlug: 'demo_test',
      conversationId,
      message: 'Cuanto dura la consulta?',
      messageId: `${conversationId}-m4`,
      correlationId: `${conversationId}-corr4`,
      channel: 'web_agent',
    }), 'side question after slots must be handled');

    assert.equal(sideQuestion.bridgeOutcome, 'NO_CHANGE');
    assert(/60 minutos/i.test(sideQuestion.message));
    assert(/no estan reservados/i.test(sideQuestion.message));

    console.log(JSON.stringify({
      ok: true,
      workflowId: availability.workflowId,
      normalizedDate: availability.availabilityPresentation?.date,
      timezone: availability.availabilityPresentation?.timezone,
      slotsPresented: availability.availabilityPresentation?.slots.length || 0,
      sideQuestionPreserved: true,
    }, null, 2));
  } finally {
    await finishH06CFixtures(conversationId).catch(() => undefined);
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
