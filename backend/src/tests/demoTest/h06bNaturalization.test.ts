import assert from 'assert';
import {
  answerHermesSchedulingSideQuestion,
  deterministicHermesSchedulingReply,
} from '../../agent/hermes/scheduling/hermesSchedulingNaturalization.service';

const run = async () => {
  const context = {
    catalog: [{
      id: 'off-basic',
      name: 'Consulta básica',
      durationMinutes: 60,
      pricing: { type: 'not_published' as const },
      publicVisible: true,
      active: true,
    }],
  } as any;

  const sideAnswer = answerHermesSchedulingSideQuestion(
    'Antes, ¿cuánto dura la consulta?',
    context,
    {
      awaiting: { type: 'customer_information', nextRecommendedField: 'phone' },
      knownFacts: { offering: { durationMinutes: 60 } },
    } as any
  );
  assert(sideAnswer && /60 minutos/.test(sideAnswer));

  const offeringReply = deterministicHermesSchedulingReply({
    message: 'Quiero reservar una consulta.',
    context,
    intent: { type: 'start_booking', extracted: {}, source: {} as any, confidence: 'high', requiresAction: true, requiresClarification: false },
    processContext: {
      awaiting: { type: 'offering_selection', nextRecommendedField: 'catalogOfferingId' },
      knownFacts: {},
    } as any,
    bridgeOutcome: 'EXECUTED',
  });
  assert(/Qué servicio deseas/i.test(offeringReply));

  console.log('h06b-naturalization: PASS');
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
