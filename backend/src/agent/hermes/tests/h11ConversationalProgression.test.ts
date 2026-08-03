import assert from 'assert';
import { HermesReadOnlyContext } from '../context/hermesContext.contract';
import { buildAutomotiveGuidanceReply, classifyHermesSemanticTurn } from '../routing/hermesSemanticTurn.service';
import { deriveHermesConversationalState } from '../orchestration/hermesConversationalState.service';
import { evaluateHermesConversationalCoherence } from '../orchestration/hermesConversationalCoherenceGate.service';

const context = (history: HermesReadOnlyContext['conversation']['history']): HermesReadOnlyContext => ({
  business: {
    businessSlug: 'turagua',
    businessName: 'Turagua Racing Peru',
    timezone: 'America/Lima',
    agent: { name: 'Iris', role: 'asistente automotriz' },
  },
  conversation: {
    conversationId: `h11-${Date.now()}`,
    channel: 'web_agent',
    history,
  },
  process: { active: false, allowedActions: [], informationalOnly: true },
  catalog: [
    { id: 'diagnostico-general', name: 'Diagnostico general', description: 'Revision general', durationMinutes: 60, pricing: { type: 'not_published' }, publicVisible: true, active: true },
    { id: 'motor-rendimiento', name: 'Motor y rendimiento', description: 'Motor y rendimiento', durationMinutes: 60, pricing: { type: 'not_published' }, publicVisible: true, active: true },
  ],
  permissions: { mode: 'qa_primary', readOnly: true, canExecuteActions: false },
});

const reply = async (message: string, history: HermesReadOnlyContext['conversation']['history']) => {
  const ctx = context(history);
  const semantic = await classifyHermesSemanticTurn({ message, context: ctx });
  return await buildAutomotiveGuidanceReply({ message, context: ctx, semantic });
};

const run = async () => {
  const acHistory: HermesReadOnlyContext['conversation']['history'] = [
    { role: 'user', content: 'Mi carro suena cuando prendo el aire acondicionado.' },
    { role: 'assistant', content: 'Si el aire acondicionado no enfria, puede ser bajo gas, fuga, compresor, relay, ventilador o filtro obstruido. Conviene revisar presiones y funcionamiento electrico antes de cargar gas a ciegas. En que momento deja de enfriar?' },
  ];
  const acReply = await reply('Enfria pero suena el compresor.', acHistory);
  assert(/si enfria|compresor hace ruido|compresor/i.test(acReply), 'AC correction should acknowledge cooling and compressor noise');
  assert(!/deja de enfriar/i.test(acReply), 'AC correction must not repeat no-cooling question');
  assert(/activas el aire|apagarlo|revoluciones/i.test(acReply), 'AC correction should ask a more specific diagnostic question');

  const acHeatHistory = [
    ...acHistory,
    { role: 'user' as const, content: 'Enfria pero suena el compresor.' },
    { role: 'assistant' as const, content: acReply },
  ];
  const acHeatReply = await reply('Cuando hace mucho calor.', acHeatHistory);
  assert(/mucho calor|alta temperatura|calor/i.test(acHeatReply), 'AC heat condition should be incorporated');
  assert(!/deja de enfriar/i.test(acHeatReply), 'AC heat follow-up must not return to no-cooling');

  const repeatedGate = await evaluateHermesConversationalCoherence({
    userMessage: 'Enfria pero suena el compresor.',
    reply: acHistory[1].content,
    context: context(acHistory),
  });
  assert(!repeatedGate.accepted, 'gate should reject repeated response after correction');
  assert(repeatedGate.rejectionReasons.includes('REPEATED_RESPONSE_AFTER_NEW_EVIDENCE'), 'missing repetition reason');

  const vibrationHistory: HermesReadOnlyContext['conversation']['history'] = [
    { role: 'assistant', content: 'Pierde potencia cuando aceleras?' },
  ];
  const vibrationReply = await reply('No, solo vibra.', vibrationHistory);
  assert(/no es perdida de potencia|vibracion/i.test(vibrationReply), 'power-loss negation should update to vibration');
  assert(!/perdida de potencia\?/i.test(vibrationReply), 'should not ask power-loss question again');

  const clutchHistory: HermesReadOnlyContext['conversation']['history'] = [
    { role: 'assistant', content: 'El embrague esta duro?' },
  ];
  const clutchReply = await reply('No, patina cuando acelero.', clutchHistory);
  assert(/no esta duro|patina/i.test(clutchReply), 'clutch correction should switch from hard pedal to slipping');
  assert(/subida|exigir|motor/i.test(clutchReply), 'clutch correction should progress with a specific question');

  const coldState = deriveHermesConversationalState({
    context: context([{ role: 'assistant', content: 'La luz queda encendida?' }]),
    userMessage: 'Solo aparece en frio.',
  });
  assert(coldState.knownFacts.some((fact) => fact.key === 'condition.coldOnly'), 'cold-only condition should be captured');
  assert(coldState.questionsAlreadyAnswered.length > 0, 'answered question should be marked');

  console.log('h11-conversational-progression: PASS');
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
