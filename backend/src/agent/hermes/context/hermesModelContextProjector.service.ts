import { HermesTriageResult } from '../contracts/hermesTriage.contract';
import { HermesReadOnlyContext } from './hermesContext.contract';
import {
  buildBudgetStats,
  compactJson,
  compactWhitespace,
  hermesContextBudgetConfig,
  HermesContextBudgetStats,
  pruneEmpty,
  truncateText,
} from './hermesContextBudget.service';

type ModelHistoryMessage = { role: 'user' | 'assistant'; content: string };

type ProjectionInput = {
  userMessage: string;
  context?: HermesReadOnlyContext;
  processState?: any;
  triage?: HermesTriageResult;
  interpretation?: unknown;
  conversationalState?: unknown;
  conversationalDelta?: unknown;
  responseObligations?: unknown;
  deterministicReply?: string;
  actionExecuted?: boolean;
};

export type HermesModelContextProjection = {
  payload: Record<string, unknown>;
  history: ModelHistoryMessage[];
  stats: HermesContextBudgetStats;
};

const normalize = (value: unknown) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const customerFieldLabel = (field?: string) => {
  const normalized = normalize(field);
  if (normalized.includes('firstname') || normalized === 'nombre') return 'nombre';
  if (normalized.includes('lastname') || normalized === 'apellido') return 'apellido';
  if (normalized.includes('phone') || normalized.includes('telefono')) return 'numero de contacto';
  if (normalized.includes('email') || normalized.includes('correo')) return 'correo';
  if (normalized.includes('managedentity') || normalized.includes('vehiculo')) return 'vehiculo';
  if (normalized.includes('preferreddate') || normalized.includes('fecha')) return 'fecha';
  if (normalized.includes('slotid') || normalized.includes('horario')) return 'horario';
  if (normalized.includes('catalogoffering') || normalized.includes('servicio')) return 'servicio';
  return field ? 'dato pendiente' : undefined;
};

const processSummaryFrom = (context?: HermesReadOnlyContext, processState?: any) => {
  const awaiting = processState?.awaiting || context?.process?.awaiting;
  const knownFacts = processState?.knownFacts || context?.process?.knownFacts;
  const options = processState?.availableSlots || context?.process?.availableOptions || [];
  const awaitingKey = awaiting?.nextRecommendedField || awaiting?.field || awaiting?.type;
  return pruneEmpty({
    active: context?.process?.active || Boolean(processState?.status),
    status: processState?.status || context?.process?.status,
    awaiting: awaitingKey ? {
      key: awaitingKey,
      customerLabel: customerFieldLabel(awaitingKey),
      type: awaiting?.type,
    } : undefined,
    awaitingType: awaiting?.type,
    knownFields: knownFacts,
    allowedActions: context?.process?.allowedActions,
    slotOptions: options.slice(0, 6).map((slot: any, index: number) => ({
      index: index + 1,
      label: slot.label,
      startAt: slot.startAt,
      endAt: slot.endAt,
    })),
  });
};

const compactBusiness = (context?: HermesReadOnlyContext) => {
  const agent = context?.business?.agent || {};
  return pruneEmpty({
    businessSlug: context?.business?.businessSlug,
    businessName: context?.business?.businessName,
    verticalType: context?.business?.verticalType,
    timezone: context?.business?.timezone || 'America/Lima',
    agent: {
      name: agent.name || 'Iris',
      role: agent.role,
      personality: truncateText(agent.personality || 'calida, breve y orientada a ayudar', 180),
    },
  });
};

const lastQuestion = (context?: HermesReadOnlyContext) => context?.conversation.memory?.lastAssistantQuestion;

const selectHistory = (input: ProjectionInput): ModelHistoryMessage[] => {
  const config = hermesContextBudgetConfig();
  const current = compactWhitespace(input.userMessage);
  const history = (input.context?.conversation.history || [])
    .filter((entry) => entry.role === 'user' || entry.role === 'assistant')
    .map((entry) => ({ role: entry.role, content: compactWhitespace(entry.content) }))
    .filter((entry) => entry.content && entry.content !== current);
  const lastAssistantQuestion = compactWhitespace(lastQuestion(input.context)?.question);
  const selected = history.slice(-config.maxHistoryMessages);
  if (
    lastAssistantQuestion
    && !selected.some((entry) => entry.role === 'assistant' && entry.content === lastAssistantQuestion)
  ) {
    const found = history.find((entry) => entry.role === 'assistant' && entry.content === lastAssistantQuestion);
    if (found) selected.unshift(found);
  }
  return selected.slice(-config.maxHistoryMessages);
};

const factScore = (input: ProjectionInput, fact: any, index: number) => {
  const haystack = normalize([
    input.userMessage,
    input.context?.conversation.memory?.activeTopic,
    input.context?.conversation.memory?.lastAssistantQuestion?.question,
    input.context?.process?.awaiting?.nextRecommendedField,
  ].join(' '));
  const key = normalize(fact.key);
  const value = normalize(fact.value);
  let score = index / 1000;
  if (fact.category === 'correction') score += 100;
  if (/customer|identity|name|firstName|lastName/i.test(String(fact.key))) score += 70;
  if (key.includes('symptom') || value.includes('freno') || value.includes('ruido')) score += 60;
  if (key.includes('preference')) score += 35;
  if (haystack && (haystack.includes(key.split('.')[0]) || value.split(' ').some((word) => word.length > 3 && haystack.includes(word)))) {
    score += 40;
  }
  return score;
};

const selectMemoryFacts = (input: ProjectionInput) => {
  const config = hermesContextBudgetConfig();
  const facts = input.context?.conversation.memory?.salientFacts || [];
  const deduped = new Map<string, any>();
  facts.forEach((fact, index) => deduped.set(fact.key, { ...fact, index }));
  return [...deduped.values()]
    .sort((a, b) => factScore(input, b, b.index) - factScore(input, a, a.index))
    .slice(0, config.maxMemoryFacts)
    .map((fact) => pruneEmpty({
      key: fact.key,
      value: fact.value,
      category: fact.category,
      confidence: fact.confidence,
    }));
};

const offeringScore = (input: ProjectionInput, offering: any, index: number) => {
  const text = normalize(`${input.userMessage} ${input.context?.conversation.memory?.activeTopic || ''}`);
  const name = normalize(`${offering.name || ''} ${offering.description || ''}`);
  let score = index / 1000;
  if (input.triage?.catalogMatch?.offeringId && input.triage.catalogMatch.offeringId === offering.id) score += 100;
  if (text && name.split(/\s+/).some((word: string) => word.length > 3 && text.includes(word))) score += 50;
  if (/freno|suspension/.test(text) && /freno|suspension/.test(name)) score += 60;
  if (/arenado|undercoating/.test(text) && /arenado|undercoating/.test(name)) score += 60;
  return score;
};

const selectCatalog = (input: ProjectionInput) => {
  const config = hermesContextBudgetConfig();
  return (input.context?.catalog || [])
    .map((offering, index) => ({ offering, score: offeringScore(input, offering, index) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, config.maxCatalogOfferings)
    .map(({ offering }) => pruneEmpty({
      id: offering.id,
      name: offering.name,
      durationMinutes: offering.durationMinutes,
      publicSummary: truncateText(offering.description, config.maxOfferingDescriptionChars),
    }));
};

const compactTriage = (triage?: HermesTriageResult) => pruneEmpty({
  intent: triage?.intent,
  mode: triage?.mode,
  workflowAdvanceAllowed: triage?.workflowAdvanceAllowed,
  catalogMatch: triage?.catalogMatch,
  proposals: (triage?.proposals || []).slice(0, 2).map((proposal) => ({
    capability: proposal.capability,
    action: proposal.arguments?.action,
    reasonCode: proposal.reasonCode,
  })),
});

const compactConversationalState = (state: any) => {
  if (!state || typeof state !== 'object') return undefined;
  return pruneEmpty({
    currentTopic: state.currentTopic,
    userGoal: state.userGoal,
    knownFacts: Array.isArray(state.knownFacts)
      ? state.knownFacts.slice(0, 8).map((fact: any) => ({
        key: fact.key,
        value: fact.value,
        confidence: fact.confidence,
      }))
      : undefined,
    corrections: Array.isArray(state.corrections)
      ? state.corrections.slice(-4).map((correction: any) => ({
        replaces: correction.replaces,
        correctedValue: correction.correctedValue,
      }))
      : undefined,
    questionsAlreadyAnswered: Array.isArray(state.questionsAlreadyAnswered)
      ? state.questionsAlreadyAnswered.slice(-4)
      : undefined,
    unresolvedQuestions: Array.isArray(state.unresolvedQuestions)
      ? state.unresolvedQuestions.slice(-4)
      : undefined,
  });
};

const irisTurnBriefFrom = (input: ProjectionInput, memoryFacts: unknown[]) => {
  const business = compactBusiness(input.context);
  const process = processSummaryFrom(input.context, input.processState);
  const state: any = input.conversationalState || {};
  const delta: any = input.conversationalDelta || {};
  return pruneEmpty({
    userMessage: compactWhitespace(input.userMessage),
    identity: {
      publicName: (business as any)?.agent?.name || 'Iris',
      businessName: (business as any)?.businessName,
      tone: ['natural', 'amable', 'profesional', 'clara', 'resolutiva'],
      visibleRole: (business as any)?.agent?.role || 'ejecutiva de atencion',
    },
    arbitration: {
      lane: input.triage?.intent,
      recommendedDecision: input.triage?.mode,
    },
    conversation: {
      activeTopic: input.context?.conversation.memory?.activeTopic || state.currentTopic,
      newFacts: delta.newFacts,
      correctedFacts: delta.correctedFacts,
      knownFacts: memoryFacts,
      alreadyAnsweredQuestions: state.questionsAlreadyAnswered,
      unresolvedQuestions: state.unresolvedQuestions,
    },
    process,
    authoritativeFacts: {
      catalog: selectCatalog(input),
      processKnownFields: (process as any)?.knownFields,
      slotOptions: (process as any)?.slotOptions,
    },
    obligations: input.responseObligations,
    forbiddenClaims: [
      'diagnosticar una causa sin evaluacion',
      'inventar precio, duracion, disponibilidad o reserva',
      'repetir una pregunta ya respondida',
      'mencionar Hermes, Temporal, workflow, payload, API o claves internas',
      'ejecutar acciones no autorizadas',
    ],
  });
};

const rawPayloadFrom = (input: ProjectionInput) => ({
  business: input.context?.business,
  memory: input.context?.conversation.memory,
  catalog: input.context?.catalog,
  process: input.processState || input.context?.process,
  triage: input.triage,
  history: input.context?.conversation.history,
});

export const projectHermesInterpretationContext = (input: ProjectionInput): HermesModelContextProjection => {
  const history = selectHistory(input);
  const memoryFacts = selectMemoryFacts(input);
  const catalog = selectCatalog(input);
  const payload = pruneEmpty({
    language: 'es',
    business: compactBusiness(input.context),
    memory: {
      summary: truncateText(input.context?.conversation.memory?.summary, 700),
      activeTopic: input.context?.conversation.memory?.activeTopic,
      lastAssistantQuestion: lastQuestion(input.context),
      facts: memoryFacts,
    },
    process: processSummaryFrom(input.context, input.processState),
    allowed: compactTriage(input.triage),
    catalog,
  }) || {};
  return {
    payload,
    history,
    stats: buildBudgetStats({
      rawPayload: rawPayloadFrom(input),
      finalPayload: { ...payload, history },
      historyMessagesIncluded: history.length,
      historyMessagesDropped: Math.max(0, (input.context?.conversation.history || []).length - history.length),
      memoryFactsIncluded: memoryFacts.length,
      memoryFactsDropped: Math.max(0, (input.context?.conversation.memory?.salientFacts || []).length - memoryFacts.length),
      catalogOfferingsIncluded: catalog.length,
      catalogOfferingsDropped: Math.max(0, (input.context?.catalog || []).length - catalog.length),
    }),
  };
};

export const projectHermesCompositionContext = (input: ProjectionInput): HermesModelContextProjection => {
  const history = selectHistory(input).slice(-4);
  const memoryFacts = selectMemoryFacts(input).slice(0, Math.min(4, hermesContextBudgetConfig().maxMemoryFacts));
  const irisTurnBrief = irisTurnBriefFrom(input, memoryFacts);
  const payload = pruneEmpty({
    language: 'es',
    irisTurnBrief,
    business: compactBusiness(input.context),
    memory: {
      activeTopic: input.context?.conversation.memory?.activeTopic,
      lastAssistantQuestion: lastQuestion(input.context),
      facts: memoryFacts,
    },
    process: processSummaryFrom(input.context, input.processState),
    interpretation: input.interpretation,
    conversationalState: compactConversationalState(input.conversationalState),
    conversationalDelta: input.conversationalDelta,
    responseObligations: input.responseObligations,
    result: {
      deterministicReply: input.deterministicReply,
      actionExecuted: input.actionExecuted,
    },
  }) || {};
  return {
    payload,
    history,
    stats: buildBudgetStats({
      rawPayload: rawPayloadFrom(input),
      finalPayload: { ...payload, history },
      historyMessagesIncluded: history.length,
      historyMessagesDropped: Math.max(0, (input.context?.conversation.history || []).length - history.length),
      memoryFactsIncluded: memoryFacts.length,
      memoryFactsDropped: Math.max(0, (input.context?.conversation.memory?.salientFacts || []).length - memoryFacts.length),
      catalogOfferingsIncluded: 0,
      catalogOfferingsDropped: input.context?.catalog?.length || 0,
    }),
  };
};

export const compactProjectionJson = (projection: HermesModelContextProjection) => compactJson(projection.payload);
