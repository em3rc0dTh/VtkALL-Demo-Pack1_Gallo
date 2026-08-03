import assert from 'assert';
import { evaluateHermesConversationalCoherence } from '../orchestration/hermesConversationalCoherenceGate.service';
import { resolveHermesVisibleRuntime } from '../orchestration/hermesVisibleRuntime.service';
import { HermesReadOnlyContext } from '../context/hermesContext.contract';

const baseContext: HermesReadOnlyContext = {
  business: {
    businessSlug: 'turagua',
    businessName: 'Turagua Racing Peru',
    timezone: 'America/Lima',
    agent: { name: 'Iris', role: 'asistente de reservas' },
  },
  conversation: {
    conversationId: 'h08-coherence',
    channel: 'web_agent',
    history: [
      { role: 'user', content: 'Como saber si mi sensor MAF esta fallando?' },
      { role: 'assistant', content: 'Se revisan sintomas y luego te puedo explicar los pasos de diagnostico.' },
    ],
  },
  catalog: [
    {
      id: 'off_general_diagnostic',
      name: 'Diagnostico general',
      description: 'Revision inicial',
      durationMinutes: 60,
      pricing: { type: 'not_published' },
      publicVisible: true,
      active: true,
    },
  ],
  permissions: {
    mode: 'qa_primary',
    readOnly: true,
    canExecuteActions: false,
  },
};

const candidate = (text: string) => ({
  status: 'CANDIDATE_READY' as const,
  candidateText: text,
  responsePurpose: 'direct_response' as const,
  processContinuity: 'none' as const,
  answeredSideQuestions: [],
  actionDisclosure: { executionOccurred: false as const, availabilityVerified: false, confirmationIssued: false as const },
  authorityDisclosure: { mentionsPendingValidation: false, mentionsPendingAvailability: false, mentionsHumanReview: false },
  requiresVisibilityGate: true as const,
  fallbackRecommendation: 'none' as const,
  sanitizedMetadata: {},
});

const run = async () => {
  process.env.HERMES_VISIBLE_RUNTIME_ENABLED = 'true';
  process.env.HERMES_VISIBLE_RUNTIME_CANARY_PERCENT = '100';
  process.env.HERMES_VISIBLE_RUNTIME_POST_COMMIT_LEGACY_FALLBACK = 'false';

  const mafWrong = await evaluateHermesConversationalCoherence({
    userMessage: 'Como saber si mi sensor MAF esta fallando?',
    reply: 'MAF significa Manifold Absolute Pressure y mide la presion del multiple.',
    context: baseContext,
  });
  assert(!mafWrong.accepted, 'MAF/MAP contradiction should be rejected');
  assert(mafWrong.rejectionReasons.includes('TECHNICAL_FACT_CONTRADICTION'), 'technical reason should be present');
  assert(/flujo de masa de aire|MAF es el sensor/i.test(String(mafWrong.repairedText || '')), 'repair should correct MAF cautiously');

  const stepsPivot = await evaluateHermesConversationalCoherence({
    userMessage: 'Cuales son los pasos?',
    reply: 'Tenemos Diagnostico general, Frenos y suspension y Detailing. Dime cual te interesa.',
    context: baseContext,
  });
  assert(!stepsPivot.accepted, 'catalog pivot should be rejected when user asks follow-up steps');
  assert(stepsPivot.rejectionReasons.includes('TOPIC_DISCONTINUITY'), 'topic continuity reason should be present');
  assert(/OBD|conector|lecturas del MAF/i.test(String(stepsPivot.repairedText || '')), 'repair should continue diagnostic steps');

  const identityWrong = await evaluateHermesConversationalCoherence({
    userMessage: 'Eres americana? Pense que peruana.',
    reply: 'I am American and cannot switch language.',
    context: baseContext,
  });
  assert(!identityWrong.accepted, 'identity and locale contradiction should be rejected');
  assert(identityWrong.rejectionReasons.includes('LOCALE_MISMATCH'), 'locale mismatch should be present');
  assert(identityWrong.rejectionReasons.includes('IDENTITY_CONTRADICTION'), 'identity contradiction should be present');

  const visible = await resolveHermesVisibleRuntime({
    businessSlug: 'turagua',
    conversationId: 'h08-visible',
    route: 'initial',
    userMessage: 'Cuales son los pasos?',
    runtimeResult: { provider: 'hermes', message: 'fallback' },
    visibleFallbackMessage: 'fallback',
    context: baseContext,
    selectedSkill: 'customer-conversation',
    candidate: candidate('Tenemos Diagnostico general, Frenos y suspension y Detailing. Dime cual te interesa.'),
  });
  assert(visible.runtime === 'hermes', 'visible decision should stay Hermes-owned with repaired response');
  assert(visible.naturalizationFallbackUsed === true, 'repair should be marked as naturalization fallback');
  assert(/OBD|lecturas del MAF/i.test(visible.message), 'visible repair should preserve the technical topic');

  const ok = await evaluateHermesConversationalCoherence({
    userMessage: 'Como saber si mi sensor MAF esta fallando?',
    reply: 'El MAF mide el flujo de masa de aire. Si falla puede causar perdida de potencia, ralenti inestable o check engine; conviene escanear codigos y revisar lecturas antes de cambiar piezas.',
    context: baseContext,
  });
  assert(ok.accepted, 'grounded Spanish technical answer should pass');

  console.log('h08-coherence-gate: PASS');
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
