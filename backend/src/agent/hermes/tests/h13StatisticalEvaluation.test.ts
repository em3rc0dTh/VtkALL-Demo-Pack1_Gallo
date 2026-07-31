import assert from 'assert';
import { HermesReadOnlyContext } from '../context/hermesContext.contract';
import { evaluateHermesConversationalCoherence } from '../orchestration/hermesConversationalCoherenceGate.service';
import {
  deriveHermesResponseObligations,
  evaluateHermesObligationCoverage,
} from '../orchestration/hermesConversationalTurn.service';
import {
  buildAutomotiveGuidanceReply,
  buildExternalDomainReply,
  classifyHermesSemanticTurn,
  isAutomotiveSemanticIntent,
} from '../routing/hermesSemanticTurn.service';

type EvalClass =
  | 'social'
  | 'automotive_qa'
  | 'automotive_symptom'
  | 'catalog'
  | 'booking'
  | 'active_process_question'
  | 'multi_intent';

type EvalTurn = {
  className: EvalClass;
  message: string;
  activeProcess?: boolean;
  awaitingField?: string;
};

type EvalConversation = {
  name: string;
  turns: EvalTurn[];
};

type EvalResult = {
  className: EvalClass;
  message: string;
  reply: string;
  accepted: boolean;
  repaired: boolean;
  requiredMissing: number;
  requiredContradicted: number;
  catalogDump: boolean;
  temporalLeak: boolean;
  repeatedQuestion: boolean;
};

const catalog: HermesReadOnlyContext['catalog'] = [
  { id: 'diagnostico-general', name: 'Diagnostico general', description: 'Revision general', durationMinutes: 60, pricing: { type: 'not_published' }, publicVisible: true, active: true },
  { id: 'motor-rendimiento', name: 'Motor y rendimiento', description: 'Motor y rendimiento', durationMinutes: 60, pricing: { type: 'not_published' }, publicVisible: true, active: true },
  { id: 'frenos-suspension', name: 'Frenos y suspension', description: 'Frenos y suspension', durationMinutes: 60, pricing: { type: 'not_published' }, publicVisible: true, active: true },
  { id: 'arenado-undercoating', name: 'Arenado + Undercoating', description: 'Arenado y proteccion undercoating', durationMinutes: 180, pricing: { type: 'not_published' }, publicVisible: true, active: true },
];

const baseContext = (
  history: HermesReadOnlyContext['conversation']['history'],
  turn: EvalTurn
): HermesReadOnlyContext => ({
  business: {
    businessSlug: 'turagua-racing-peru',
    businessName: 'Turagua Racing Peru',
    timezone: 'America/Lima',
    agent: { name: 'Iris', role: 'asistente automotriz' },
  },
  conversation: {
    conversationId: 'h13-eval',
    channel: 'web_agent',
    history,
  },
  process: {
    active: Boolean(turn.activeProcess),
    allowedActions: [],
    informationalOnly: !turn.activeProcess,
    awaiting: turn.awaitingField
      ? { type: 'customer_information', nextRecommendedField: turn.awaitingField }
      : undefined,
  } as any,
  catalog,
  permissions: { mode: 'qa_primary', readOnly: true, canExecuteActions: false },
});

const fallbackReplyFor = async (message: string, context: HermesReadOnlyContext) => {
  const semantic = await classifyHermesSemanticTurn({ message, context });
  if (semantic.intent === 'off_domain') return await buildExternalDomainReply({ message, context });
  if (isAutomotiveSemanticIntent(semantic.intent)) {
    return await buildAutomotiveGuidanceReply({ message, context, semantic });
  }
  if (semantic.intent === 'booking_intent') return 'Claro, te ayudo a reservar. Primero dime que servicio necesita tu vehiculo.';
  if (semantic.intent === 'catalog_general' || semantic.intent === 'catalog_offering_question') {
    return 'Puedo orientarte con los servicios activos del taller. Dime que necesitas revisar y te ubico la opcion correcta.';
  }
  return 'Aqui estoy contigo. Cuentame que necesitas revisar o resolver.';
};

const hasCatalogDump = (reply: string) => (reply.match(/(?:^|\n)\s*\d+\.\s+/g) || []).length >= 2;
const hasInternalLeak = (reply: string) => /\b(temporal|workflow|api|mongodb|payload)\b/i.test(reply);
const repeatsAnsweredQuestion = (reply: string) => /\bdeja de enfriar\b/i.test(reply);

const evaluateTurn = async (
  turn: EvalTurn,
  history: HermesReadOnlyContext['conversation']['history']
): Promise<EvalResult> => {
  const context = baseContext(history, turn);
  const candidateReply = await fallbackReplyFor(turn.message, context);
  const candidateGate = await evaluateHermesConversationalCoherence({
    userMessage: turn.message,
    reply: candidateReply,
    context,
  });
  const reply = candidateGate.repairedText || candidateReply;
  const obligations = deriveHermesResponseObligations({ userMessage: turn.message, context });
  const coverage = evaluateHermesObligationCoverage({ reply, obligations });
  const requiredIds = new Set(obligations.filter((item) => item.priority === 'required').map((item) => item.id));
  const gate = await evaluateHermesConversationalCoherence({
    userMessage: turn.message,
    reply,
    context,
  });
  return {
    className: turn.className,
    message: turn.message,
    reply,
    accepted: gate.accepted,
    repaired: Boolean(candidateGate.repairedText),
    requiredMissing: coverage.filter((item) => requiredIds.has(item.obligationId) && item.status === 'missing').length,
    requiredContradicted: coverage.filter((item) => requiredIds.has(item.obligationId) && item.status === 'contradicted').length,
    catalogDump: hasCatalogDump(reply) && !/\b(servicios|catalogo|opciones|ofrecen)\b/i.test(turn.message),
    temporalLeak: hasInternalLeak(reply),
    repeatedQuestion: /\benfria/i.test(turn.message) && repeatsAnsweredQuestion(reply),
  };
};

const conversations: EvalConversation[] = [
  {
    name: 'air-conditioning-long-thread',
    turns: [
      { className: 'automotive_symptom', message: 'Mi carro suena cuando prendo el aire acondicionado' },
      { className: 'multi_intent', message: 'Enfria, pero suena el compresor. Eso es peligroso y cuanto cuesta revisarlo?' },
      { className: 'automotive_symptom', message: 'Cuando hace mucho calor suena mas' },
      { className: 'automotive_symptom', message: 'No, no deja de enfriar' },
      { className: 'automotive_symptom', message: 'En realidad hoy dejo de enfriar un rato' },
      { className: 'booking', message: 'Quiero reservar una revision para eso' },
      { className: 'active_process_question', message: 'Antes de darte mi telefono, puedo manejar asi?', activeProcess: true, awaitingField: 'phone' },
      { className: 'active_process_question', message: 'Mi telefono es 999888777', activeProcess: true, awaitingField: 'phone' },
    ],
  },
  {
    name: 'engine-and-catalog-holdout',
    turns: [
      { className: 'social', message: 'Hola Iris' },
      { className: 'automotive_qa', message: 'Que sintomas da un sensor MAF fallando?' },
      { className: 'automotive_qa', message: 'Cuales son los pasos para revisarlo?' },
      { className: 'automotive_symptom', message: 'Mi carro vibra pero no pierde potencia' },
      { className: 'catalog', message: 'Tienen undercoating?' },
      { className: 'booking', message: 'Quiero reservar para undercoating' },
      { className: 'active_process_question', message: 'Cuanto dura y cuanto cuesta?', activeProcess: true, awaitingField: 'phone' },
    ],
  },
  {
    name: 'corrections-and-topic-switch',
    turns: [
      { className: 'automotive_symptom', message: 'El embrague esta duro' },
      { className: 'automotive_symptom', message: 'No, pensando bien patina cuando acelero' },
      { className: 'automotive_symptom', message: 'Olvida lo del embrague, ahora quiero consultar por frenos' },
      { className: 'automotive_symptom', message: 'Suena cuando freno fuerte' },
      { className: 'multi_intent', message: 'Eso es grave y cuanto demora revisarlo?' },
      { className: 'catalog', message: 'Que servicio corresponde?' },
    ],
  },
];

const summarize = (results: EvalResult[]) => {
  const byClass: Record<string, any> = {};
  for (const result of results) {
    const bucket = byClass[result.className] || {
      total: 0,
      accepted: 0,
      repaired: 0,
      requiredMissing: 0,
      requiredContradicted: 0,
      catalogDump: 0,
      temporalLeak: 0,
      repeatedQuestion: 0,
    };
    bucket.total += 1;
    if (result.accepted) bucket.accepted += 1;
    if (result.repaired) bucket.repaired += 1;
    bucket.requiredMissing += result.requiredMissing;
    bucket.requiredContradicted += result.requiredContradicted;
    if (result.catalogDump) bucket.catalogDump += 1;
    if (result.temporalLeak) bucket.temporalLeak += 1;
    if (result.repeatedQuestion) bucket.repeatedQuestion += 1;
    byClass[result.className] = bucket;
  }
  return byClass;
};

const run = async () => {
  const results: EvalResult[] = [];
  for (const conversation of conversations) {
    const history: HermesReadOnlyContext['conversation']['history'] = [];
    for (const turn of conversation.turns) {
      const result = await evaluateTurn(turn, history);
      results.push(result);
      history.push({ role: 'user', content: turn.message });
      history.push({ role: 'assistant', content: result.reply });
    }
  }

  const failures = results.filter((result) =>
    !result.accepted
    || result.requiredMissing > 0
    || result.requiredContradicted > 0
    || result.catalogDump
    || result.temporalLeak
    || result.repeatedQuestion
  );

  const report = {
    label: 'HERMES-EVAL-01 Statistical Property Evaluation',
    totalTurns: results.length,
    byClass: summarize(results),
    failures: failures.map((failure) => ({
      className: failure.className,
      message: failure.message,
      reply: failure.reply,
      accepted: failure.accepted,
      requiredMissing: failure.requiredMissing,
      requiredContradicted: failure.requiredContradicted,
      catalogDump: failure.catalogDump,
      temporalLeak: failure.temporalLeak,
      repeatedQuestion: failure.repeatedQuestion,
    })),
  };

  console.log(JSON.stringify(report, null, 2));
  assert(failures.length === 0, `h13 statistical evaluation found ${failures.length} failures`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
