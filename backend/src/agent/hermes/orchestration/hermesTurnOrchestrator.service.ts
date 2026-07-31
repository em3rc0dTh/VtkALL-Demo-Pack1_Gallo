import { runAgentRuntime } from '../../runtime/agentRuntime';
import { dispatchHermesShadowSafely } from '../services/hermesShadow.service';
import { buildHermesReadOnlyContext } from '../context/hermesContextBuilder.service';
import { runHermesQaPrimaryTurn } from '../routing/hermesQaPrimary.service';
import { buildHermesDispatchPlan, observeHermesReceptionDeskTurn, assessHermesTurn } from './hermesReceptionDesk.service';
import { dispatchHermesSkillPlan } from './hermesSkillDispatch.service';
import { runHermesResponseCandidateSynthesis } from './hermesResponseSynthesizer.service';
import {
  resolveHermesVisibleRuntime,
  type HermesVisibleArbitrationLane,
  type HermesVisibleRoute,
} from './hermesVisibleRuntime.service';
import { buildHermesTriageResult } from './hermesTriage.service';
import { persistHermesTriageResult } from './hermesTriagePersistence.service';
import { dispatchHermesSubAgent } from './hermesAgentDispatcher';
import {
  composeHermesReply,
  interpretHermesTurn,
  modelProposalsFromUnderstanding,
} from './hermesConversationalTurn.service';
import { recordHermesCompositionTurnMetric } from '../model/hermesCompositionMetrics.service';
import { applyConversationMemoryPatch } from '../memory/hermesConversationMemory.service';
import { observeHermesSchedulingDryRun } from '../scheduling/hermesSchedulingObservation.service';
import { runHermesSchedulingBridgeTurn } from '../scheduling/hermesSchedulingBridge.service';
import { agentCapabilityGateway } from '../../capabilities/agentCapabilityGateway';
import {
  recoverIdentityForConversation,
  resolveLinkedIdentityForConversation,
} from '../../../services/hermesIdentityRecovery.service';
import {
  findConversationMessageByMessageId,
  linkConversationToCase,
  linkConversationToCustomer,
  recordAgentConversationMessage,
  recordInboundMessage,
  recordShadowAgentMessage,
  recordVisibleAgentMessage,
  recordVisibleHermesAgentMessage,
  resolveActiveWorkflowForConversation,
  resolveConversationIdForWorkflow,
} from '../../../services/agentConversation.service';
import { getWorkflowState } from '../../../services/agentSim.service';
import { HermesSubAgentInput } from '../contracts/hermesSubAgent.contract';
import { HermesTriageResult } from '../contracts/hermesTriage.contract';

type OrchestratorInput = {
  route: HermesVisibleRoute;
  businessSlug?: string;
  conversationId?: string;
  workflowId?: string;
  userMessage: string;
  attachmentIds?: string[];
  messageId?: string;
  correlationId: string;
  channel?: string;
};

type HermesTurnPlan = {
  route: 'hermes_qa' | 'hermes_process' | 'legacy' | 'safe_response';
  primarySkill: string;
  supportingSkills: string[];
  facts: Record<string, unknown>;
  sideQuestion?: {
    detected: boolean;
    topic?: string;
  };
  operationalActions: string[];
  process: {
    active: boolean;
    status?: string;
    awaiting?: string;
  };
  requiresAuthoritativeResult: boolean;
};

type HermesTurnOrchestratorDeps = {
  runAgentRuntime: typeof runAgentRuntime;
  dispatchHermesShadowSafely: typeof dispatchHermesShadowSafely;
  buildHermesReadOnlyContext: typeof buildHermesReadOnlyContext;
  runHermesQaPrimaryTurn: typeof runHermesQaPrimaryTurn;
  observeHermesReceptionDeskTurn: typeof observeHermesReceptionDeskTurn;
  dispatchHermesSkillPlan: typeof dispatchHermesSkillPlan;
  runHermesResponseCandidateSynthesis: typeof runHermesResponseCandidateSynthesis;
  persistHermesTriageResult: typeof persistHermesTriageResult;
  dispatchHermesSubAgent: typeof dispatchHermesSubAgent;
  composeHermesReply: typeof composeHermesReply;
  interpretHermesTurn: typeof interpretHermesTurn;
  modelProposalsFromUnderstanding: typeof modelProposalsFromUnderstanding;
  recordHermesCompositionTurnMetric: typeof recordHermesCompositionTurnMetric;
  applyConversationMemoryPatch: typeof applyConversationMemoryPatch;
  observeHermesSchedulingDryRun: typeof observeHermesSchedulingDryRun;
  runHermesSchedulingBridgeTurn: typeof runHermesSchedulingBridgeTurn;
  findConversationMessageByMessageId: typeof findConversationMessageByMessageId;
  linkConversationToCase: typeof linkConversationToCase;
  linkConversationToCustomer: typeof linkConversationToCustomer;
  recordAgentConversationMessage: typeof recordAgentConversationMessage;
  recordInboundMessage: typeof recordInboundMessage;
  recordShadowAgentMessage: typeof recordShadowAgentMessage;
  recordVisibleAgentMessage: typeof recordVisibleAgentMessage;
  recordVisibleHermesAgentMessage: typeof recordVisibleHermesAgentMessage;
  resolveActiveWorkflowForConversation: typeof resolveActiveWorkflowForConversation;
  resolveConversationIdForWorkflow: typeof resolveConversationIdForWorkflow;
  getWorkflowState: typeof getWorkflowState;
};

const defaultHermesTurnOrchestratorDeps: HermesTurnOrchestratorDeps = {
  runAgentRuntime,
  dispatchHermesShadowSafely,
  buildHermesReadOnlyContext,
  runHermesQaPrimaryTurn,
  observeHermesReceptionDeskTurn,
  dispatchHermesSkillPlan,
  runHermesResponseCandidateSynthesis,
  persistHermesTriageResult,
  dispatchHermesSubAgent,
  composeHermesReply,
  interpretHermesTurn,
  modelProposalsFromUnderstanding,
  recordHermesCompositionTurnMetric,
  applyConversationMemoryPatch,
  observeHermesSchedulingDryRun,
  runHermesSchedulingBridgeTurn,
  findConversationMessageByMessageId,
  linkConversationToCase,
  linkConversationToCustomer,
  recordAgentConversationMessage,
  recordInboundMessage,
  recordShadowAgentMessage,
  recordVisibleAgentMessage,
  recordVisibleHermesAgentMessage,
  resolveActiveWorkflowForConversation,
  resolveConversationIdForWorkflow,
  getWorkflowState,
};

const hermesTurnOrchestratorDeps: HermesTurnOrchestratorDeps = { ...defaultHermesTurnOrchestratorDeps };

export const installHermesTurnOrchestratorTestOverrides = (overrides: Partial<HermesTurnOrchestratorDeps>) => {
  const previous = { ...hermesTurnOrchestratorDeps };
  Object.assign(hermesTurnOrchestratorDeps, overrides);
  return () => {
    Object.assign(hermesTurnOrchestratorDeps, previous);
  };
};

const stateWithWorkflowId = (state: any, workflowId?: string) => state
  ? { ...state, ...(workflowId ? { workflowId } : {}) }
  : state;

const mergeAuthoritativeState = (processContext: any, fallbackState?: any) => {
  const rawState = processContext?.rawState || fallbackState;
  if (!rawState) return rawState;
  return {
    ...rawState,
    ...(processContext?.availableOptions?.length ? { availableOptions: processContext.availableOptions } : {}),
    ...(processContext?.awaiting ? {
      awaiting: {
        ...(rawState.awaiting || {}),
        ...processContext.awaiting,
      },
    } : {}),
  };
};

const promptForAuthoritativeAwaiting = (processContext?: any, state?: any) => {
  const awaiting = processContext?.awaiting || state?.awaiting || {};
  const nextField = String(awaiting?.nextRecommendedField || awaiting?.field || '').trim();
  const awaitingType = String(awaiting?.type || '').trim();
  const field = nextField || awaitingType;
  const availableOptions = Array.isArray(processContext?.availableOptions)
    ? processContext.availableOptions
    : Array.isArray(state?.availableOptions)
      ? state.availableOptions
      : [];

  if (field === 'firstName') return 'A nombre de quien registro la evaluacion?';
  if (field === 'lastName') return 'Cual es tu apellido?';
  if (field === 'phone') return 'Que numero de contacto usamos para coordinar la cita?';
  if (field === 'managedEntity') return 'Que vehiculo revisamos? Con marca y modelo me basta.';
  if (field === 'preferredDate' || field === 'date_preference') return 'Que dia te acomoda para revisar disponibilidad?';
  if (field === 'slotId' || field === 'slot_selection') return 'Que horario te acomoda?';
  if (awaitingType === 'service_selection') {
    const names = availableOptions
      .map((option: any) => String(option?.name || option?.title || option?.label || '').trim())
      .filter(Boolean)
      .slice(0, 3);
    return names.length
      ? `Tengo estas opciones disponibles: ${names.join(', ')}. Cual te interesa?`
      : 'Que servicio necesitas revisar?';
  }
  if (awaitingType && awaitingType !== 'none') return 'Que dato usamos para continuar?';
  return '';
};

const formatDateTimeRange = (startAt?: string, endAt?: string, timezone = 'America/Lima') => {
  const start = new Date(String(startAt || ''));
  const end = new Date(String(endAt || ''));
  if (Number.isNaN(start.getTime())) return undefined;
  const dateLabel = new Intl.DateTimeFormat('es-PE', {
    timeZone: timezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(start);
  const startLabel = new Intl.DateTimeFormat('es-PE', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
  }).format(start);
  const endLabel = Number.isNaN(end.getTime())
    ? undefined
    : new Intl.DateTimeFormat('es-PE', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
    }).format(end);
  return `${dateLabel}, de ${startLabel}${endLabel ? ` a ${endLabel}` : ''}`;
};

const appointmentConfirmationFromState = (state?: any) => {
  if (String(state?.status || '') !== 'APPOINTMENT_BOOKED') return undefined;
  const range = formatDateTimeRange(
    state?.reservationStartAt || state?.appointment?.reservation?.startAt || state?.appointment?.slot?.startAt,
    state?.reservationEndAt || state?.appointment?.reservation?.endAt || state?.appointment?.slot?.endAt,
    'America/Lima'
  );
  const offeringName = String(state?.selectedOffering?.name || '').trim();
  const service = offeringName ? ` para ${offeringName}` : '';
  return range
    ? `Perfecto. Tu evaluacion${service} quedo reservada para el ${range}.`
    : `Perfecto. Tu evaluacion${service} quedo reservada.`;
};

const confirmationFromLastCommittedAction = (toolResults: Array<{ arguments?: Record<string, unknown> }> = [], state?: any) => {
  const last = [...toolResults].reverse().find((entry: any) => entry?.result && entry.result?.skipped !== true);
  const action = String(last?.arguments?.action || '').trim();
  const data: any = last?.arguments?.data || {};
  if (action === 'submit_customer_information') {
    if (data.phone) return `Gracias, ya registre el numero ${String(data.phone).trim()}.`;
    if (data.managedEntityDisplayName) return `Perfecto, registre ${String(data.managedEntityDisplayName).trim()}.`;
    if (data.lastName) return `Gracias, ya registre tu apellido ${String(data.lastName).trim()}.`;
    if (data.firstName) return `Gracias, ${String(data.firstName).trim()}.`;
  }
  if (action === 'submit_date_preference') {
    const date = String(data.preferredDate || data.requestedDate || '').trim();
    return date ? `Perfecto, registre tu preferencia para ${date}.` : 'Perfecto, registre tu preferencia de fecha.';
  }
  if (action === 'submit_offering_selection') {
    const offeringName = String(state?.selectedOffering?.name || '').trim();
    return offeringName ? `Servicio seleccionado: ${offeringName}.` : 'Servicio seleccionado.';
  }
  return undefined;
};

const committedActionFallbackMessage = (input: {
  lane?: HermesVisibleArbitrationLane;
  committed: boolean;
  processContext?: any;
  state?: any;
  toolResults?: Array<{ arguments?: Record<string, unknown> }>;
}) => {
  if (!input.committed) return undefined;
  const booked = appointmentConfirmationFromState(input.state || input.processContext?.rawState);
  if (booked) return booked;
  const prompt = promptForAuthoritativeAwaiting(input.processContext, input.state);
  const confirmation = confirmationFromLastCommittedAction(input.toolResults, input.state || input.processContext?.rawState);
  if (confirmation) return [confirmation, prompt].filter(Boolean).join(' ');
  if (input.lane === 'active_process_data') {
    return ['Gracias. Tomo ese dato y continuamos con la reserva.', prompt].filter(Boolean).join(' ');
  }
  if (input.lane === 'active_process_side_question') {
    return ['Te respondo y conservamos el dato pendiente para continuar.', prompt].filter(Boolean).join(' ');
  }
  if (input.lane === 'identity_recovery') {
    return ['Estoy revisando tus datos para continuar desde donde quedamos.', prompt].filter(Boolean).join(' ');
  }
  if (input.lane === 'action_or_booking') {
    return ['Entiendo. Inicie la coordinacion para revisar lo que comentas.', prompt].filter(Boolean).join(' ');
  }
  return prompt || 'Seguimos con la solicitud desde el estado confirmado.';
};

const agentClientPayload = (input: {
  conversationId: string;
  workflowId?: string;
  provider?: string;
  model?: string;
  message: string;
  state?: any;
}) => ({
  conversationId: input.conversationId,
  workflowId: input.workflowId,
  provider: input.provider,
  model: input.model,
  message: input.message,
  state: stateWithWorkflowId(input.state, input.workflowId),
});

const controlledVisibleRuntimeEnabled = () => process.env.HERMES_VISIBLE_RUNTIME_ENABLED === 'true';
const controlledVisibleMessageId = (messageId?: string) => (messageId ? `${messageId}:visible-runtime` : undefined);
const controlledInboundMessageId = (messageId?: string) => (messageId ? `${messageId}:inbound` : undefined);

const idsFromState = (state: any) => ({
  caseId: state?.appointment?.case?._id || state?.appointment?.appointment?.caseId || state?.appointment?.reservation?.caseId,
  customerId: state?.appointment?.customer?._id || state?.appointment?.appointment?.customerId || state?.appointment?.reservation?.customerId,
  managedEntityId: state?.appointment?.managedEntity?._id || state?.appointment?.appointment?.managedEntityId,
});

const normalizeIdentityText = (value: string) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const nameFrom = (message: string) =>
  String(message || '').match(/\b(?:soy|me llamo|mi nombre es)\s+([A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2,}(?:\s+[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2,}){0,2})/i)?.[1]?.trim();

const hasContinuityRecoveryIntent = (message: string) => {
  const normalized = normalizeIdentityText(message);
  return /\b(conversacion previa|conversacion anterior|sesion previa|sesion anterior|historial|me atendieron|ya me atendieron|mi caso|mi reserva anterior|continuar|retomar|seguimiento)\b/i.test(normalized)
    || /\b(?:mi\s+)?(?:numero|n[uú]mero|telefono|tel[eé]fono|celular|dni|documento|placa)\b|(?:\+?\d[\d\s().-]{6,}\d)|\b(?:soy|me llamo|mi nombre es)\s+[a-z[áéíóúñ]{2,}/i.test(normalized);
};

const fallbackMemoryPatchFromTurn = (input: {
  message: string;
  messageId?: string;
  currentSummary?: string;
}) => {
  const message = String(input.message || '').trim();
  const messageId = input.messageId || `memory_${Date.now()}`;
  const normalized = normalizeIdentityText(message);
  const upsertFacts: Array<any> = [];
  const name = nameFrom(message);
  if (name) {
    upsertFacts.push({
      key: 'customer.firstName',
      value: name.split(/\s+/)[0],
      category: 'alias',
      confidence: 'medium',
      sourceMessageId: messageId,
    });
  }
  if (/\b(freno|frenos|suena|suenan|sonando|ruido|frenar|fuerte)\b/.test(normalized)) {
    upsertFacts.push({
      key: 'symptom.brakes.noise',
      value: message,
      category: 'symptom',
      confidence: 'medium',
      sourceMessageId: messageId,
    });
  }
  if (/\b(fuerte|frenar fuerte|freno fuerte)\b/.test(normalized)) {
    upsertFacts.push({
      key: 'symptom.brakes.trigger',
      value: 'principalmente al frenar fuerte',
      category: 'symptom',
      confidence: 'medium',
      sourceMessageId: messageId,
    });
  }
  if (/\b(manana|hoy|lunes|martes|miercoles|jueves|viernes|sabado|domingo)\b/.test(normalized)) {
    upsertFacts.push({
      key: 'preference.date.text',
      value: message,
      category: 'preference',
      confidence: 'low',
      sourceMessageId: messageId,
    });
  }
  const activeTopic = upsertFacts.some((fact) => String(fact.key).startsWith('symptom.brakes'))
    ? 'problema de frenos'
    : undefined;
  const summaryParts = [
    input.currentSummary,
    name ? `El cliente se presento como ${name}.` : undefined,
    activeTopic ? `Se esta conversando sobre un ruido en frenos.` : undefined,
  ].filter(Boolean);
  return {
    ...(summaryParts.length ? { summary: Array.from(new Set(summaryParts)).join(' ').slice(0, 1000) } : {}),
    ...(activeTopic ? { activeTopic } : {}),
    ...(upsertFacts.length ? { upsertFacts } : {}),
  };
};

const customerDataFromMemory = (context?: { conversation?: { memory?: any } }) => {
  const facts = context?.conversation?.memory?.salientFacts || [];
  const firstName = facts.find((fact: any) => fact.key === 'customer.firstName')?.value;
  return firstName ? { firstName: String(firstName) } : undefined;
};

const mergeMemoryPatches = (...patches: Array<any | undefined>) => {
  const merged: any = {};
  for (const patch of patches) {
    if (!patch || typeof patch !== 'object') continue;
    if (patch.summary !== undefined) merged.summary = patch.summary;
    if (patch.activeTopic !== undefined) merged.activeTopic = patch.activeTopic;
    if (patch.lastAssistantQuestion !== undefined) merged.lastAssistantQuestion = patch.lastAssistantQuestion;
    if (Array.isArray(patch.removeFactKeys)) {
      merged.removeFactKeys = [...(merged.removeFactKeys || []), ...patch.removeFactKeys];
    }
    if (Array.isArray(patch.upsertFacts)) {
      const byKey = new Map<string, any>();
      for (const fact of merged.upsertFacts || []) byKey.set(String(fact.key), fact);
      for (const fact of patch.upsertFacts) byKey.set(String(fact.key), fact);
      merged.upsertFacts = [...byKey.values()];
    }
    if (Array.isArray(patch.unresolvedQuestions)) merged.unresolvedQuestions = patch.unresolvedQuestions;
  }
  return Object.keys(merged).length ? merged : undefined;
};

const dispatchAndPersistHermesShadow = async (input: {
  businessSlug: string;
  conversationId: string;
  workflowId?: string;
  state?: any;
  userMessage: string;
  legacyReply: string;
  correlationId: string;
  channel?: string;
}) => {
  let history: Array<{ role: 'user' | 'assistant'; content: string }> = [{ role: 'user', content: input.userMessage }];
  let readOnlyContext;
  if (process.env.HERMES_CONTEXT_ENABLED === 'true') {
    const ids = idsFromState(input.state);
    const built = await hermesTurnOrchestratorDeps.buildHermesReadOnlyContext({
      businessSlug: input.businessSlug,
      conversationId: input.conversationId,
      channel: input.channel || 'web_agent',
      processState: input.state,
      ...ids,
    });
    history = built.history.length ? built.history : history;
    readOnlyContext = built.context;
  }

  const shadow = await hermesTurnOrchestratorDeps.dispatchHermesShadowSafely({
    businessSlug: input.businessSlug,
    conversationId: input.conversationId,
    userMessage: input.userMessage,
    legacyReply: input.legacyReply,
    history,
    readOnlyContext,
    channel: input.channel || 'web_agent',
    correlationId: input.correlationId,
  });

  if (process.env.HERMES_PERSIST_SHADOW === 'true' && (shadow.hermesReply || shadow.status !== 'skipped')) {
    await hermesTurnOrchestratorDeps.recordShadowAgentMessage({
      workflowId: input.workflowId || input.conversationId,
      businessSlug: input.businessSlug,
      conversationId: input.conversationId,
      body: shadow.hermesReply || `Hermes shadow ${shadow.status}`,
      state: input.state,
      correlationId: shadow.correlationId,
      metadata: {
        runtimeMode: 'shadow',
        shadowStatus: shadow.status,
        evaluation: shadow.evaluation,
        timing: shadow.timing,
      },
    });
  }

  return shadow;
};

const observeHermesReceptionDeskSafely = async (input: Parameters<typeof observeHermesReceptionDeskTurn>[0]) => {
  try {
    return await hermesTurnOrchestratorDeps.observeHermesReceptionDeskTurn(input);
  } catch (error) {
    console.warn('[hermes-reception-desk] observation skipped:', error);
    return undefined;
  }
};

const dispatchHermesSkillSafely = async (observed?: Awaited<ReturnType<typeof observeHermesReceptionDeskTurn>>) => {
  if (!observed) return undefined;
  try {
    return await hermesTurnOrchestratorDeps.dispatchHermesSkillPlan(observed.plan);
  } catch (error) {
    console.warn('[hermes-skill-dispatch] observation skipped:', error);
    return undefined;
  }
};

const synthesizeHermesCandidateSafely = async (input: {
  observed?: Awaited<ReturnType<typeof observeHermesReceptionDeskTurn>>;
  dispatched?: Awaited<ReturnType<typeof dispatchHermesSkillPlan>>;
  userMessage: string;
}) => {
  if (!input.observed) return undefined;
  try {
    return await hermesTurnOrchestratorDeps.runHermesResponseCandidateSynthesis({
      turnId: input.observed.plan.turnId,
      conversationId: input.observed.plan.conversationId,
      correlationId: input.observed.plan.correlationId,
      businessSlug: input.observed.plan.businessSlug,
      agentPersona: input.observed.context.business?.agent,
      userMessage: input.userMessage,
      turnAssessment: input.observed.assessment,
      dispatchPlan: input.observed.plan,
      skillResult: input.dispatched?.result,
      readOnlyContext: input.observed.context,
      activeProcessSummary: {
        active: input.observed.assessment.activeProcess,
        status: input.observed.assessment.processStatus,
        owner: input.observed.plan.activeProcessOwner,
      },
      knownFacts: {
        ...input.observed.assessment.knownData,
        ...input.observed.plan.skillContext.relevantFacts,
      },
      sideQuestions: input.observed.assessment.secondaryIntents.map((intent) => ({
        type: intent.type,
        summary: intent.summary,
      })),
      language: 'es',
      businessTimezone: input.observed.context.business?.timezone,
      visibilityMode: 'candidate_only',
    });
  } catch (error) {
    console.warn('[hermes-response-candidate] observation skipped:', error);
    return undefined;
  }
};

const uniqueStrings = (values: Array<string | undefined>) =>
  [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))];

const buildHermesTurnPlan = (input: {
  mode: HermesTurnPlan['route'];
  observed?: Awaited<ReturnType<typeof observeHermesReceptionDeskTurn>>;
  runtimeResult?: Awaited<ReturnType<typeof runAgentRuntime>>;
  triage?: HermesTriageResult;
}) : HermesTurnPlan => {
  const observed = input.observed;
  const assessment = observed?.assessment;
  const plan = observed?.plan;
  return {
    route: input.mode,
    primarySkill: plan?.selectedSkill || (input.mode === 'legacy' ? 'recovery-escalation' : 'customer-conversation'),
    supportingSkills: uniqueStrings([
      input.triage?.supportingAgents?.[0],
      input.triage?.supportingAgents?.[1],
      assessment?.secondaryIntents?.[0]?.type === 'duration' ? 'catalog-advisor' : undefined,
      assessment?.activeProcess ? 'scheduling-companion' : undefined,
      assessment?.recommendedDecision === 'ESCALATE' ? 'recovery-escalation' : undefined,
    ]).filter((skill) => skill !== (plan?.selectedSkill || '')).slice(0, 2),
    facts: {
      ...(assessment?.extractedData || {}),
      ...(plan?.skillContext?.relevantFacts || {}),
      ...(assessment?.knownData || {}),
      ...(input.triage?.facts || {}),
    },
    sideQuestion: assessment?.questions?.length
      ? { detected: true, topic: assessment.questions[0]?.type }
      : undefined,
    operationalActions: (input.runtimeResult?.toolResults || [])
      .map((entry) => String(entry?.capability || '').trim())
      .filter(Boolean),
    process: {
      active: Boolean(assessment?.activeProcess || plan?.activeProcessOwner || input.runtimeResult?.state?.status),
      status: String(plan?.skillContext?.processStatus || assessment?.processStatus || input.runtimeResult?.state?.status || '').trim() || undefined,
      awaiting: String(
        input.runtimeResult?.state?.awaiting?.nextRecommendedField
        || input.runtimeResult?.state?.awaiting?.field
        || input.runtimeResult?.state?.awaiting?.type
        || ''
      ).trim() || undefined,
    },
    requiresAuthoritativeResult: Boolean(input.runtimeResult?.toolResults?.length),
  };
};

const buildHermesSubAgentInput = (input: {
  observed?: Awaited<ReturnType<typeof observeHermesReceptionDeskTurn>>;
  triage: HermesTriageResult;
}): HermesSubAgentInput => ({
  triage: input.triage,
  latestMessage: String(input.observed?.assessment.turnText || ''),
  history: input.observed?.history || [],
  knownFacts: input.triage.facts,
  processContext: input.observed?.context.process,
  businessContext: input.observed?.context.business,
  catalogContext: input.observed?.context.catalog,
  customerContext: input.observed?.context.customer,
  caseContext: input.observed?.context.case,
  permissions: {
    readOnly: true,
    canProposeActions: true,
    canExecuteActions: false,
  },
});

const recordHermesTurnPlan = async (input: {
  workflowId?: string;
  businessSlug: string;
  conversationId: string;
  state?: any;
  messageId?: string;
  correlationId: string;
  plan: HermesTurnPlan;
}) => hermesTurnOrchestratorDeps.recordAgentConversationMessage({
  workflowId: input.workflowId || input.conversationId,
  businessSlug: input.businessSlug,
  conversationId: input.conversationId,
  role: 'system',
  visibility: 'internal',
  interactionType: 'system_event',
  body: `Hermes turn plan ${input.plan.route} -> ${input.plan.primarySkill}`,
  messageId: input.messageId ? `${input.messageId}:turn-plan` : undefined,
  correlationId: input.correlationId,
  metadata: {
    runtimeMode: 'turn_orchestrator',
    turnPlan: input.plan,
  },
  state: input.state,
});

const persistControlledVisibleReply = async (input: {
  runtime: 'hermes' | 'legacy';
  workflowId?: string;
  businessSlug: string;
  conversationId: string;
  body: string;
  provider?: string;
  model?: string;
  state?: any;
  messageId?: string;
  correlationId: string;
  metadata: Record<string, unknown>;
}) => {
  if (input.runtime === 'hermes') {
    return hermesTurnOrchestratorDeps.recordVisibleHermesAgentMessage({
      workflowId: input.workflowId || input.conversationId,
      businessSlug: input.businessSlug,
      conversationId: input.conversationId,
      body: input.body,
      provider: input.provider,
      model: input.model,
      state: input.state,
      messageId: input.messageId,
      correlationId: input.correlationId,
      metadata: input.metadata,
    });
  }

  return hermesTurnOrchestratorDeps.recordVisibleAgentMessage({
    workflowId: input.workflowId || input.conversationId,
    businessSlug: input.businessSlug,
    conversationId: input.conversationId,
    body: input.body,
    provider: input.provider,
    model: input.model,
    state: input.state,
    messageId: input.messageId,
    correlationId: input.correlationId,
    metadata: input.metadata,
  });
};

const replayControlledVisibleResponse = async (input: {
  businessSlug: string;
  conversationId: string;
  workflowId?: string;
  visibleMessageId?: string;
}) => {
  if (!input.visibleMessageId) return undefined;
  const existingVisible: any = await hermesTurnOrchestratorDeps.findConversationMessageByMessageId({
    businessSlug: input.businessSlug,
    conversationId: input.conversationId,
    messageId: input.visibleMessageId,
    direction: 'outbound',
  });
  if (!existingVisible) return undefined;
  const workflowId = String(existingVisible.workflowId || input.workflowId || '') || undefined;
  const state = workflowId ? await hermesTurnOrchestratorDeps.getWorkflowState(workflowId).catch(() => undefined) : undefined;
  return agentClientPayload({
    conversationId: input.conversationId,
    workflowId,
    provider: existingVisible.provider,
    model: existingVisible.model,
    message: String(existingVisible.content?.text || existingVisible.body || existingVisible.message || ''),
    state,
  });
};

const recordControlledInbound = async (input: {
  workflowId?: string;
  businessSlug: string;
  conversationId: string;
  body: string;
  state?: any;
  messageId?: string;
  correlationId: string;
  route: HermesVisibleRoute;
}) => hermesTurnOrchestratorDeps.recordInboundMessage({
  workflowId: input.workflowId || input.conversationId,
  businessSlug: input.businessSlug,
  conversationId: input.conversationId,
  body: input.body,
  state: input.state,
  messageId: input.messageId,
  correlationId: input.correlationId,
  metadata: {
    runtimeMode: 'controlled_visible_inbound',
    route: input.route,
  },
});

type HermesAuthorizedProposal = HermesTriageResult['proposals'][number];

const applyActionPolicy = (input: {
  triage: HermesTriageResult;
  workflowId?: string;
}) => (input.triage.proposals || []).filter((proposal) => {
  if (proposal.capability === 'search_catalog' || proposal.capability === 'get_offering_details') return true;
  if (proposal.capability === 'get_current_process_state') return Boolean(input.workflowId);
  if (!input.triage.workflowAdvanceAllowed) return false;
  if (proposal.capability === 'start_schedule_consultation') return true;
  if (proposal.capability !== 'continue_schedule_consultation') return false;
  if (!input.workflowId && proposal.reasonCode !== 'SUBMIT_CUSTOMER_INFORMATION_AFTER_START') return false;
  if (String(proposal.arguments.action || '') === 'submit_offering_selection') {
    return input.triage.catalogMatch.status === 'exact' || input.triage.catalogMatch.status === 'recent_list_reference';
  }
  return true;
}).slice(0, 2);

const executeAuthorizedHermesActions = async (input: {
  businessSlug: string;
  conversationId: string;
  workflowId?: string;
  authorizedActions: HermesAuthorizedProposal[];
}) => {
  const toolResults: Array<{ capability: string; arguments: Record<string, unknown>; result: unknown }> = [];
  let workflowId = input.workflowId;
  let processContext = workflowId ? await agentCapabilityGateway.getProcessContext({ workflowId }).catch(() => undefined) : undefined;

  for (const proposal of input.authorizedActions) {
    let result: unknown;

    if (proposal.capability === 'search_catalog') {
      result = await agentCapabilityGateway.searchCatalog({
        businessSlug: input.businessSlug,
        query: String(proposal.arguments.query || ''),
      });
    } else if (proposal.capability === 'get_offering_details') {
      result = await agentCapabilityGateway.getOfferingDetails({
        businessSlug: input.businessSlug,
        offeringId: proposal.arguments.offeringId ? String(proposal.arguments.offeringId) : undefined,
        query: proposal.arguments.query ? String(proposal.arguments.query) : undefined,
      });
    } else if (proposal.capability === 'start_schedule_consultation') {
      result = await agentCapabilityGateway.startProcess({
        processType: 'schedule_consultation',
        businessSlug: input.businessSlug,
        conversationId: input.conversationId,
        offeringId: proposal.arguments.offeringId ? String(proposal.arguments.offeringId) : undefined,
        customerMessage: proposal.arguments.customerMessage ? String(proposal.arguments.customerMessage) : undefined,
      });
      workflowId = (result as any)?.process?.workflowId || workflowId;
      processContext = result as any;
    } else if (proposal.capability === 'continue_schedule_consultation') {
      if (!processContext && workflowId) {
        processContext = await agentCapabilityGateway.getProcessContext({ workflowId }).catch(() => undefined);
      }

      if (processContext) {
        result = await agentCapabilityGateway.continueProcess({
          process: processContext,
          conversationId: input.conversationId,
          action: String(proposal.arguments.action || ''),
          data: proposal.arguments.data as Record<string, unknown> | undefined,
        });
        workflowId = (result as any)?.process?.workflowId || workflowId;
        processContext = result as any;
      } else {
        result = { skipped: true, reason: 'PROCESS_CONTEXT_REQUIRED' };
      }
    } else if (proposal.capability === 'get_current_process_state') {
      result = workflowId ? await agentCapabilityGateway.getProcessContext({ workflowId }) : { skipped: true, reason: 'WORKFLOW_REQUIRED' };
      processContext = result as any;
    }

    toolResults.push({
      capability: proposal.capability,
      arguments: proposal.arguments,
      result,
    });
  }

  const authoritativeProcess = workflowId
    ? await agentCapabilityGateway.getProcessContext({ workflowId }).catch(() => processContext)
    : processContext;

  return {
    workflowId,
    authoritativeProcess,
    toolResults,
  };
};

const handleControlledVisibleTurn = async (input: {
  route: HermesVisibleRoute;
  businessSlug: string;
  conversationId: string;
  userMessage: string;
  workflowId?: string;
  initialState?: any;
  messageId?: string;
  correlationId: string;
  channel?: string;
}) => {
  const turnStartedAt = Date.now();
  const telemetry: Record<string, unknown> = {
    fallbackUsed: false,
  };
  const replay = await replayControlledVisibleResponse({
    businessSlug: input.businessSlug,
    conversationId: input.conversationId,
    workflowId: input.workflowId,
    visibleMessageId: controlledVisibleMessageId(input.messageId),
  });
  if (replay) return replay;

  await recordControlledInbound({
    workflowId: input.workflowId,
    businessSlug: input.businessSlug,
    conversationId: input.conversationId,
    body: input.userMessage,
    state: input.initialState,
    messageId: controlledInboundMessageId(input.messageId),
    correlationId: input.correlationId,
    route: input.route,
  });

  const shouldRecoverIdentity = !input.initialState?.status && hasContinuityRecoveryIntent(input.userMessage);
  const recoveredIdentity = shouldRecoverIdentity
    ? await recoverIdentityForConversation({
      businessSlug: input.businessSlug,
      conversationId: input.conversationId,
      message: input.userMessage,
    }).catch((error) => {
      console.warn('[hermes-identity-recovery] skipped:', error);
      return undefined;
    })
    : undefined;
  const linkedIdentity = shouldRecoverIdentity && !recoveredIdentity?.customerId
    ? await resolveLinkedIdentityForConversation({
      businessSlug: input.businessSlug,
      conversationId: input.conversationId,
    }).catch((error) => {
      console.warn('[hermes-linked-identity] skipped:', error);
      return undefined;
    })
    : undefined;
  const effectiveIdentity = recoveredIdentity?.customerId ? recoveredIdentity : linkedIdentity;
  const contextualIds = {
    ...idsFromState(input.initialState),
    ...(effectiveIdentity?.customerId ? { customerId: effectiveIdentity.customerId } : {}),
    ...(effectiveIdentity?.managedEntityId ? { managedEntityId: effectiveIdentity.managedEntityId } : {}),
    ...(effectiveIdentity?.caseId ? { caseId: effectiveIdentity.caseId } : {}),
  };

  const contextStartedAt = Date.now();
  const receptionDeskObserved = await observeHermesReceptionDeskSafely({
    businessSlug: input.businessSlug,
    conversationId: input.conversationId,
    workflowId: input.workflowId,
    message: input.userMessage,
    messageId: input.messageId,
    correlationId: input.correlationId,
    processState: input.initialState,
    ...contextualIds,
  });
  telemetry.contextBuildMs = Date.now() - contextStartedAt;
  telemetry.memoryVersion = receptionDeskObserved?.context.conversation.memory?.version;
  telemetry.historyMessageCount = receptionDeskObserved?.context.conversation.history.length || 0;
  const dispatched = await dispatchHermesSkillSafely(receptionDeskObserved);
  const triage = receptionDeskObserved
    ? buildHermesTriageResult({
      assessment: receptionDeskObserved.assessment,
      plan: receptionDeskObserved.plan,
      context: receptionDeskObserved.context,
      skillResult: dispatched?.result,
      runtimeResult: {
        state: input.initialState,
        toolResults: [],
      },
    })
    : undefined;
  if (triage) {
    await hermesTurnOrchestratorDeps.persistHermesTriageResult({
      workflowId: input.workflowId,
      businessSlug: input.businessSlug,
      conversationId: input.conversationId,
      correlationId: input.correlationId,
      messageId: input.messageId,
      triage,
      state: input.initialState,
    });
    await hermesTurnOrchestratorDeps.dispatchHermesSubAgent({
      workflowId: input.workflowId,
      businessSlug: input.businessSlug,
      conversationId: input.conversationId,
      correlationId: input.correlationId,
      messageId: input.messageId,
      subAgentInput: buildHermesSubAgentInput({
        observed: receptionDeskObserved,
        triage,
      }),
      specialistResult: dispatched?.result,
      state: input.initialState,
    });
  }

  const interpretationStartedAt = Date.now();
  const conversationalUnderstanding = await hermesTurnOrchestratorDeps.interpretHermesTurn({
    userMessage: input.userMessage,
    context: receptionDeskObserved?.context,
    processState: input.initialState,
    triage,
    conversationId: input.conversationId,
    correlationId: input.correlationId,
    messageId: input.messageId,
  }).catch((error) => {
    console.warn('[hermes-conversational-turn] interpretation skipped:', error);
    return undefined;
  });
  telemetry.interpretationModelMs = Date.now() - interpretationStartedAt;
  telemetry.provider = conversationalUnderstanding?.provider;
  telemetry.model = conversationalUnderstanding?.model;
  const modelProposals = hermesTurnOrchestratorDeps.modelProposalsFromUnderstanding({
    understanding: conversationalUnderstanding,
    context: receptionDeskObserved?.context,
    workflowId: input.workflowId,
  });
  const policyStartedAt = Date.now();
  const authorizedActions = [
    ...(triage ? applyActionPolicy({ triage, workflowId: input.workflowId }) : []),
    ...modelProposals,
  ].slice(0, 3);
  telemetry.policyMs = Date.now() - policyStartedAt;
  if (
    !input.workflowId
    && effectiveIdentity?.recoveredCustomerData
    && authorizedActions.some((proposal) => proposal.capability === 'start_schedule_consultation')
    && !authorizedActions.some((proposal) =>
      proposal.capability === 'continue_schedule_consultation'
      && String(proposal.arguments.action || '') === 'submit_customer_information'
    )
  ) {
    authorizedActions.push({
      capability: 'continue_schedule_consultation',
      arguments: {
        action: 'submit_customer_information',
        data: effectiveIdentity.recoveredCustomerData,
      },
      reasonCode: 'SUBMIT_RECOVERED_CUSTOMER_INFORMATION_AFTER_START',
    });
  }
  const memoryCustomerData = customerDataFromMemory(receptionDeskObserved?.context);
  if (
    !input.workflowId
    && memoryCustomerData
    && authorizedActions.some((proposal) => proposal.capability === 'start_schedule_consultation')
    && !authorizedActions.some((proposal) =>
      proposal.capability === 'continue_schedule_consultation'
      && String(proposal.arguments.action || '') === 'submit_customer_information'
    )
  ) {
    authorizedActions.push({
      capability: 'continue_schedule_consultation',
      arguments: {
        action: 'submit_customer_information',
        data: memoryCustomerData,
      },
      reasonCode: 'SUBMIT_MEMORY_CUSTOMER_INFORMATION_AFTER_START',
    });
  }
  const executionStartedAt = Date.now();
  const executed = await executeAuthorizedHermesActions({
    businessSlug: input.businessSlug,
    conversationId: input.conversationId,
    workflowId: input.workflowId,
    authorizedActions,
  });
  telemetry.executionMs = Date.now() - executionStartedAt;

  const authoritativeState = mergeAuthoritativeState(executed.authoritativeProcess as any, input.initialState);
  const authoritativeWorkflowId = executed.workflowId || input.workflowId;

  await hermesTurnOrchestratorDeps.observeHermesSchedulingDryRun({
    businessSlug: input.businessSlug,
    conversationId: input.conversationId,
    workflowId: authoritativeWorkflowId,
    message: input.userMessage,
    messageId: input.messageId,
    correlationId: input.correlationId,
    processState: authoritativeState,
    ...idsFromState(authoritativeState),
  });

  const finalContextStartedAt = Date.now();
  const finalContext = await hermesTurnOrchestratorDeps.buildHermesReadOnlyContext({
    businessSlug: input.businessSlug,
    conversationId: input.conversationId,
    channel: input.channel || 'web_agent',
    processState: authoritativeState,
    ...idsFromState(authoritativeState),
    ...contextualIds,
  }).catch(() => undefined);
  telemetry.contextRebuildMs = Date.now() - finalContextStartedAt;

  const visibleSkillResult = executed.toolResults.some((entry) =>
    entry.capability === 'start_schedule_consultation' || entry.capability === 'continue_schedule_consultation'
  )
    ? {
      ...(dispatched?.result || {
        invocationId: `${input.messageId || input.correlationId}:visible-skill-result`,
        skillId: receptionDeskObserved?.plan.selectedSkill || 'customer-conversation',
        skillVersion: 'controlled-visible',
        ownerRetainedByHermes: true as const,
        actionExecutionAllowed: false as const,
        summary: 'Hermes executed authorized actions and refreshed authoritative state.',
        fallbackUsed: false,
        durationMs: 0,
        producedAt: new Date().toISOString(),
      }),
      status: executed.authoritativeProcess?.awaiting?.type && executed.authoritativeProcess.awaiting.type !== 'none'
        ? 'NEEDS_INPUT' as const
        : 'ANSWER_READY' as const,
    }
    : dispatched?.result;

  const candidate = receptionDeskObserved
    ? await hermesTurnOrchestratorDeps.runHermesResponseCandidateSynthesis({
      turnId: receptionDeskObserved.plan.turnId,
      conversationId: receptionDeskObserved.plan.conversationId,
      correlationId: receptionDeskObserved.plan.correlationId,
      businessSlug: receptionDeskObserved.plan.businessSlug,
      agentPersona: receptionDeskObserved.context.business?.agent,
      userMessage: input.userMessage,
      turnAssessment: {
        ...receptionDeskObserved.assessment,
        activeProcess: Boolean(executed.authoritativeProcess?.process?.workflowId || receptionDeskObserved.assessment.activeProcess),
        processStatus: String(executed.authoritativeProcess?.process?.status || receptionDeskObserved.assessment.processStatus || '') || undefined,
        awaiting: {
          type: String(executed.authoritativeProcess?.awaiting?.type || receptionDeskObserved.assessment.awaiting?.type || '') || undefined,
          nextRecommendedField: String(
            executed.authoritativeProcess?.awaiting?.nextRecommendedField
            || receptionDeskObserved.assessment.awaiting?.nextRecommendedField
            || ''
          ) || undefined,
        },
      },
      dispatchPlan: receptionDeskObserved.plan,
      skillResult: visibleSkillResult,
      readOnlyContext: finalContext?.context || receptionDeskObserved.context,
      activeProcessSummary: {
        active: Boolean(executed.authoritativeProcess?.process?.workflowId || receptionDeskObserved.assessment.activeProcess),
        status: String(executed.authoritativeProcess?.process?.status || receptionDeskObserved.assessment.processStatus || '') || undefined,
        owner: receptionDeskObserved.plan.activeProcessOwner,
      },
      knownFacts: {
        ...receptionDeskObserved.assessment.knownData,
        ...receptionDeskObserved.plan.skillContext.relevantFacts,
        ...triage?.facts,
        catalogMatchStatus: triage?.catalogMatch.status,
        catalogMatchOfferingId: triage?.catalogMatch.offeringId,
        selectedOffering: authoritativeState?.selectedOffering,
        durationMinutes: authoritativeState?.durationMinutes || authoritativeState?.selectedOffering?.fulfillmentPolicy?.estimatedDurationMinutes,
        identityLookupAttempted: recoveredIdentity?.lookupAttempted,
        identityLookupMatched: recoveredIdentity?.lookupMatched,
        recoveredCustomerName: effectiveIdentity?.customerName,
        recoveredManagedEntityName: effectiveIdentity?.managedEntityName,
        recoveredCaseId: effectiveIdentity?.caseId,
        reservationStartAt: authoritativeState?.reservationStartAt || authoritativeState?.appointment?.reservation?.startAt,
        reservationEndAt: authoritativeState?.reservationEndAt || authoritativeState?.appointment?.reservation?.endAt,
      },
      sideQuestions: receptionDeskObserved.assessment.secondaryIntents.map((intent) => ({
        type: intent.type,
        summary: intent.summary,
      })),
      language: 'es',
      businessTimezone: receptionDeskObserved.context.business?.timezone,
      visibilityMode: 'visible_controlled',
    })
    : undefined;

  const compositionStartedAt = Date.now();
  const shouldAttemptConversationalComposition = Boolean(conversationalUnderstanding)
    || process.env.HERMES_CONVERSATIONAL_COMPOSE_WITHOUT_INTERPRETATION !== 'false';
  telemetry.compositionAttempted = shouldAttemptConversationalComposition;
  const conversationalReply = shouldAttemptConversationalComposition
    ? await hermesTurnOrchestratorDeps.composeHermesReply({
      userMessage: input.userMessage,
      context: finalContext?.context || receptionDeskObserved?.context,
      processState: authoritativeState,
      understanding: conversationalUnderstanding || {},
      deterministicReply: candidate?.candidateText || 'Estoy revisando tu solicitud.',
      actionExecuted: executed.toolResults.length > 0,
      conversationId: input.conversationId,
      correlationId: input.correlationId,
      messageId: input.messageId,
    }).catch((error) => {
      console.warn('[hermes-conversational-turn] composition skipped:', error);
      return undefined;
    })
    : undefined;
  telemetry.compositionModelMs = Date.now() - compositionStartedAt;
  telemetry.provider = conversationalReply?.provider || telemetry.provider;
  telemetry.model = conversationalReply?.model || telemetry.model;
  telemetry.compositionSucceeded = Boolean(conversationalReply);
  telemetry.compositionRetryUsed = Boolean(conversationalReply?.retryUsed);
  telemetry.fallbackUsed = !conversationalReply;
  const visibleMessage = conversationalReply?.reply || candidate?.candidateText || 'Estoy revisando tu solicitud.';
  const arbitrationLane = receptionDeskObserved?.assessment.arbitration?.lane as HermesVisibleArbitrationLane | undefined;
  const actionCommitted = executed.toolResults.some((entry) => {
    const payload: any = entry?.result;
    return Boolean(payload) && payload?.skipped !== true;
  });
  const committedFallback = committedActionFallbackMessage({
    lane: arbitrationLane,
    committed: actionCommitted,
    processContext: executed.authoritativeProcess,
    state: authoritativeState,
    toolResults: executed.toolResults,
  });
  const visibleCandidate = conversationalReply
    ? {
      ...(candidate || {
        status: 'CANDIDATE_READY' as const,
        responsePurpose: 'direct_response' as const,
        processContinuity: authoritativeWorkflowId ? 'maintained' as const : 'none' as const,
        answeredSideQuestions: [] as string[],
        actionDisclosure: {
          executionOccurred: false as const,
          availabilityVerified: false,
          confirmationIssued: false as const,
        },
        authorityDisclosure: {
          mentionsPendingValidation: false,
          mentionsPendingAvailability: false,
          mentionsHumanReview: false,
        },
        sourceSkillId: receptionDeskObserved?.plan.selectedSkill,
        sourceSkillVersion: 'conversational-composition',
        requiresVisibilityGate: true as const,
        fallbackRecommendation: 'none' as const,
        sanitizedMetadata: {},
      }),
      candidateText: conversationalReply.reply,
      sanitizedMetadata: {
        ...(candidate?.sanitizedMetadata || {}),
        responsePurpose: candidate?.responsePurpose || 'direct_response',
        conversationalComposition: {
          provider: conversationalReply.provider,
          model: conversationalReply.model,
          retryUsed: conversationalReply.retryUsed,
          obligationCount: conversationalReply.responseObligations.length,
          obligationIds: conversationalReply.responseObligations.map((item) => item.id),
          obligationCoverage: conversationalReply.obligationCoverage,
          delta: conversationalReply.conversationalDelta,
        },
      },
    }
    : candidate;

  const syntheticRuntimeResult = {
    provider: 'hermes' as const,
    model: conversationalReply?.model || receptionDeskObserved?.plan.selectedSkill || 'controlled-visible',
    message: visibleMessage,
    workflowId: authoritativeWorkflowId,
    state: authoritativeState,
    toolResults: executed.toolResults.map((entry) => ({
      capability: entry.capability,
      result: entry.result,
    })),
  };

  const visibleDecision = await resolveHermesVisibleRuntime({
    businessSlug: input.businessSlug,
    conversationId: input.conversationId,
    route: input.route,
    userMessage: input.userMessage,
    runtimeResult: syntheticRuntimeResult,
    visibleFallbackMessage: visibleMessage,
    committedFallbackMessage: committedFallback,
    arbitrationLane,
    context: finalContext?.context || receptionDeskObserved?.context,
    candidate: visibleCandidate,
    selectedSkill: receptionDeskObserved?.plan.selectedSkill,
  });
  telemetry.compositionRejectedByGate = Boolean(conversationalReply && !visibleDecision.validationResult.accepted);
  telemetry.repairUsed = visibleDecision.naturalizationFallbackUsed;
  telemetry.gateRejectionReasons = visibleDecision.validationResult.rejectionReasons;
  hermesTurnOrchestratorDeps.recordHermesCompositionTurnMetric({
    conversationId: input.conversationId,
    correlationId: input.correlationId,
    attempted: Boolean(telemetry.compositionAttempted),
    succeeded: Boolean(telemetry.compositionSucceeded),
    timedOut: Boolean(
      telemetry.compositionAttempted
      && !telemetry.compositionSucceeded
      && Number(telemetry.compositionModelMs || 0) >= Number(process.env.HERMES_MODEL_COMPOSITION_TIMEOUT_MS || 10000)
    ),
    rejectedByGate: Boolean(telemetry.compositionRejectedByGate),
    fallbackUsed: Boolean(telemetry.fallbackUsed),
    repairUsed: Boolean(telemetry.repairUsed),
    latencyMs: Number(telemetry.compositionModelMs || 0),
    retryUsed: Boolean(telemetry.compositionRetryUsed),
  });

  const fallbackMemoryPatch = fallbackMemoryPatchFromTurn({
    message: input.userMessage,
    messageId: input.messageId,
    currentSummary: (finalContext?.context || receptionDeskObserved?.context)?.conversation.memory?.summary,
  });
  const pendingQuestionMemoryPatch = visibleCandidate?.pendingQuestion || /\?\s*$/.test(visibleDecision.message)
    ? {
      lastAssistantQuestion: {
        question: visibleCandidate?.pendingQuestion || visibleDecision.message,
        expectedField: visibleCandidate?.pendingQuestion ? String(visibleCandidate.pendingQuestion) : undefined,
        messageId: controlledVisibleMessageId(input.messageId) || `${input.correlationId}:visible`,
      },
    }
    : undefined;
  const memoryPatch = mergeMemoryPatches(
    fallbackMemoryPatch,
    conversationalUnderstanding?.memoryPatch,
    pendingQuestionMemoryPatch
  );
  const memoryWriteStartedAt = Date.now();
  const memoryAfterWrite = await hermesTurnOrchestratorDeps.applyConversationMemoryPatch({
    businessSlug: input.businessSlug,
    conversationId: input.conversationId,
    messageId: input.messageId || input.correlationId,
    patch: memoryPatch,
  }).catch((error) => {
    console.warn('[hermes-memory] non-fatal patch failed', error);
    return undefined;
  });
  telemetry.memoryWriteMs = Date.now() - memoryWriteStartedAt;
  telemetry.memoryVersion = memoryAfterWrite?.version || telemetry.memoryVersion;
  telemetry.totalTurnMs = Date.now() - turnStartedAt;
  console.log('[hermes-conversation-observability] turn', {
    businessSlug: input.businessSlug,
    conversationId: input.conversationId,
    workflowId: authoritativeWorkflowId,
    provider: telemetry.provider,
    model: telemetry.model,
    fallbackUsed: telemetry.fallbackUsed,
    historyMessageCount: telemetry.historyMessageCount,
    memoryVersion: telemetry.memoryVersion,
    memoryReadMs: telemetry.contextBuildMs,
    contextBuildMs: telemetry.contextBuildMs,
    interpretationModelMs: telemetry.interpretationModelMs,
    policyMs: telemetry.policyMs,
    executionMs: telemetry.executionMs,
    compositionModelMs: telemetry.compositionModelMs,
    compositionAttempted: telemetry.compositionAttempted,
    compositionSucceeded: telemetry.compositionSucceeded,
    compositionRetryUsed: telemetry.compositionRetryUsed,
    compositionRejectedByGate: telemetry.compositionRejectedByGate,
    repairUsed: telemetry.repairUsed,
    gateRejectionReasons: telemetry.gateRejectionReasons,
    memoryWriteMs: telemetry.memoryWriteMs,
    totalTurnMs: telemetry.totalTurnMs,
  });

  const turnPlan = buildHermesTurnPlan({
    mode: receptionDeskObserved?.assessment.activeProcess ? 'hermes_process' : 'hermes_qa',
    observed: receptionDeskObserved,
    runtimeResult: syntheticRuntimeResult,
    triage,
  });

  await recordHermesTurnPlan({
    workflowId: authoritativeWorkflowId,
    businessSlug: input.businessSlug,
    conversationId: input.conversationId,
    state: authoritativeState,
    messageId: input.messageId,
    correlationId: input.correlationId,
    plan: turnPlan,
  });

  await persistControlledVisibleReply({
    runtime: visibleDecision.runtime,
    workflowId: authoritativeWorkflowId,
    businessSlug: input.businessSlug,
    conversationId: input.conversationId,
    body: visibleDecision.message,
    provider: syntheticRuntimeResult.provider,
    model: syntheticRuntimeResult.model,
    state: authoritativeState,
    messageId: controlledVisibleMessageId(input.messageId),
    correlationId: input.correlationId,
    metadata: {
      runtimeMode: visibleDecision.runtime === 'hermes' ? 'controlled_visible' : 'controlled_visible_legacy',
      runtime: visibleDecision.runtime,
      canaryBucket: visibleDecision.canaryBucket,
      selectedSkill: visibleDecision.selectedSkill,
      route: visibleDecision.route,
      naturalizationFallbackUsed: visibleDecision.naturalizationFallbackUsed,
      validationResult: visibleDecision.validationResult,
      workflowReference: authoritativeWorkflowId,
      fallbackMode: visibleDecision.fallbackMode,
      authorizedActions,
      conversationalTelemetry: telemetry,
    },
  });

  await hermesTurnOrchestratorDeps.recordAgentConversationMessage({
    workflowId: authoritativeWorkflowId || input.conversationId,
    businessSlug: input.businessSlug,
    conversationId: input.conversationId,
    role: 'system',
    visibility: 'internal',
    interactionType: 'system_event',
    body: `Hermes visibility decision ${visibleDecision.runtime} via ${visibleDecision.route}`,
    messageId: input.messageId ? `${input.messageId}:visibility-decision` : undefined,
    correlationId: input.correlationId,
    metadata: {
      runtimeMode: 'controlled_visible_decision',
      runtime: visibleDecision.runtime,
      canaryBucket: visibleDecision.canaryBucket,
      selectedSkill: visibleDecision.selectedSkill,
      route: visibleDecision.route,
      naturalizationFallbackUsed: visibleDecision.naturalizationFallbackUsed,
      validationResult: visibleDecision.validationResult,
      workflowReference: authoritativeWorkflowId,
      fallbackMode: visibleDecision.fallbackMode,
      authorizedActions,
      conversationalTelemetry: telemetry,
    },
    state: authoritativeState,
  });

  const hermesRuntimeTrace = {
    turnId: input.correlationId,
    phase: 'responded',
    arbitrationLane,
    domainAssessment: receptionDeskObserved?.assessment.primaryIntent.type === 'off_domain'
      ? 'clearly_external'
      : (receptionDeskObserved?.assessment.primaryIntent.type === 'uncertain' ? 'uncertain' : 'automotive'),
    selectedObligation: conversationalReply?.responseObligations?.[0]?.id || null,
    stateProgression: executed.toolResults.length > 0 || Boolean(authoritativeWorkflowId && !input.workflowId),
    workflowId: authoritativeWorkflowId || null,
    actionCommitted,
    fallbackUsed: Boolean(telemetry.fallbackUsed),
    finalVisibleSource: visibleDecision.naturalizationFallbackUsed && committedFallback
      ? 'committed_state_fallback'
      : visibleDecision.runtime,
    externalRejectionBlocked: visibleDecision.validationResult.rejectionReasons.some((reason) =>
      String(reason).includes('EXTERNAL_REJECTION_INCOMPATIBLE_WITH_ARBITRATION')
    ),
    finalDecision: visibleDecision.runtime === 'hermes' ? 'controlled_response' : 'legacy_fallback',
  };
  console.log('[hermes-runtime-trace]', JSON.stringify(hermesRuntimeTrace));

  return agentClientPayload({
    conversationId: input.conversationId,
    workflowId: authoritativeWorkflowId,
    provider: syntheticRuntimeResult.provider,
    model: syntheticRuntimeResult.model,
    message: visibleDecision.message,
    state: authoritativeState,
  });
};

const handleLegacyVisibleTurn = async (input: {
  route: HermesVisibleRoute;
  businessSlug: string;
  conversationId: string;
  workflowId?: string;
  userMessage: string;
  initialState?: any;
  messageId?: string;
  correlationId: string;
  channel?: string;
}) => {
  const result = await hermesTurnOrchestratorDeps.runAgentRuntime({
    businessSlug: input.businessSlug,
    conversationId: input.conversationId,
    workflowId: input.workflowId,
    message: input.userMessage,
    channel: input.channel || 'web_agent',
  });

  await recordControlledInbound({
    workflowId: result.workflowId || input.workflowId,
    businessSlug: input.businessSlug,
    conversationId: input.conversationId,
    body: input.userMessage,
    state: result.state || input.initialState,
    messageId: controlledInboundMessageId(input.messageId),
    correlationId: input.correlationId,
    route: input.route,
  });

  await hermesTurnOrchestratorDeps.recordVisibleAgentMessage({
    workflowId: result.workflowId || input.workflowId || input.conversationId,
    businessSlug: input.businessSlug,
    conversationId: input.conversationId,
    body: result.message,
    provider: result.provider,
    model: result.model,
    state: result.state || input.initialState,
    messageId: controlledVisibleMessageId(input.messageId),
    correlationId: input.correlationId,
    metadata: { runtimeMode: 'legacy_runtime', route: input.route },
  });

  await dispatchAndPersistHermesShadow({
    businessSlug: input.businessSlug,
    conversationId: input.conversationId,
    workflowId: result.workflowId || input.workflowId,
    state: result.state || input.initialState,
    userMessage: input.userMessage,
    legacyReply: result.message,
    correlationId: input.correlationId,
    channel: input.channel,
  });

  const receptionDeskObserved = await observeHermesReceptionDeskSafely({
    businessSlug: input.businessSlug,
    conversationId: input.conversationId,
    workflowId: result.workflowId || input.workflowId,
    message: input.userMessage,
    messageId: input.messageId,
    correlationId: input.correlationId,
    processState: result.state || input.initialState,
    ...idsFromState(result.state || input.initialState),
  });
  const dispatched = await dispatchHermesSkillSafely(receptionDeskObserved);
  await synthesizeHermesCandidateSafely({
    observed: receptionDeskObserved,
    dispatched,
    userMessage: input.userMessage,
  });

  await hermesTurnOrchestratorDeps.observeHermesSchedulingDryRun({
    businessSlug: input.businessSlug,
    conversationId: input.conversationId,
    workflowId: result.workflowId || input.workflowId,
    message: input.userMessage,
    messageId: input.messageId,
    correlationId: input.correlationId,
    processState: result.state || input.initialState,
    ...idsFromState(result.state || input.initialState),
  });
  const triage = receptionDeskObserved
    ? buildHermesTriageResult({
      assessment: receptionDeskObserved.assessment,
      plan: receptionDeskObserved.plan,
      runtimeResult: result,
    })
    : undefined;
  if (triage) {
    await hermesTurnOrchestratorDeps.persistHermesTriageResult({
      workflowId: result.workflowId || input.workflowId,
      businessSlug: input.businessSlug,
      conversationId: input.conversationId,
      correlationId: input.correlationId,
      messageId: input.messageId,
      triage,
      state: result.state || input.initialState,
    });
    await hermesTurnOrchestratorDeps.dispatchHermesSubAgent({
      workflowId: result.workflowId || input.workflowId,
      businessSlug: input.businessSlug,
      conversationId: input.conversationId,
      correlationId: input.correlationId,
      messageId: input.messageId,
      subAgentInput: buildHermesSubAgentInput({
        observed: receptionDeskObserved,
        triage,
      }),
      specialistResult: dispatched?.result,
      state: result.state || input.initialState,
    });
  }
  const turnPlan = buildHermesTurnPlan({
    mode: 'legacy',
    observed: receptionDeskObserved,
    runtimeResult: result,
    triage,
  });

  await recordHermesTurnPlan({
    workflowId: result.workflowId || input.workflowId,
    businessSlug: input.businessSlug,
    conversationId: input.conversationId,
    state: result.state || input.initialState,
    messageId: input.messageId,
    correlationId: input.correlationId,
    plan: turnPlan,
  });

  return agentClientPayload({
    conversationId: input.conversationId,
    workflowId: result.workflowId || input.workflowId,
    provider: result.provider,
    model: result.model,
    message: result.message,
    state: result.state || input.initialState,
  });
};

export const orchestrateHermesPublicTurn = async (input: OrchestratorInput) => {
  if (input.route === 'initial') {
    const businessSlug = String(input.businessSlug || '');
    const conversationId = String(input.conversationId || `web_${businessSlug}`);
    const correlationId = input.correlationId;
    const activeWorkflowId = await hermesTurnOrchestratorDeps.resolveActiveWorkflowForConversation({ businessSlug, conversationId });

    return handleControlledVisibleTurn({
      route: activeWorkflowId ? 'continuation' : 'initial',
      businessSlug,
      conversationId,
      userMessage: input.userMessage,
      workflowId: activeWorkflowId,
      messageId: input.messageId,
      correlationId,
      channel: input.channel,
    });
  }

  const workflowId = String(input.workflowId || '');
  const initialState = await hermesTurnOrchestratorDeps.getWorkflowState(workflowId);
  const businessSlug = initialState.businessSlug;
  const conversationId = String(
    input.conversationId
    || await hermesTurnOrchestratorDeps.resolveConversationIdForWorkflow({ businessSlug, workflowId })
    || workflowId
  );

  return handleControlledVisibleTurn({
    route: 'continuation',
    businessSlug,
    conversationId,
    userMessage: input.userMessage,
    workflowId,
    initialState,
    messageId: input.messageId,
    correlationId: input.correlationId,
    channel: input.channel,
  });
};
