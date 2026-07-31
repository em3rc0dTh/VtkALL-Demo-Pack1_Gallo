import assert from 'assert';
import { HermesReadOnlyContext } from '../context/hermesContext.contract';
import { deriveHermesResponseObligations, evaluateHermesObligationCoverage } from '../orchestration/hermesConversationalTurn.service';
import { evaluateHermesConversationalCoherence } from '../orchestration/hermesConversationalCoherenceGate.service';
import { resolveHermesVisibleRuntime } from '../orchestration/hermesVisibleRuntime.service';
import { buildAutomotiveGuidanceReply, classifyHermesSemanticTurn } from '../routing/hermesSemanticTurn.service';

const context = (history: HermesReadOnlyContext['conversation']['history']): HermesReadOnlyContext => ({
  business: {
    businessSlug: 'turagua',
    businessName: 'Turagua Racing Peru',
    timezone: 'America/Lima',
    agent: { name: 'Iris', role: 'asistente automotriz' },
  },
  conversation: {
    conversationId: `h12-${Date.now()}`,
    channel: 'web_agent',
    history,
  },
  process: { active: false, allowedActions: [], informationalOnly: true },
  catalog: [
    { id: 'diagnostico-general', name: 'Diagnostico general', description: 'Revision general', durationMinutes: 60, pricing: { type: 'not_published' }, publicVisible: true, active: true },
  ],
  permissions: { mode: 'qa_primary', readOnly: true, canExecuteActions: false },
});

const run = async () => {
  const ctx = context([
    { role: 'user', content: 'Mi carro suena cuando prendo el aire acondicionado.' },
    { role: 'assistant', content: 'Si el aire acondicionado no enfria, puede ser bajo gas o compresor. En que momento deja de enfriar?' },
  ]);

  const obligations = deriveHermesResponseObligations({
    userMessage: 'Enfria, pero suena el compresor. Eso es peligroso y cuanto cuesta revisarlo?',
    context: ctx,
  });
  const ids = obligations.map((item) => item.id);
  assert(ids.includes('ack-air_conditioning.cooling'), 'must acknowledge new cooling fact');
  assert(ids.includes('ack-air_conditioning.noiseSource'), 'must acknowledge compressor noise source');
  assert(ids.includes('correct-air_conditioning.does_not_cool'), 'must apply cooling correction');
  assert(ids.includes('answer-risk-prudently'), 'must answer risk question');
  assert(ids.includes('answer-price-policy'), 'must answer price question');
  assert(ids.includes('answered-condition_when_occurs'), 'must not repeat answered question');
  assert(ids.includes('ask-next-discriminating-question'), 'must ask a useful next question after evidence');
  assert(obligations.every((item) => item.type && item.content && item.sourceTurnId), 'obligations should be structured');

  const naturalReply = 'Si todavia enfria, el ruido del compresor no confirma una falla inmediata, pero no conviene exigirlo si aumenta. El costo depende de si el origen esta en el embrague, el rodamiento o el propio compresor, asi que primero habria que diagnosticarlo. El ruido desaparece apenas apagas el aire?';
  const coverage = evaluateHermesObligationCoverage({ reply: naturalReply, obligations });
  assert(!coverage.some((entry) => entry.status === 'missing' || entry.status === 'contradicted'), 'natural reply should cover required obligations');

  const missingCoverageGate = await evaluateHermesConversationalCoherence({
    userMessage: 'Enfria, pero suena el compresor. Eso es peligroso y cuanto cuesta revisarlo?',
    reply: 'Puede ser bajo gas o compresor. En que momento deja de enfriar?',
    context: ctx,
  });
  assert(!missingCoverageGate.accepted, 'gate should reject missing or contradicted obligations');
  assert(
    missingCoverageGate.rejectionReasons.includes('OBLIGATION_MISSING') || missingCoverageGate.rejectionReasons.includes('OBLIGATION_CONTRADICTED'),
    'gate should expose obligation rejection reason'
  );

  const brokenSpanishGate = await evaluateHermesConversationalCoherence({
    userMessage: 'Mi carro suena cuando prendo el aire acondicionado',
    reply: '¿Cómo se suena cuando prendes el aire acondicionado?',
    context: ctx,
  });
  assert(!brokenSpanishGate.accepted, 'gate should reject broken Spanish composition');
  assert(brokenSpanishGate.rejectionReasons.includes('LOCALE_MISMATCH'), 'broken Spanish should be exposed as locale mismatch');

  const weakEchoGate = await evaluateHermesConversationalCoherence({
    userMessage: 'Mi carro suena cuando prendo el aire acondicionado',
    reply: '¿Cómo se siente con el ruido del aire acondicionado cuando prendes el aire acondicionado?',
    context: ctx,
  });
  assert(!weakEchoGate.accepted, 'gate should reject weak echo questions');

  const weakWhatHappensGate = await evaluateHermesConversationalCoherence({
    userMessage: 'Mi carro suena cuando prendo el aire acondicionado',
    reply: '¿Qué sucede cuando prendo el aire acondicionado?',
    context: ctx,
  });
  assert(!weakWhatHappensGate.accepted, 'gate should reject generic what-happens echo questions');

  const genericHelpGate = await evaluateHermesConversationalCoherence({
    userMessage: 'Mi carro suena cuando prendo el aire acondicionado',
    reply: '¿Cómo puedo ayudarte con este problema?',
    context: ctx,
  });
  assert(!genericHelpGate.accepted, 'gate should reject generic help questions after a concrete symptom');

  const stalePriceGate = await evaluateHermesConversationalCoherence({
    userMessage: 'Cuando hace mucho calor suena mas',
    reply: '¿Cuánto cuesta revisarlo si el ruido es fuerte?',
    context: ctx,
  });
  assert(!stalePriceGate.accepted, 'gate should reject stale commercial question echoes');

  const semantic = await classifyHermesSemanticTurn({
    message: 'Enfria, pero suena el compresor. Eso es peligroso y cuanto cuesta revisarlo?',
    context: ctx,
  });
  const fallbackReply = await buildAutomotiveGuidanceReply({
    message: 'Enfria, pero suena el compresor. Eso es peligroso y cuanto cuesta revisarlo?',
    context: ctx,
    semantic,
  });
  assert(/riesgo|seguro|exigirlo/i.test(fallbackReply), 'fallback should answer risk obligation');
  assert(/costo|precio/i.test(fallbackReply), 'fallback should answer price obligation');
  assert(/compresor/i.test(fallbackReply), 'fallback should keep the automotive topic');

  process.env.HERMES_VISIBLE_RUNTIME_ENABLED = 'true';
  process.env.HERMES_VISIBLE_RUNTIME_CANARY_PERCENT = '100';
  const visible = await resolveHermesVisibleRuntime({
    businessSlug: 'turagua',
    conversationId: 'h12-composed-candidate',
    route: 'initial',
    userMessage: 'Enfria, pero suena el compresor.',
    runtimeResult: {
      provider: 'hermes',
      model: 'ollama-test',
      message: 'Modelo compuesto',
      toolResults: [],
    },
    context: ctx,
    candidate: {
      status: 'CANDIDATE_READY',
      candidateText: 'Entiendo: si enfria, pero el compresor hace ruido. Puede ser prudente revisarlo antes de seguir exigiendo el aire. El precio no esta confirmado desde aqui. El ruido cambia al acelerar?',
      responsePurpose: 'direct_response',
      processContinuity: 'none',
      answeredSideQuestions: [],
      actionDisclosure: {
        executionOccurred: false,
        availabilityVerified: false,
        confirmationIssued: false,
      },
      authorityDisclosure: {
        mentionsPendingValidation: false,
        mentionsPendingAvailability: false,
        mentionsHumanReview: false,
      },
      sourceSkillId: 'customer-conversation',
      requiresVisibilityGate: true,
      fallbackRecommendation: 'none',
      sanitizedMetadata: {
        conversationalComposition: {
          provider: 'ollama',
          model: 'demo-test-agent',
          obligationCount: obligations.length,
          obligationIds: ids,
        },
      },
    },
    selectedSkill: 'customer-conversation',
  });
  assert(visible.runtime === 'hermes', 'composed candidate should be eligible for Hermes visible runtime');
  assert(/compresor/i.test(visible.message), 'visible reply should come from composed candidate');

  console.log('h12-response-obligations: PASS');
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
