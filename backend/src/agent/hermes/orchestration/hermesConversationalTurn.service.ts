import { HermesReadOnlyContext } from '../context/hermesContext.contract';
import {
  compactProjectionJson,
  projectHermesCompositionContext,
  projectHermesInterpretationContext,
} from '../context/hermesModelContextProjector.service';
import { HermesContextBudgetStats } from '../context/hermesContextBudget.service';
import { HermesConversationMemoryPatch } from '../contracts/hermesConversationMemory.contract';
import { HermesTriageResult } from '../contracts/hermesTriage.contract';
import {
  recordHermesModelCircuitOutcome,
  shouldAllowHermesModelCall,
} from '../model/hermesModelCircuitBreaker.service';
import { recordHermesModelMetric } from '../model/hermesModelMetrics.service';
import {
  HermesModelOutcome,
  HermesModelProvider,
  HermesModelStage,
} from '../model/hermesModelOutcome';
import { acquireHermesInferenceGate } from '../model/hermesInferenceGate.service';
import {
  configuredOllamaKeepAlive,
  configuredOllamaModel,
  HermesInferenceRuntimeMetrics,
  queueRejectedRuntimeMetrics,
  runtimeMetricsFromOllamaPayload,
} from '../model/hermesInferenceRuntime.service';
import {
  buildHermesConversationalDelta,
  deriveHermesConversationalState,
  HermesConversationalDelta,
  HermesConversationalState,
} from './hermesConversationalState.service';

export type ModelMessage = { role: 'system' | 'user' | 'assistant'; content: string };
export type ModelMessageBatch = ModelMessage[] & { projectionStats?: HermesContextBudgetStats };

export type ConversationalTurnUnderstanding = {
  primaryIntent?: string;
  relationToPreviousTurn?:
    | 'answers_previous_question'
    | 'continues_topic'
    | 'changes_topic'
    | 'corrects_previous_fact'
    | 'side_question'
    | 'new_request';
  answeredField?: {
    field?: string;
    value?: unknown;
  };
  directAnswerToPreviousQuestion?: {
    field?: string;
    value?: unknown;
  };
  extractedFacts?: Record<string, unknown>;
  corrections?: Record<string, unknown>;
  topic?: string;
  sideQuestions?: Array<{ topic?: string; question?: string }>;
  catalogReferences?: Array<{ offeringId?: string; confidence?: number }>;
  proposedActions?: Array<{ capability?: string; arguments?: Record<string, unknown> }>;
  shouldAdvanceWorkflow?: boolean;
  responseGoal?: string;
  memoryPatch?: HermesConversationMemoryPatch;
  reply?: string;
  provider?: string;
  model?: string;
};

export type HermesResponseObligation = {
  id: string;
  type:
    | 'acknowledge_fact'
    | 'answer_question'
    | 'correct_prior_assumption'
    | 'state_uncertainty'
    | 'ask_clarification'
    | 'present_authoritative_result'
    | 'resume_active_process'
    | 'respect_boundary';
  content: string;
  priority: 'required' | 'optional';
  sourceTurnId: string;
  kind?:
    | 'acknowledge_fact'
    | 'apply_correction'
    | 'answer_question'
    | 'respect_boundary'
    | 'ask_discriminating_question'
    | 'maintain_process_continuity';
  detail?: string;
};

export type HermesObligationCoverage = {
  obligationId: string;
  status: 'satisfied' | 'partial' | 'missing' | 'contradicted';
  reasonCode: string;
};

type ConversationalProposal = HermesTriageResult['proposals'][number];

const FORBIDDEN_VISIBLE_TERMS = [
  'workflow',
  'temporal',
  'payload',
  'endpoint',
  'api',
  'mongodb',
  'mongoose',
  'task queue',
  'schedule-consultation-',
  'subagente',
  'triage',
  'firstname',
  'lastname',
  'managedentitydisplayname',
  'managedentitydescription',
  'preferreddate',
  'selectedslotid',
];

const normalize = (value: string) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const cleanJson = (value: string) => {
  const text = String(value || '').trim();
  if (!text) return undefined;
  return text.startsWith('{') ? text : text.match(/\{[\s\S]*\}/)?.[0];
};

const parseJsonObject = (value: string | undefined) => {
  const jsonText = cleanJson(String(value || ''));
  if (!jsonText) return undefined;
  try {
    const parsed = JSON.parse(jsonText);
    return parsed && typeof parsed === 'object' ? parsed : undefined;
  } catch {
    return undefined;
  }
};

const parseJsonObjectWithOutcome = (value: string | undefined) => {
  const raw = String(value || '');
  if (!raw.trim()) return { outcome: 'empty_response' as HermesModelOutcome };
  const jsonText = cleanJson(raw);
  if (!jsonText) return { outcome: 'invalid_json' as HermesModelOutcome };
  try {
    const parsed = JSON.parse(jsonText);
    return parsed && typeof parsed === 'object'
      ? { outcome: 'ok' as HermesModelOutcome, parsed }
      : { outcome: 'schema_validation_failed' as HermesModelOutcome };
  } catch {
    return { outcome: 'invalid_json' as HermesModelOutcome };
  }
};

const timeoutMs = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const numericEnv = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const fetchWithTimeout = async (url: string, init: RequestInit, ms: number) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

const conversationalTimeoutMs = (stage: HermesModelStage) => {
  if (stage === 'turn_interpretation') {
    return timeoutMs(
      process.env.HERMES_MODEL_INTERPRETATION_TIMEOUT_MS,
      timeoutMs(process.env.HERMES_CONVERSATIONAL_MODEL_TIMEOUT_MS, 4500)
    );
  }
  return timeoutMs(
    process.env.HERMES_MODEL_COMPOSITION_TIMEOUT_MS,
    timeoutMs(process.env.HERMES_CONVERSATIONAL_MODEL_TIMEOUT_MS, 4500)
  );
};

const systemPrompt = (context?: HermesReadOnlyContext) => {
  const agent = context?.business?.agent || {};
  const businessName = context?.business?.businessName || context?.business?.businessSlug || 'el negocio';
  return `Eres ${agent.name || 'Iris'}, ${agent.role || `ejecutiva de atencion de ${businessName}`}. Eres la unica identidad visible ante el cliente. Hablas en español natural, amable, profesional y breve. Reconoces lo que el cliente acaba de decir, no repites preguntas ya respondidas y no diagnosticas fallas sin evaluacion. Ayudas a resolver dudas y coordinar servicios usando solo datos autoritativos. No menciones Hermes, Temporal, workflows, payloads, APIs ni claves internas como firstName, lastName, preferredDate o selectedSlotId; usa etiquetas de cliente como nombre, apellido, fecha u horario. Responde SOLO JSON valido.`;
};

const interpretMessages = (input: {
  userMessage: string;
  context?: HermesReadOnlyContext;
  processState?: any;
  triage?: HermesTriageResult;
}): ModelMessageBatch => {
  const projection = projectHermesInterpretationContext(input);
  const messages: ModelMessage[] = [
    { role: 'system', content: systemPrompt(input.context) },
    { role: 'system', content: `Contexto:${compactProjectionJson(projection)}` },
    ...projection.history,
    {
      role: 'user',
      content: `Mensaje actual: ${input.userMessage}

Devuelve SOLO un objeto JSON con estas claves cuando apliquen:
primaryIntent, relationToPreviousTurn, answeredField, extractedFacts, topic, sideQuestions, proposedActions, shouldAdvanceWorkflow, responseGoal, memoryPatch.

Reglas:
- Si el usuario responde a la ultima pregunta de Iris, extrae el campo aunque sea una frase corta.
- Usa summary, activeTopic y lastAssistantQuestion para resolver "lo", "eso", "revisarlo".
- Para fechas relativas usa formato YYYY-MM-DD cuando sea evidente.
- proposedActions solo puede usar continue_schedule_consultation con submit_customer_information, submit_date_preference, submit_slot_selection o submit_offering_selection.
- memoryPatch guarda solo tema, sintomas, preferencias, correcciones, alias o contexto conversacional.`,
    },
  ];
  return Object.assign(messages, { projectionStats: projection.stats });
};

const composeMessages = (input: {
  userMessage: string;
  context?: HermesReadOnlyContext;
  processState?: any;
  understanding?: ConversationalTurnUnderstanding;
  deterministicReply: string;
  actionExecuted: boolean;
}): ModelMessageBatch => {
  const conversationalState = deriveHermesConversationalState({
    context: input.context,
    userMessage: input.userMessage,
  });
  const conversationalDelta = buildHermesConversationalDelta({
    context: input.context,
    userMessage: input.userMessage,
  });
  const responseObligations = deriveHermesResponseObligations({
    ...input,
    state: conversationalState,
    delta: conversationalDelta,
  });
  const projection = projectHermesCompositionContext({
    ...input,
    interpretation: input.understanding || {},
    conversationalState,
    conversationalDelta,
    responseObligations,
  });
  const messages: ModelMessage[] = [
    { role: 'system', content: systemPrompt(input.context) },
    { role: 'system', content: `Contexto:${compactProjectionJson(projection)}` },
    ...projection.history,
    {
      role: 'user',
      content: `Mensaje actual: ${input.userMessage}

Redacta la unica respuesta visible de Iris. Devuelve SOLO {"reply":"..."}.
Usa primero irisTurnBrief: identidad, conversation.newFacts, knownFacts, process.awaiting.customerLabel, authoritativeFacts, obligations y forbiddenClaims.
Cumple todas las responseObligations, incorpora conversationalDelta y usa conversationalState para no reiniciar la conversacion.
La respuesta deterministica es solo una referencia de seguridad, no una plantilla obligatoria.
Si faltan datos, pide solo uno natural y discriminante usando process.awaiting.customerLabel. Responde preguntas laterales y retoma suave. No dupliques preguntas ni menciones sistemas internos ni claves tecnicas.`,
    },
  ];
  return Object.assign(messages, { projectionStats: projection.stats });
};

const compactCompositionRetryMessages = (input: {
  userMessage: string;
  context?: HermesReadOnlyContext;
  processState?: any;
  understanding?: ConversationalTurnUnderstanding;
  deterministicReply: string;
  actionExecuted: boolean;
  responseObligations: HermesResponseObligation[];
  conversationalDelta: HermesConversationalDelta;
}): ModelMessageBatch => {
  const history = (input.context?.conversation.history || [])
    .filter((entry) => entry.role === 'user' || entry.role === 'assistant')
    .slice(-6)
    .map((entry) => ({ role: entry.role, content: String(entry.content || '').slice(0, 360) }));
  const payload = {
    language: 'es',
    business: {
      name: input.context?.business?.businessName,
      agent: input.context?.business?.agent?.name || 'Iris',
    },
    process: input.processState?.status
      ? {
        status: input.processState.status,
        awaiting: input.processState.awaiting,
      }
      : input.context?.process,
    responseObligations: input.responseObligations.map((item) => ({
      id: item.id,
      type: item.type,
      content: item.content,
      priority: item.priority,
    })),
    conversationalDelta: input.conversationalDelta,
    safeFallbackReference: input.deterministicReply.slice(0, 700),
  };
  const messages: ModelMessage[] = [
    { role: 'system', content: systemPrompt(input.context) },
    { role: 'system', content: `Contexto reducido:${JSON.stringify(payload)}` },
    ...history,
    {
      role: 'user',
      content: `Mensaje actual: ${input.userMessage}

Reintento de redaccion. Devuelve SOLO {"reply":"..."}.
Cumple obligaciones, no ejecutes acciones, no menciones sistemas internos ni claves tecnicas, una sola pregunta util como maximo.`,
    },
  ];
  return Object.assign(messages, { projectionStats: undefined });
};

export type ModelCallMetadata = {
  stage: HermesModelStage;
  conversationId?: string;
  correlationId?: string;
  messageId?: string;
  historyMessageCount?: number;
  contextStats?: HermesContextBudgetStats;
  inferenceRuntime?: HermesInferenceRuntimeMetrics;
};

const inputCharacterCountFrom = (messages: ModelMessage[]) =>
  messages.reduce((total, message) => total + String(message.content || '').length, 0);

const classifyModelError = (error: any): HermesModelOutcome => {
  const message = String(error?.message || error || '');
  if (error?.name === 'AbortError' || /abort|timeout/i.test(message)) return 'timeout';
  if (/_429\b|429|rate/i.test(message)) return 'rate_limited';
  if (/HERMES_INFERENCE_QUEUE_UNAVAILABLE|HERMES_INFERENCE_QUEUE_TIMEOUT/i.test(message)) return 'provider_error';
  if (/ECONNREFUSED|ENOTFOUND|ECONNRESET|fetch failed|network|connect/i.test(message)) return 'connection_error';
  return 'provider_error';
};

const parsedMatchesStageContract = (stage: HermesModelStage, parsed: any) => {
  if (!parsed || typeof parsed !== 'object') return false;
  if (stage === 'reply_composition') return typeof parsed.reply === 'string' && parsed.reply.trim().length > 0;
  return Boolean(
    typeof parsed.primaryIntent === 'string'
    || typeof parsed.responseGoal === 'string'
    || parsed.memoryPatch
    || Array.isArray(parsed.proposedActions)
  );
};

const questionObligationsFrom = (message: string): HermesResponseObligation[] => {
  const normalized = normalize(message);
  const obligations: HermesResponseObligation[] = [];
  if (/\b(peligroso|grave|riesgo|seguro|puedo manejar|puedo seguir|manejar asi|conducir asi)\b/.test(normalized)) {
    obligations.push(makeObligation({
      id: 'answer-risk-prudently',
      type: 'answer_question',
      content: 'Responder riesgo con prudencia; no confirmar seguridad sin revision.',
    }));
  }
  if (/\b(precio|cuesta|costo|vale|tarifa|cobra|cobran)\b/.test(normalized)) {
    obligations.push(makeObligation({
      id: 'answer-price-policy',
      type: 'answer_question',
      content: 'Responder precio solo si esta publicado; si no, decir que no esta confirmado.',
    }));
  }
  if (/\b(cuanto demora|cuanto dura|duracion|demora|dura|tiempo)\b/.test(normalized)) {
    obligations.push(makeObligation({
      id: 'answer-duration-policy',
      type: 'answer_question',
      content: 'Responder duracion con dato autoritativo o aclarar que depende de la evaluacion.',
    }));
  }
  return obligations;
};

const factLabel = (key: string, value: unknown) => {
  if (key === 'vehicle.reportedCondition') return `condicion reportada del vehiculo: ${String(value)}`;
  if (key === 'vehicle.maintenanceQuestion') return `consulta de mantenimiento del vehiculo: ${String(value)}`;
  return `${key}=${String(value)}`;
};

const legacyKindFrom = (type: HermesResponseObligation['type']): NonNullable<HermesResponseObligation['kind']> => {
  if (type === 'correct_prior_assumption') return 'apply_correction';
  if (type === 'ask_clarification') return 'ask_discriminating_question';
  if (type === 'resume_active_process') return 'maintain_process_continuity';
  return type === 'acknowledge_fact' || type === 'answer_question' || type === 'respect_boundary'
    ? type
    : 'answer_question';
};

const makeObligation = (input: {
  id: string;
  type: HermesResponseObligation['type'];
  content: string;
  priority?: HermesResponseObligation['priority'];
  sourceTurnId?: string;
}): HermesResponseObligation => ({
  id: input.id,
  type: input.type,
  content: input.content,
  priority: input.priority || 'required',
  sourceTurnId: input.sourceTurnId || 'current',
  kind: legacyKindFrom(input.type),
  detail: input.content,
});

export const deriveHermesResponseObligations = (input: {
  userMessage: string;
  context?: HermesReadOnlyContext;
  processState?: any;
  understanding?: ConversationalTurnUnderstanding;
  state?: HermesConversationalState;
  delta?: HermesConversationalDelta;
  actionExecuted?: boolean;
}): HermesResponseObligation[] => {
  const state = input.state || deriveHermesConversationalState({ context: input.context, userMessage: input.userMessage });
  const delta = input.delta || buildHermesConversationalDelta({ context: input.context, userMessage: input.userMessage });
  const obligations = new Map<string, HermesResponseObligation>();
  const add = (obligation: HermesResponseObligation) => obligations.set(obligation.id, obligation);

  Object.entries(delta.newFacts || {}).forEach(([key, value]) => add({
    ...makeObligation({
      id: `ack-${key}`,
      type: 'acknowledge_fact',
      content: `Incorporar dato nuevo: ${factLabel(key, value)}.`,
    }),
  }));

  Object.entries(delta.correctedFacts || {}).forEach(([key, value]) => add({
    ...makeObligation({
      id: `correct-${key}`,
      type: 'correct_prior_assumption',
      content: `Aplicar correccion: ${factLabel(key, value)}; no volver a lo descartado.`,
    }),
  }));

  if (delta.answeredQuestion) {
    add(makeObligation({
      id: `answered-${delta.answeredQuestion}`,
      type: 'correct_prior_assumption',
      content: `No repetir pregunta respondida: ${delta.answeredQuestion}.`,
    }));
  }

  questionObligationsFrom(input.userMessage).forEach(add);

  const hasNewEvidence = Object.keys(delta.newFacts || {}).length > 0
    || Object.keys(delta.correctedFacts || {}).length > 0
    || Boolean(delta.answeredQuestion);
  if (hasNewEvidence) {
    add(makeObligation({
      id: 'ask-next-discriminating-question',
      type: 'ask_clarification',
      priority: 'optional',
      content: 'Hacer maximo una pregunta diagnostica util.',
    }));
  }

  const processActive = Boolean(
    (state.activeProcessSummary as any)?.active
    || (input.processState?.status && input.processState.status !== 'NONE')
  );
  if (processActive) {
    add(makeObligation({
      id: 'maintain-process-continuity',
      type: 'resume_active_process',
      content: 'Mantener reserva/proceso activo y dato pendiente.',
    }));
  }

  add(makeObligation({
    id: 'no-internal-systems',
    type: 'respect_boundary',
    content: 'No mencionar sistemas internos.',
  }));

  if (input.understanding?.sideQuestions?.length) {
    input.understanding.sideQuestions.slice(0, 3).forEach((question, index) => add(makeObligation({
      id: `model-side-question-${index}`,
      type: 'answer_question',
      content: `Responder pregunta lateral: ${question.question || question.topic || 'pregunta del usuario'}.`,
    })));
  }

  return [...obligations.values()].slice(0, 8);
};

const hasAny = (text: string, patterns: RegExp[]) => patterns.some((pattern) => pattern.test(text));

const significantFactTokens = (content: string) =>
  normalize(content)
    .replace(/^[^:]+:/, '')
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 5 && ![
      'incorporar',
      'nuevo',
      'nueva',
      'dato',
      'datos',
      'cliente',
      'vehiculo',
      'reportada',
      'condicion',
      'consulta',
      'mantenimiento',
    ].includes(token));

export const evaluateHermesObligationCoverage = (input: {
  reply: string;
  obligations: HermesResponseObligation[];
}): HermesObligationCoverage[] => {
  const text = normalize(input.reply);
  return input.obligations.map((obligation): HermesObligationCoverage => {
    if (obligation.id === 'no-internal-systems') {
      return FORBIDDEN_VISIBLE_TERMS.some((term) => text.includes(normalize(term)))
        ? { obligationId: obligation.id, status: 'contradicted', reasonCode: 'INTERNAL_TERM_VISIBLE' }
        : { obligationId: obligation.id, status: 'satisfied', reasonCode: 'NO_INTERNAL_TERMS' };
    }

    if (obligation.id === 'answer-risk-prudently') {
      if (hasAny(text, [/\b(riesgo|seguro|seguridad|peligro|grave|exigir|manejar|conducir|revisarlo pronto|falla inmediata|empeora|empeorar)\b/])) {
        return { obligationId: obligation.id, status: 'satisfied', reasonCode: 'RISK_ANSWERED' };
      }
      return { obligationId: obligation.id, status: 'missing', reasonCode: 'RISK_NOT_ANSWERED' };
    }

    if (obligation.id === 'answer-price-policy') {
      if (hasAny(text, [/\b(precio|costo|cuesta|tarifa|confirmado|depende|evaluacion)\b/])) {
        return { obligationId: obligation.id, status: 'satisfied', reasonCode: 'PRICE_ANSWERED' };
      }
      return { obligationId: obligation.id, status: 'missing', reasonCode: 'PRICE_NOT_ANSWERED' };
    }

    if (obligation.id === 'answer-duration-policy') {
      if (hasAny(text, [/\b(dura|demora|duracion|tiempo|minutos|horas|depende)\b/])) {
        return { obligationId: obligation.id, status: 'satisfied', reasonCode: 'DURATION_ANSWERED' };
      }
      return { obligationId: obligation.id, status: 'missing', reasonCode: 'DURATION_NOT_ANSWERED' };
    }

    if (obligation.id === 'ack-air_conditioning.cooling') {
      if (hasAny(text, [/\b(si enfria|enfria|esta enfriando)\b/])) {
        return { obligationId: obligation.id, status: 'satisfied', reasonCode: 'COOLING_ACKNOWLEDGED' };
      }
      if (hasAny(text, [/\b(no enfria|deja de enfriar|no esta enfriando)\b/])) {
        return { obligationId: obligation.id, status: 'contradicted', reasonCode: 'COOLING_CONTRADICTED' };
      }
      return { obligationId: obligation.id, status: 'missing', reasonCode: 'COOLING_NOT_ACKNOWLEDGED' };
    }

    if (obligation.id === 'ack-air_conditioning.noiseSource') {
      return /\bcompresor\b/.test(text)
        ? { obligationId: obligation.id, status: 'satisfied', reasonCode: 'COMPRESSOR_ACKNOWLEDGED' }
        : { obligationId: obligation.id, status: 'missing', reasonCode: 'COMPRESSOR_NOT_ACKNOWLEDGED' };
    }

    if (obligation.id === 'ack-condition.highAmbientTemperature') {
      return /\b(calor|temperatura)\b/.test(text)
        ? { obligationId: obligation.id, status: 'satisfied', reasonCode: 'HEAT_CONDITION_ACKNOWLEDGED' }
        : { obligationId: obligation.id, status: 'missing', reasonCode: 'HEAT_CONDITION_NOT_ACKNOWLEDGED' };
    }

    if (obligation.id === 'ack-symptom.noise') {
      return /\b(ruido|suena|sonido|chillido|zumbido|golpe)\b/.test(text)
        ? { obligationId: obligation.id, status: 'satisfied', reasonCode: 'NOISE_ACKNOWLEDGED' }
        : { obligationId: obligation.id, status: 'missing', reasonCode: 'NOISE_NOT_ACKNOWLEDGED' };
    }

    if (obligation.type === 'acknowledge_fact') {
      const tokens = significantFactTokens(obligation.content);
      const acknowledged = tokens.some((token) => text.includes(token));
      return acknowledged
        ? { obligationId: obligation.id, status: 'satisfied', reasonCode: 'FACT_ACKNOWLEDGED' }
        : { obligationId: obligation.id, status: 'missing', reasonCode: 'FACT_NOT_ACKNOWLEDGED' };
    }

    if (obligation.id === 'correct-air_conditioning.does_not_cool') {
      if (hasAny(text, [/\b(no enfria|deja de enfriar|no esta enfriando)\b/])) {
        return { obligationId: obligation.id, status: 'contradicted', reasonCode: 'REPEATED_DISCARDED_NO_COOLING' };
      }
      return { obligationId: obligation.id, status: 'satisfied', reasonCode: 'DISCARDED_NO_COOLING_NOT_REPEATED' };
    }

    if (obligation.id.startsWith('answered-')) {
      if (obligation.id.includes('condition_when_occurs') && hasAny(text, [/\b(deja de enfriar|cuando deja|momento deja)\b/])) {
        return { obligationId: obligation.id, status: 'contradicted', reasonCode: 'REPEATED_ANSWERED_CONDITION_QUESTION' };
      }
      return { obligationId: obligation.id, status: 'satisfied', reasonCode: 'ANSWERED_QUESTION_NOT_REPEATED' };
    }

    if (obligation.type === 'ask_clarification') {
      return /\?/.test(input.reply)
        ? { obligationId: obligation.id, status: 'satisfied', reasonCode: 'CLARIFICATION_ASKED' }
        : { obligationId: obligation.id, status: 'partial', reasonCode: 'NO_CLARIFICATION_QUESTION' };
    }

    if (obligation.type === 'resume_active_process') {
      return hasAny(text, [/\b(me falta|seguimos|reserva|cita|contacto|telefono|apellido|nombre)\b/])
        ? { obligationId: obligation.id, status: 'satisfied', reasonCode: 'PROCESS_RESUMED' }
        : { obligationId: obligation.id, status: 'partial', reasonCode: 'PROCESS_NOT_EXPLICITLY_RESUMED' };
    }

    return { obligationId: obligation.id, status: 'partial', reasonCode: 'COVERAGE_HEURISTIC_NOT_SPECIFIC' };
  });
};

const recordModelCall = (input: {
  provider: HermesModelProvider;
  model: string;
  stage: HermesModelStage;
  outcome: HermesModelOutcome;
  latencyMs: number;
  timeoutMs: number;
  attemptNumber: number;
  fallbackUsed: boolean;
  metadata: ModelCallMetadata;
  circuitState: 'closed' | 'open' | 'half_open';
  inputCharacterCount?: number;
  outputCharacterCount?: number;
  inferenceRuntime?: HermesInferenceRuntimeMetrics;
}) => recordHermesModelMetric({
  provider: input.provider,
  model: input.model,
  stage: input.stage,
  outcome: input.outcome,
  latencyMs: input.latencyMs,
  timeoutMs: input.timeoutMs,
  attemptNumber: input.attemptNumber,
  fallbackUsed: input.fallbackUsed,
  conversationId: input.metadata.conversationId,
  correlationId: input.metadata.correlationId,
  messageId: input.metadata.messageId,
  circuitState: input.circuitState,
  inputCharacterCount: input.inputCharacterCount,
  historyMessageCount: input.metadata.historyMessageCount,
  outputCharacterCount: input.outputCharacterCount,
  contextStats: input.metadata.contextStats,
  inferenceRuntime: input.inferenceRuntime,
});

const callProviderJson = async (input: {
  provider: HermesModelProvider;
  model: string;
  messages: ModelMessageBatch;
  metadata: ModelCallMetadata;
  attemptNumber: number;
  request: (timeoutMs: number) => Promise<string | { text?: string; inferenceRuntime?: HermesInferenceRuntimeMetrics } | undefined>;
}) => {
  const allowed = shouldAllowHermesModelCall(input.provider, input.model);
  const ms = conversationalTimeoutMs(input.metadata.stage);
  const inputCharacterCount = inputCharacterCountFrom(input.messages);
  if (!allowed.allowed) {
    recordModelCall({
      provider: input.provider,
      model: input.model,
      stage: input.metadata.stage,
      outcome: 'circuit_open',
      latencyMs: 0,
      timeoutMs: ms,
      attemptNumber: input.attemptNumber,
      fallbackUsed: true,
      metadata: input.metadata,
      circuitState: allowed.state,
      inputCharacterCount,
    });
    return undefined;
  }

  const startedAt = Date.now();
  let outcome: HermesModelOutcome = 'provider_error';
  let rawText: string | undefined;
  let parsed: any;
  let inferenceRuntime: HermesInferenceRuntimeMetrics | undefined;
  try {
    const response = await input.request(ms);
    rawText = typeof response === 'string' ? response : response?.text;
    inferenceRuntime = typeof response === 'string' ? undefined : response?.inferenceRuntime;
    const parsedResult = parseJsonObjectWithOutcome(rawText);
    outcome = parsedResult.outcome;
    parsed = parsedResult.parsed;
    if (outcome === 'ok' && !parsedMatchesStageContract(input.metadata.stage, parsed)) {
      outcome = 'schema_validation_failed';
      parsed = undefined;
    }
  } catch (error) {
    outcome = classifyModelError(error);
    inferenceRuntime = (error as any)?.inferenceRuntime;
  }

  const latencyMs = Date.now() - startedAt;
  const circuitState = recordHermesModelCircuitOutcome({
    provider: input.provider,
    model: input.model,
    outcome,
  });
  recordModelCall({
    provider: input.provider,
    model: input.model,
    stage: input.metadata.stage,
    outcome,
    latencyMs,
    timeoutMs: ms,
    attemptNumber: input.attemptNumber,
    fallbackUsed: outcome !== 'ok',
    metadata: input.metadata,
    circuitState,
    inputCharacterCount,
    outputCharacterCount: rawText ? String(rawText).length : undefined,
    inferenceRuntime,
  });

  return outcome === 'ok' && parsed
    ? { provider: input.provider, model: input.model, parsed, outcome, latencyMs }
    : undefined;
};

const callOllamaJson = async (messages: ModelMessageBatch, metadata: ModelCallMetadata, attemptNumber: number) => {
  const ollamaUrl = process.env.OLLAMA_URL?.replace(/\/+$/, '');
  if (!ollamaUrl) return undefined;
  const model = configuredOllamaModel();
  return callProviderJson({
    provider: 'ollama',
    model,
    messages,
    metadata,
    attemptNumber,
    request: async (ms) => {
      const lease = await acquireHermesInferenceGate();
      if (!lease.acquired) {
        const error = new Error(`HERMES_INFERENCE_${lease.reason.toUpperCase()}`);
        (error as any).inferenceRuntime = queueRejectedRuntimeMetrics(lease);
        throw error;
      }
      try {
        const keepAlive = configuredOllamaKeepAlive();
        const response = await fetchWithTimeout(`${ollamaUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            stream: false,
            format: 'json',
            keep_alive: keepAlive,
            options: {
              temperature: 0.15,
              num_predict: numericEnv(process.env.HERMES_MODEL_OLLAMA_NUM_PREDICT, 256),
              ...(process.env.HERMES_MODEL_OLLAMA_NUM_CTX
                ? { num_ctx: numericEnv(process.env.HERMES_MODEL_OLLAMA_NUM_CTX, 2048) }
                : {}),
            },
            messages,
          }),
        }, ms);
        if (!response.ok) throw new Error(`OLLAMA_CONVERSATIONAL_ERROR_${response.status}`);
        const payload: any = await response.json();
        return {
          text: payload?.message?.content,
          inferenceRuntime: runtimeMetricsFromOllamaPayload(payload, {
            queueWaitMs: lease.queueWaitMs,
            concurrentRequests: lease.activeInferenceCount,
            keepAliveApplied: keepAlive,
            queueDepth: lease.queueDepth,
            activeInferenceCount: lease.activeInferenceCount,
            maxConcurrent: lease.maxConcurrent,
          }),
        };
      } finally {
        lease.release();
      }
    },
  });
};

const callGeminiJson = async (messages: ModelMessageBatch, metadata: ModelCallMetadata, attemptNumber: number) => {
  const apiKey = (process.env.GEMINI_API_KEY || process.env.GCP_API_KEY || '').trim();
  if (!apiKey || ['YOUR_GEMINI_API_KEY', 'YOUR_GCP_API_KEY'].includes(apiKey)) return undefined;
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  return callProviderJson({
    provider: 'gemini',
    model,
    messages,
    metadata,
    attemptNumber,
    request: async (ms) => {
      const response = await fetchWithTimeout('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          temperature: 0.15,
          response_format: { type: 'json_object' },
          messages,
        }),
      }, ms);
      if (!response.ok) throw new Error(`GEMINI_CONVERSATIONAL_ERROR_${response.status}`);
      const payload: any = await response.json();
      return payload?.choices?.[0]?.message?.content;
    },
  });
};

export const callModelJson = async (messages: ModelMessageBatch, metadata: ModelCallMetadata) => {
  const providerOrder = process.env.HERMES_CONVERSATIONAL_PROVIDER_ORDER === 'gemini-first'
    ? [callGeminiJson, callOllamaJson]
    : [callOllamaJson, callGeminiJson];
  const startedAt = Date.now();
  for (const [index, call] of providerOrder.entries()) {
    const result = await call(messages, metadata, index + 1);
    if (result?.parsed) {
      console.log('[hermes-conversational-turn] model.ok', {
        provider: result.provider,
        model: result.model,
        stage: metadata.stage,
        durationMs: Date.now() - startedAt,
      });
      return { ...result, durationMs: Date.now() - startedAt };
    }
  }
  return undefined;
};

export const interpretHermesTurn = async (input: {
  userMessage: string;
  context?: HermesReadOnlyContext;
  processState?: any;
  triage?: HermesTriageResult;
  conversationId?: string;
  correlationId?: string;
  messageId?: string;
}): Promise<ConversationalTurnUnderstanding | undefined> => {
  if (process.env.HERMES_CONVERSATIONAL_TURN_ENABLED === 'false') return undefined;
  const messages = interpretMessages(input);
  const result = await callModelJson(messages, {
    stage: 'turn_interpretation',
    conversationId: input.conversationId,
    correlationId: input.correlationId,
    messageId: input.messageId,
    historyMessageCount: messages.projectionStats?.historyMessagesIncluded,
    contextStats: messages.projectionStats,
  });
  const parsed: any = result?.parsed;
  if (!parsed) return undefined;
  return {
    ...parsed,
    provider: result?.provider,
    model: result?.model,
  };
};

const safeData = (data: any) => {
  if (!data || typeof data !== 'object') return {};
  const allowed = [
    'firstName',
    'lastName',
    'phone',
    'email',
    'managedEntityDisplayName',
    'managedEntityHint',
    'preferredDate',
    'requestedDate',
    'preferredTime',
    'requestedTime',
    'preferredDayPart',
    'requestedDayPart',
    'notBeforeTime',
    'catalogOfferingId',
    'offeringId',
    'slotId',
    'selectionIndex',
  ];
  return Object.fromEntries(Object.entries(data).filter(([key, value]) =>
    allowed.includes(key) && value !== undefined && value !== null && String(value).trim() !== ''
  ));
};

const slotIdFromSelection = (context: HermesReadOnlyContext | undefined, selectionIndex: unknown) => {
  const index = Number(selectionIndex);
  if (!Number.isInteger(index) || index < 1) return undefined;
  const slots = context?.process?.availableOptions || [];
  const selected: any = slots[index - 1];
  return selected?._id || selected?.id || selected?.slotId;
};

const proposalFromModelAction = (input: {
  action: any;
  context?: HermesReadOnlyContext;
  workflowId?: string;
}): ConversationalProposal | undefined => {
  if (!input.action || input.action.capability !== 'continue_schedule_consultation' || !input.workflowId) return undefined;
  const args = input.action.arguments || {};
  const actionName = String(args.action || '');
  if (![
    'submit_customer_information',
    'submit_date_preference',
    'submit_slot_selection',
    'submit_offering_selection',
  ].includes(actionName)) return undefined;

  const data = safeData(args.data || {});
  if (actionName === 'submit_slot_selection' && !data.slotId && data.selectionIndex) {
    const slotId = slotIdFromSelection(input.context, data.selectionIndex);
    if (slotId) data.slotId = slotId;
    delete data.selectionIndex;
  }
  if (actionName === 'submit_date_preference' && data.requestedDate && !data.preferredDate) {
    data.preferredDate = data.requestedDate;
  }
  if (actionName === 'submit_offering_selection' && data.offeringId && !data.catalogOfferingId) {
    data.catalogOfferingId = data.offeringId;
  }
  if (!Object.keys(data).length) return undefined;

  return {
    capability: 'continue_schedule_consultation',
    arguments: {
      action: actionName,
      data,
    },
    reasonCode: `MODEL_${actionName.toUpperCase()}`,
  };
};

export const modelProposalsFromUnderstanding = (input: {
  understanding?: ConversationalTurnUnderstanding;
  context?: HermesReadOnlyContext;
  workflowId?: string;
}): ConversationalProposal[] => {
  if (!input.understanding?.shouldAdvanceWorkflow) return [];
  const proposedActions = Array.isArray(input.understanding.proposedActions)
    ? input.understanding.proposedActions
    : [];
  return proposedActions
    .map((action) => proposalFromModelAction({ action, context: input.context, workflowId: input.workflowId }))
    .filter((proposal): proposal is ConversationalProposal => Boolean(proposal))
    .slice(0, 2);
};

const isClientSafeReply = (reply: string) => {
  const normalized = normalize(reply);
  return Boolean(reply.trim())
    && reply.trim().length <= 1200
    && !FORBIDDEN_VISIBLE_TERMS.some((term) => normalized.includes(term));
};

const logIrisTurnBriefMetric = (input: {
  conversationId?: string;
  correlationId?: string;
  messageId?: string;
  context?: HermesReadOnlyContext;
  processState?: any;
  conversationalState: HermesConversationalState;
  conversationalDelta: HermesConversationalDelta;
  responseObligations: HermesResponseObligation[];
  obligationCoverage?: HermesObligationCoverage[];
  provider?: string;
  model?: string;
  compositionSucceeded: boolean;
  fallbackUsed: boolean;
  retryUsed: boolean;
  gateResult?: 'accepted' | 'rejected';
  repairUsed?: boolean;
}) => {
  const process = input.processState?.status ? input.processState : (input.context as any)?.process;
  const awaiting = process?.awaiting;
  const expectedFactIds = input.responseObligations
    .filter((obligation) => obligation.type === 'acknowledge_fact')
    .map((obligation) => obligation.id.replace(/^ack-/, ''));
  const acknowledgedFactIds = (input.obligationCoverage || [])
    .filter((coverage) => coverage.status === 'satisfied' && coverage.obligationId.startsWith('ack-'))
    .map((coverage) => coverage.obligationId.replace(/^ack-/, ''));
  const repeatedAnsweredQuestion = (input.obligationCoverage || [])
    .some((coverage) => coverage.reasonCode.startsWith('REPEATED_ANSWERED'));
  const unsupportedClaimCount = (input.obligationCoverage || [])
    .filter((coverage) => coverage.status === 'contradicted' && coverage.reasonCode.includes('UNSUPPORTED'))
    .length;
  console.log('[iris-turn-brief]', JSON.stringify({
    conversationId: input.conversationId,
    correlationId: input.correlationId,
    messageId: input.messageId,
    newFactTypes: Object.keys(input.conversationalDelta.newFacts || {}),
    knownFactTypes: input.conversationalState.knownFacts.map((fact) => fact.key).slice(0, 12),
    activeTopic: input.context?.conversation.memory?.activeTopic
      || input.conversationalState.currentTopic
      || null,
    awaiting: awaiting
      ? {
        type: awaiting.type,
        key: awaiting.nextRecommendedField || awaiting.field,
      }
      : undefined,
    obligationsCount: input.responseObligations.length,
    forbiddenClaimsCount: FORBIDDEN_VISIBLE_TERMS.length,
    expectedFactIds,
    provider: input.provider,
    model: input.model,
    compositionSucceeded: input.compositionSucceeded,
    fallbackUsed: input.fallbackUsed,
    retryUsed: input.retryUsed,
    gateResult: input.gateResult,
    repairUsed: input.repairUsed,
    acknowledgedFactIds,
    repeatedAnsweredQuestion,
    unsupportedClaimCount,
  }));
};

export const composeHermesReply = async (input: {
  userMessage: string;
  context?: HermesReadOnlyContext;
  processState?: any;
  understanding?: ConversationalTurnUnderstanding;
  deterministicReply: string;
  actionExecuted: boolean;
  conversationId?: string;
  correlationId?: string;
  messageId?: string;
}) => {
  if (process.env.HERMES_CONVERSATIONAL_REPLY_ENABLED === 'false') return undefined;
  const messages = composeMessages(input);
  const conversationalState = deriveHermesConversationalState({ context: input.context, userMessage: input.userMessage });
  const conversationalDelta = buildHermesConversationalDelta({ context: input.context, userMessage: input.userMessage });
  const responseObligations = deriveHermesResponseObligations({
    ...input,
    state: conversationalState,
    delta: conversationalDelta,
  });
  let result = await callModelJson(messages, {
    stage: 'reply_composition',
    conversationId: input.conversationId,
    correlationId: input.correlationId,
    messageId: input.messageId,
    historyMessageCount: messages.projectionStats?.historyMessagesIncluded,
    contextStats: messages.projectionStats,
  });
  let retryUsed = false;
  if (!result && process.env.HERMES_CONVERSATIONAL_COMPOSITION_RETRY_ENABLED !== 'false') {
    retryUsed = true;
    const retryMessages = compactCompositionRetryMessages({
      ...input,
      responseObligations,
      conversationalDelta,
    });
    result = await callModelJson(retryMessages, {
      stage: 'reply_composition',
      conversationId: input.conversationId,
      correlationId: input.correlationId,
      messageId: input.messageId,
      historyMessageCount: retryMessages.projectionStats?.historyMessagesIncluded,
      contextStats: retryMessages.projectionStats,
    });
  }
  const reply = String((result?.parsed as any)?.reply || '').trim();
  if (!isClientSafeReply(reply)) {
    logIrisTurnBriefMetric({
      ...input,
      conversationalState,
      conversationalDelta,
      responseObligations,
      provider: result?.provider,
      model: result?.model,
      compositionSucceeded: false,
      fallbackUsed: true,
      retryUsed,
      gateResult: 'rejected',
      repairUsed: retryUsed,
    });
    return undefined;
  }
  const obligationCoverage = evaluateHermesObligationCoverage({
    reply,
    obligations: responseObligations,
  });
  logIrisTurnBriefMetric({
    ...input,
    conversationalState,
    conversationalDelta,
    responseObligations,
    obligationCoverage,
    provider: result?.provider,
    model: result?.model,
    compositionSucceeded: true,
    fallbackUsed: false,
    retryUsed,
    gateResult: 'accepted',
    repairUsed: retryUsed,
  });
  return {
    reply,
    provider: result?.provider,
    model: result?.model,
    retryUsed,
    responseObligations,
    obligationCoverage,
    conversationalState,
    conversationalDelta,
  };
};
