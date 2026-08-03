import assert from 'assert';
import { deterministicFallback } from '../../fallback/deterministicFallback';
import { HermesReadOnlyContext } from '../context/hermesContext.contract';
import { buildHermesTriageResult } from '../orchestration/hermesTriage.service';
import { assessHermesTurn, buildHermesDispatchPlan } from '../orchestration/hermesReceptionDesk.service';
import { synthesizeHermesResponseCandidate } from '../orchestration/hermesResponseSynthesizer.service';
import { evaluateHermesConversationalCoherence } from '../orchestration/hermesConversationalCoherenceGate.service';
import { classifyHermesSemanticTurn, resolveHermesDomain } from '../routing/hermesSemanticTurn.service';

const businessSlug = 'demo_test';

const context = (history: HermesReadOnlyContext['conversation']['history'] = []): HermesReadOnlyContext => ({
  business: {
    businessSlug,
    businessName: 'Turagua Racing Peru',
    timezone: 'America/Lima',
    agent: { name: 'Iris', role: 'asistente automotriz' },
  },
  conversation: { conversationId: `h10-${Date.now()}`, channel: 'web_agent', history },
  process: { active: false, allowedActions: [], informationalOnly: true },
  catalog: [
    { id: 'diagnostico-general', name: 'Diagnostico general', description: 'Revision con scanner y codigos.', durationMinutes: 60, pricing: { type: 'not_published' }, publicVisible: true, active: true },
    { id: 'mantenimiento-preventivo', name: 'Mantenimiento preventivo', description: 'Revision preventiva de motor, filtros, bujias y fluidos.', durationMinutes: 90, pricing: { type: 'not_published' }, publicVisible: true, active: true },
    { id: 'motor-rendimiento', name: 'Motor y rendimiento', description: 'Evaluacion de motor, inyeccion, encendido y rendimiento.', durationMinutes: 60, pricing: { type: 'not_published' }, publicVisible: true, active: true },
  ],
  permissions: { mode: 'qa_primary', readOnly: true, canExecuteActions: false },
});

const candidateFor = async (message: string, ctx = context()) => {
  const assessment = await assessHermesTurn({
    businessSlug,
    conversationId: ctx.conversation.conversationId,
    message,
    context: ctx,
    messageId: `h10-${Date.now()}`,
  });
  const plan = await buildHermesDispatchPlan({ assessment, correlationId: `corr-${Date.now()}`, locale: 'es-PE' });
  const triage = await buildHermesTriageResult({ assessment, plan, context: ctx, runtimeResult: { toolResults: [] } });
  const candidate = await synthesizeHermesResponseCandidate({
    turnId: plan.turnId,
    conversationId: plan.conversationId,
    correlationId: plan.correlationId,
    businessSlug,
    agentPersona: ctx.business?.agent,
    userMessage: message,
    turnAssessment: assessment,
    dispatchPlan: plan,
    skillResult: {
      invocationId: `${plan.turnId}:skill`,
      skillId: plan.selectedSkill,
      skillVersion: 'h10',
      status: 'ANSWER_READY',
      ownerRetainedByHermes: true,
      actionExecutionAllowed: false,
      summary: 'test',
      fallbackUsed: false,
      durationMs: 1,
      producedAt: new Date().toISOString(),
    },
    readOnlyContext: ctx,
    activeProcessSummary: { active: false },
    knownFacts: { catalogMatchStatus: triage.catalogMatch.status },
    sideQuestions: assessment.secondaryIntents.map((intent) => ({ type: intent.type, summary: intent.summary })),
    language: 'es',
    visibilityMode: 'visible_controlled',
  });
  return { assessment, plan, triage, candidate };
};

const hasCatalogDump = (text: string) => /\b1\.\s+[\s\S]*\b2\.\s+[\s\S]*\b3\.\s+/.test(text);
const assertAutomotiveInvariant = async (message: string) => {
  const ctx = context();
  const domain = await resolveHermesDomain({ message, context: ctx });
  const semantic = await classifyHermesSemanticTurn({ message, context: ctx });
  const turn = await candidateFor(message, ctx);
  assert(domain.domain === 'automotive' || domain.domain === 'uncertain', `${message} resolved as ${domain.domain}`);
  assert(semantic.intent !== 'off_domain', `${message} classified off_domain`);
  assert(!turn.triage.workflowAdvanceAllowed, `${message} should not advance Temporal`);
  assert(!hasCatalogDump(turn.candidate.candidateText), `${message} dumped catalog`);
  assert(!/comida|lomo saltado/i.test(turn.candidate.candidateText), `${message} mentioned irrelevant food`);
  assert(turn.candidate.candidateText.trim().length > 20, `${message} produced empty guidance`);
};

const concepts = [
  'afinamiento electronico',
  'limpieza de inyectores',
  'bobinas',
  'bujias iridium',
  'computadora del carro',
  'sistema de inyeccion',
  'cuerpo de aceleracion',
  'valvula EGR',
  'catalizador',
  'homocinetica',
  'direccion hidraulica',
  'alternador',
  'radiador',
  'turbo',
  'sensor de oxigeno',
  'sensor MAP',
  'sensor TPS',
  'actuador IAC',
  'bomba de gasolina',
  'filtro de combustible',
  'correa de distribucion',
  'termostato',
  'compresion del motor',
  'retenes',
  'soportes de motor',
  'cardan',
  'diferencial',
  'cremallera',
  'modulo ABS',
  'scanner OBD',
];

const formulations = (concept: string) => [
  `Necesito revisar ${concept}.`,
  `Quiero que vean ${concept}.`,
  `Tengo problema con ${concept}.`,
  `Me preocupa ${concept}, esta fallando.`,
  `Podrian hacer una revision de ${concept}?`,
];

const colloquialSymptoms = [
  'El carro se chancha al acelerar.',
  'Se jalonea en subida.',
  'Siento que se queda cuando piso.',
  'Esta gastando demasiada gasolina.',
  'El motor cabecea.',
  'Cascabelea cuando acelero.',
  'Arranca pesado en las mananas.',
  'Se apaga cuando llego al semaforo.',
  'Anda medio ahogado.',
  'Pierde fuerza con el aire prendido.',
];

const externalQueries = [
  'Quiero comprar una laptop.',
  'Preparan tortas?',
  'Ayudame con una tarea de historia.',
  'Busco pasajes a Cusco.',
  'Venden zapatillas?',
  'Hazme una receta de ceviche.',
  'Necesito reservar un hotel.',
  'Quiero un prestamo bancario.',
  'Me duele la cabeza, que medicina tomo?',
  'Compran ropa usada?',
  'Hacen pollo a la brasa?',
  'Necesito resolver mi examen de matematica.',
  'Cuanto cuesta un vuelo a Lima?',
  'Quiero abrir una cuenta bancaria.',
  'Venden celulares?',
  'Me ayudas con un ensayo de colegio?',
  'Tienen paquetes turisticos?',
  'Preparan hamburguesas?',
  'Quiero una consulta medica humana.',
  'Venden televisores?',
];

const ambiguousQueries = [
  'Necesito una afinacion.',
  'Quiero revisar la computadora.',
  'Esta fallando la maquina.',
  'Necesito un servicio electronico.',
];

const run = async () => {
  for (const concept of concepts) {
    for (const phrase of formulations(concept)) await assertAutomotiveInvariant(phrase);
  }
  for (const phrase of colloquialSymptoms) await assertAutomotiveInvariant(phrase);
  for (const phrase of ambiguousQueries) await assertAutomotiveInvariant(phrase);

  const afinamiento = await candidateFor('Quiero un afinamiento electronico.');
  assert(/afinamiento|scanner|inyeccion|rendimiento|falla especifica/i.test(afinamiento.candidate.candidateText), 'afinamiento should receive contextual automotive guidance');

  for (const phrase of externalQueries) {
    const domain = await resolveHermesDomain({ message: phrase, context: context() });
    const semantic = await classifyHermesSemanticTurn({ message: phrase, context: context() });
    const turn = await candidateFor(phrase);
    assert(domain.domain === 'clearly_external', `${phrase} should be clearly external`);
    assert(semantic.intent === 'off_domain', `${phrase} should classify off_domain`);
    assert(!hasCatalogDump(turn.candidate.candidateText), `${phrase} dumped catalog`);
    if (!/comida|torta|ceviche|pollo|hamburguesa/i.test(phrase)) {
      assert(!/No ofrecemos comida/i.test(turn.candidate.candidateText), `${phrase} used food fallback incorrectly`);
    }
  }

  const gate = await evaluateHermesConversationalCoherence({
    userMessage: 'Quiero un afinamiento electronico.',
    reply: 'No ofrecemos comida. Tenemos estos servicios disponibles.',
    context: context(),
  });
  assert(!gate.accepted, 'gate should reject irrelevant food fallback for automotive-ish query');
  assert(gate.rejectionReasons.includes('IRRELEVANT_OFF_DOMAIN_REASON'), 'missing irrelevant off-domain reason');

  const fallback = await deterministicFallback({
    conversation: { conversationId: 'h10-fallback', businessSlug, channel: 'web_agent', recentMessages: [] },
    business: {
      businessSlug,
      business: { name: 'Turagua Racing Peru', timezone: 'America/Lima' },
      agent: { name: 'Iris', role: 'asistente' },
      capabilities: [],
      catalogSummary: context().catalog?.map((item) => ({
        id: item.id,
        name: item.name || item.id,
        description: item.description,
        durationMinutes: item.durationMinutes,
      })),
    },
  }, 'Quiero un afinamiento electronico.');
  assert(!/comida|no ofrecemos/i.test(String(fallback.reply || '')), 'fallback should not reject afinamiento as food/off-domain');

  const greeted = await candidateFor('Hola', context([
    { role: 'user', content: 'Hola Iris' },
    { role: 'assistant', content: 'Hola, soy Iris. En que puedo ayudarte?' },
  ]));
  assert(!/^Hola,\s*soy\s+Iris/i.test(greeted.candidate.candidateText), 'repeated greeting should not reintroduce Iris');
  const namedGreeting = await candidateFor('Hola Iris!');
  assert(!/^Hola,\s*soy\s+Iris/i.test(namedGreeting.candidate.candidateText), 'named greeting should not reintroduce Iris after widget welcome');
  console.log('h10-open-world-domain: PASS');
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
