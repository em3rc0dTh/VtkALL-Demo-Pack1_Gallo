import { buildAgentContext } from '../context/buildAgentContext';
import { AgentContext } from '../context/agentContext';
import { agentCapabilityGateway } from '../capabilities/agentCapabilityGateway';
import { deterministicFallback, extractPreferredDate, isWeekend } from '../fallback/deterministicFallback';
import { AgentModelProvider } from '../providers/agentModelProvider';
import { GeminiAgentProvider } from '../providers/geminiAgentProvider';
import { OllamaAgentProvider } from '../providers/ollamaAgentProvider';
import { buildSystemPrompt } from '../prompts/buildSystemPrompt';
import { AgentDecision, AgentRuntimeResult } from './agentDecision';

const MAX_TOOL_ITERATIONS = 4;

const FORBIDDEN_CLIENT_TERMS = [
  'workflow',
  'endpoint',
  'api',
  'payload',
  'provider',
  'base de datos',
  'temporal',
  'id del workflow',
  'schedule-consultation-',
];

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const isFirstNameField = (field?: string) => /^(firstname|customer_identity)$/i.test(String(field || '')) || /nombre/i.test(String(field || ''));
const isLastNameField = (field?: string) => /^(lastname|customer_last_name)$/i.test(String(field || '')) || /apellido/i.test(String(field || ''));
const isPhoneField = (field?: string) => /^(phone|contact_information)$/i.test(String(field || '')) || /telefono|phone|celular/i.test(String(field || ''));
const isExtensionField = (field?: string) => /^extension$/i.test(String(field || '')) || /extens/i.test(String(field || ''));
const isManagedEntityField = (field?: string) => /^(managedentitydisplayname|managed_entity)$/i.test(String(field || '')) || /managedEntity|vehiculo|entidad|auto|carro/i.test(String(field || ''));

export const toPhoneDigits = (value: string) => {
  const digits = value.replace(/\D/g, '');
  const national = digits.startsWith('51') ? digits.slice(2) : digits;
  return /^9\d{8}$/.test(national) ? digits : undefined;
};

const isClientSafe = (message: string) => {
  const normalized = normalize(message);
  return !FORBIDDEN_CLIENT_TERMS.some((term) => normalized.includes(term));
};

const cleanReply = (message: string, fallback: string) => {
  const trimmed = String(message || '').trim();
  if (!trimmed || !isClientSafe(trimmed)) return fallback;
  return trimmed;
};

const extractNaturalCustomerData = (message: string) => {
  const phone = toPhoneDigits(message.match(/\b(?:\+?\d[\d\s-]{6,}\d)\b/)?.[0] || '');
  const nameMatch = message.match(/\b(?:soy|me llamo|mi nombre es)\s+([A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)(?:\s+([A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+))?/i);
  const vehicleMatch = message.match(/\b(?:tengo|vehiculo|auto|carro)\s+(?:un|una)?\s*([A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ -]{3,40})/i);
  const summaryMatch = message.match(/\b(?:problema|falla|ruido|revisar|revision|diagnostico|diagnóstico)\b[\s\S]{0,120}/i);

  const data: Record<string, unknown> = {};
  if (nameMatch?.[1]) data.firstName = nameMatch[1];
  if (nameMatch?.[2]) data.lastName = nameMatch[2];
  if (phone) data.phone = phone;
  if (vehicleMatch?.[1]) data.managedEntityDisplayName = vehicleMatch[1].trim();
  if (summaryMatch?.[0]) data.managedEntitySummary = summaryMatch[0].trim();

  return data;
};

const looksLikeQuestion = (message: string) => /[?¿]|\b(cuanto|cuánto|dura|incluye|what|how|when|where)\b/i.test(message);
const asksForOptions = (message: string) =>
  /\b(cuales|cuáles|horarios|opciones|disponibles|muestra|ver|lista|what times|which ones)\b/i.test(normalize(message));

const contextualDataForAwaiting = (context: AgentContext, message: string) => {
  const field = context.process?.awaiting.nextRecommendedField;
  const text = message.trim();
  if (!field || !text || looksLikeQuestion(text)) return {};

  const digits = text.replace(/\D/g, '');
  if (isPhoneField(field)) {
    const phone = toPhoneDigits(text);
    if (phone) return { phone };
    return {};
  }
  if (isExtensionField(field) && digits.length >= 4) {
    return { extension: digits };
  }

  if (isFirstNameField(field)) {
    const match = text.match(/^(?:soy|me llamo|mi nombre es)?\s*([A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2,})(?:\s+([A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2,}))?\s*$/i);
    if (match?.[1]) {
      return {
        firstName: match[1],
        ...(match[2] ? { lastName: match[2] } : {}),
      };
    }
  }

  if (isLastNameField(field)) {
    const match = text.match(/^([A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2,}(?:\s+[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2,})?)$/i);
    if (match?.[1]) return { lastName: match[1] };
  }

  if (isManagedEntityField(field)) {
    return { managedEntityDisplayName: text };
  }

  return {};
};

const nextProgressiveQuestion = (context: AgentContext) => {
  const label = String(context.process?.awaiting.nextRecommendedField || 'tu nombre');

  if (isFirstNameField(label)) return 'Perfecto. Para empezar, como te llamas?';
  if (isLastNameField(label)) return 'Gracias. Y cual es tu apellido?';
  if (isPhoneField(label)) return 'Que numero de contacto podemos usar?';
  if (isManagedEntityField(label)) return 'Cuentame que vehiculo o elemento quieres que revisemos.';
  return `Me compartes ${label}?`;
};

const knownCustomerFirstName = (state: any) =>
  String(state?.customerData?.firstName || state?.knownFacts?.customer?.firstName || '').trim();

const knownOfferingName = (state: any) =>
  String(state?.selectedOffering?.name || state?.knownFacts?.offering?.name || '').trim();

const formatSlotOption = (slot: any, index: number) => {
  const start = slot?.startAt ? new Date(slot.startAt).toLocaleString('es-PE', {
    timeZone: 'America/Lima',
    dateStyle: 'short',
    timeStyle: 'short',
  }) : String(slot?._id || slot?.id || 'horario disponible');
  return `${index + 1}. ${start}`;
};

const slotOptionsReply = (slots: any[]) =>
  slots.length
    ? `Tengo estos horarios disponibles:\n${slots.slice(0, 5).map(formatSlotOption).join('\n')}\nCual prefieres?`
    : 'No veo horarios disponibles para ese filtro. Probamos con otro dia?';

const contextualFirstName = (context: AgentContext, state: any) =>
  knownCustomerFirstName(state)
  || String((context.process?.knownFacts?.customer as any)?.firstName || '').trim();

const contextualOfferingName = (context: AgentContext, state: any) =>
  knownOfferingName(state)
  || String((context.process?.knownFacts?.offering as any)?.name || '').trim();

const responseForUpdatedProcess = async (context: AgentContext, state: any, userMessage?: string) => {
  if (state?.status === 'WAITING_FOR_CUSTOMER_DATA') {
    const firstName = contextualFirstName(context, state);
    const offeringName = contextualOfferingName(context, state);
    const question = nextProgressiveQuestion(context);
    if (firstName && offeringName) return `Perfecto, ${firstName}. Ya tengo ${offeringName}. ${question}`;
    if (firstName) return `Perfecto, ${firstName}. ${question}`;
    if (offeringName) return `Perfecto, seguimos con ${offeringName}. ${question}`;
    return question;
  }
  if (state?.status === 'CUSTOMER_DATA_VALIDATED') {
    if (userMessage) {
      const preferredDate = extractPreferredDate(userMessage);
      if (preferredDate && isWeekend(preferredDate)) {
        return 'Los sábados y domingos no realizamos consultas. ¿Probamos con un día de lunes a viernes?';
      }
    }
    return 'Ya tengo esos datos. Que dia te vendria bien para revisar disponibilidad?';
  }
  if (state?.status === 'WAITING_FOR_SLOT_SELECTION') {
    const slots = context.process?.availableOptions || [];
    if (slots.length === 0 && userMessage) {
      const preferredDate = extractPreferredDate(userMessage);
      if (preferredDate && isWeekend(preferredDate)) {
        return 'Los sábados y domingos no realizamos consultas. ¿Probamos con un día de lunes a viernes?';
      }
    }
    return slotOptionsReply(slots);
  }
  if (state?.status === 'APPOINTMENT_BOOKED') {
    return 'Listo, tu cita quedo confirmada con la disponibilidad validada.';
  }
  return (await deterministicFallback(context, '')).reply || 'Seguimos con tu reserva.';
};

const providers: AgentModelProvider[] = [
  new GeminiAgentProvider(),
  new OllamaAgentProvider(),
];

const chooseProviderDecision = async (context: AgentContext, userMessage: string) => {
  const systemPrompt = buildSystemPrompt(context);
  for (const provider of providers) {
    try {
      const response = await provider.complete({ context, userMessage, systemPrompt });
      if (response?.decision) {
        console.log('[agent-runtime] provider.selected', {
          provider: response.provider,
          model: response.model,
          intent: response.decision.intent?.name,
          actions: (response.decision.actions || []).map((action) => action.capability),
        });
        return response;
      }
      console.log('[agent-runtime] provider.no_decision', { provider: provider.name });
    } catch (error) {
      console.warn(`[agent-runtime] ${provider.name} unavailable.`, error);
    }
  }
  return undefined;
};

const processActionKey = (action: NonNullable<AgentDecision['actions']>[number]) =>
  action.capability === 'continue_schedule_consultation'
    ? `${action.capability}:${String(action.arguments.action || '')}`
    : action.capability;

export const preserveDeterministicProcessActions = (providerDecision: AgentDecision, deterministicDecision: AgentDecision): AgentDecision => {
  const deterministicProcessActions = (deterministicDecision.actions || []).filter((action) =>
    action.capability === 'start_schedule_consultation' ||
    action.capability === 'continue_schedule_consultation'
  );
  if (!deterministicProcessActions.length) return providerDecision;

  const existingKeys = new Set((providerDecision.actions || []).map(processActionKey));
  const missingActions = deterministicProcessActions.filter((action) => !existingKeys.has(processActionKey(action)));
  if (!missingActions.length) return providerDecision;

  return {
    ...providerDecision,
    intent: providerDecision.intent || deterministicDecision.intent,
    actions: [
      ...(providerDecision.actions || []),
      ...missingActions,
    ],
    extractedData: {
      ...(deterministicDecision.extractedData || {}),
      ...(providerDecision.extractedData || {}),
    },
  };
};

export const removeProcessStartWhenActive = (context: AgentContext, decision: AgentDecision): AgentDecision => {
  if (!context.process || !decision.actions?.length) return decision;
  return {
    ...decision,
    actions: decision.actions.filter((action) => action.capability !== 'start_schedule_consultation'),
  };
};

const executeAction = async (context: AgentContext, action: NonNullable<AgentDecision['actions']>[number], activeWorkflowId?: string) => {
  switch (action.capability) {
    case 'search_catalog':
      return context.business.catalogSummary || [];
    case 'get_offering_details':
      return (context.business.catalogSummary || []).find((offering) => offering.id === action.arguments.offeringId)
        || (context.business.catalogSummary || []).find((offering) =>
          String(action.arguments.query || '').trim()
          && normalize(offering.name).includes(normalize(String(action.arguments.query || '')))
        );
    case 'start_schedule_consultation':
      return agentCapabilityGateway.startProcess({
        processType: 'schedule_consultation',
        businessSlug: context.business.businessSlug,
        conversationId: context.conversation.conversationId,
        offeringId: action.arguments.offeringId ? String(action.arguments.offeringId) : undefined,
        customerMessage: String(action.arguments.customerMessage || ''),
      });
    case 'continue_schedule_consultation': {
      const workflowId = String(action.arguments.workflowId || activeWorkflowId || context.process?.process.workflowId || '');
      if (!workflowId) return { skipped: true, reason: 'WORKFLOW_REQUIRED' };
      const process = context.process?.process.workflowId === workflowId
        ? context.process
        : await agentCapabilityGateway.getProcessContext({ workflowId });
      if (!process) return { skipped: true, reason: 'PROCESS_CONTEXT_REQUIRED' };
      const actionName = String(action.arguments.action || '');
      const data = action.arguments.data && typeof action.arguments.data === 'object'
        ? action.arguments.data as Record<string, unknown>
        : { ...action.arguments };
      delete (data as any).action;
      delete (data as any).workflowId;
      return agentCapabilityGateway.continueProcess({
        process,
        conversationId: context.conversation.conversationId,
        action: actionName,
        data,
      });
    }
    case 'get_current_process_state': {
      const workflowId = String(action.arguments.workflowId || activeWorkflowId || context.process?.process.workflowId || '');
      return workflowId ? agentCapabilityGateway.getProcessContext({ workflowId }) : { skipped: true, reason: 'WORKFLOW_REQUIRED' };
    }
    default:
      return { skipped: true, reason: 'CAPABILITY_NOT_ALLOWED' };
  }
};

const enrichDecisionForWorkflow = (context: AgentContext, decision: AgentDecision, userMessage: string): AgentDecision => {
  const process = context.process;
  if (!process) return decision;

  if (process.awaiting?.type === 'customer_information' || process.awaiting?.type === 'managed_entity_information') {
    const extractedData = {
      ...extractNaturalCustomerData(userMessage),
      ...contextualDataForAwaiting(context, userMessage),
      ...(decision.extractedData || {}),
    };
    if (Object.keys(extractedData).length) {
      return {
        ...decision,
        extractedData,
        actions: [
          ...(decision.actions || []),
          {
            capability: 'continue_schedule_consultation',
            arguments: {
              action: 'submit_customer_information',
              data: extractedData,
            },
          },
        ],
      };
    }
  }

  return decision;
};

const tryHandleMessageAgainstActiveProcess = async (
  context: AgentContext,
  userMessage: string
): Promise<AgentRuntimeResult | undefined> => {
  const process = context.process;
  if (!process) return undefined;

  const extractedData = {
    ...extractNaturalCustomerData(userMessage),
    ...contextualDataForAwaiting(context, userMessage),
  };

  console.log('[agent-runtime] active-process.preempt', {
    conversationId: context.conversation.conversationId,
    workflowId: process.process.workflowId,
    awaitingType: process.awaiting.type,
    nextRecommendedFieldBefore: process.awaiting.nextRecommendedField,
    messageClassification: Object.keys(extractedData).length ? 'process_information' : looksLikeQuestion(userMessage) ? 'side_question' : 'process_contextual',
    extractedProcessDataKeys: Object.keys(extractedData),
  });

  if (process.awaiting.type === 'slot_selection' && /^\d+$/.test(userMessage.trim())) {
    const decision = await deterministicFallback(context, userMessage);
    if (decision.actions?.some((action) => action.capability === 'continue_schedule_consultation')) {
      console.log('[agent-runtime] active-process.slot-selection', {
        conversationId: context.conversation.conversationId,
        workflowId: process.process.workflowId,
        actionCount: decision.actions.length,
      });
      return undefined;
    }
  }

  if (process.awaiting.type === 'slot_selection' && (looksLikeQuestion(userMessage) || asksForOptions(userMessage))) {
    const decision = await deterministicFallback(context, userMessage);
    console.log('[agent-runtime] active-process.result', {
      conversationId: context.conversation.conversationId,
      workflowId: process.process.workflowId,
      mcpAction: 'none',
      temporalUpdateSuccess: false,
      nextRecommendedFieldAfter: process.awaiting.nextRecommendedField,
      knownFactsKeysAfter: Object.keys(process.knownFacts || {}),
      responseMode: 'active_process_slot_options',
    });
    return {
      provider: 'default',
      message: cleanReply(decision.reply || '', slotOptionsReply(process.availableOptions || [])),
      workflowId: process.process.workflowId,
      state: process.rawState,
      decision,
      toolResults: [],
    };
  }

  if (
    (process.awaiting.type === 'customer_information' || process.awaiting.type === 'managed_entity_information') &&
    process.allowedActions.includes('submit_customer_information') &&
    Object.keys(extractedData).length
  ) {
    const updatedProcess = await agentCapabilityGateway.continueProcess({
      process,
      conversationId: context.conversation.conversationId,
      action: 'submit_customer_information',
      data: extractedData,
    }) as any;
    if (!updatedProcess?.process?.workflowId) return undefined;
    const updatedContext = await buildAgentContext({
      businessSlug: context.business.businessSlug,
      conversationId: context.conversation.conversationId,
      workflowId: updatedProcess.process.workflowId,
      channel: context.conversation.channel,
    });
    const updatedState: any = updatedProcess.rawState;

    console.log('[agent-runtime] active-process.result', {
      conversationId: context.conversation.conversationId,
      workflowId: updatedProcess.process.workflowId,
      mcpAction: 'submit_customer_information',
      temporalUpdateSuccess: true,
      nextRecommendedFieldAfter: updatedProcess.awaiting.nextRecommendedField,
      knownFactsKeysAfter: Object.keys(updatedProcess.knownFacts || {}),
      responseMode: 'active_process',
    });

    return {
      provider: 'default',
      message: cleanReply(await responseForUpdatedProcess(updatedContext, updatedState, userMessage), 'Seguimos con tu reserva.'),
      workflowId: updatedProcess.process.workflowId,
      state: updatedState,
      decision: {
        reply: await responseForUpdatedProcess(updatedContext, updatedState, userMessage),
        intent: { name: 'submit_process_information', confidence: 1 },
        actions: [{
          capability: 'continue_schedule_consultation',
          arguments: {
            action: 'submit_customer_information',
            data: extractedData,
          },
        }],
        extractedData,
      },
      toolResults: [{ capability: 'continue_schedule_consultation', result: updatedProcess }],
    };
  }

  if (looksLikeQuestion(userMessage)) {
    console.log('[agent-runtime] active-process.result', {
      conversationId: context.conversation.conversationId,
      workflowId: process.process.workflowId,
      mcpAction: 'none',
      temporalUpdateSuccess: false,
      nextRecommendedFieldAfter: process.awaiting.nextRecommendedField,
      knownFactsKeysAfter: Object.keys(process.knownFacts || {}),
      responseMode: 'provider_side_question',
    });
    return undefined;
  }

  console.log('[agent-runtime] active-process.result', {
    conversationId: context.conversation.conversationId,
    workflowId: process.process.workflowId,
    mcpAction: 'none',
    temporalUpdateSuccess: false,
    nextRecommendedFieldAfter: process.awaiting.nextRecommendedField,
    knownFactsKeysAfter: Object.keys(process.knownFacts || {}),
    responseMode: 'provider_contextual',
  });
  return undefined;
};

export const runAgentRuntime = async (input: {
  businessSlug: string;
  message: string;
  conversationId?: string;
  workflowId?: string;
  channel?: string;
}): Promise<AgentRuntimeResult> => {
  let context = await buildAgentContext(input);
  console.log('[agent-runtime] turn.start', {
    conversationId: context.conversation.conversationId,
    activeProcessFound: Boolean(context.process),
    workflowId: context.process?.process.workflowId,
    processStatus: context.process?.process.status,
    awaitingType: context.process?.awaiting.type,
    nextRecommendedField: context.process?.awaiting.nextRecommendedField,
  });

  const activeProcessResult = await tryHandleMessageAgainstActiveProcess(context, input.message);
  if (activeProcessResult) {
    return activeProcessResult;
  }

  const deterministicDecision = await deterministicFallback(context, input.message);
  const providerResponse = await chooseProviderDecision(context, input.message);
  let provider = providerResponse?.provider || 'default';
  let model = providerResponse?.model;
  let decision = providerResponse?.decision
    ? preserveDeterministicProcessActions(providerResponse.decision, deterministicDecision)
    : deterministicDecision;
  if (deterministicDecision.intent?.name === 'unsupported_catalog_request') {
    decision = deterministicDecision;
    provider = 'default';
    model = undefined;
  }
  decision = removeProcessStartWhenActive(context, decision);
  decision = enrichDecisionForWorkflow(context, decision, input.message);
  console.log('[agent-runtime] decision', {
    conversationId: context.conversation.conversationId,
    workflowId: context.process?.process.workflowId,
    intent: decision.intent?.name,
    actions: (decision.actions || []).map((action) => action.capability),
  });

  const toolResults: AgentRuntimeResult['toolResults'] = [];
  let workflowId = context.process?.process.workflowId;
  let state: any = context.process?.rawState;

  for (const action of (decision.actions || []).slice(0, MAX_TOOL_ITERATIONS)) {
    const result = await executeAction(context, action, workflowId);
    toolResults.push({ capability: action.capability, result });

    const maybeWorkflow: any = result;
    if (maybeWorkflow?.process?.workflowId && maybeWorkflow?.rawState) {
      workflowId = maybeWorkflow.process.workflowId;
      state = maybeWorkflow.rawState;
      context = await buildAgentContext({
        businessSlug: input.businessSlug,
        conversationId: input.conversationId,
        workflowId,
        channel: input.channel,
      });
    }
  }

  console.log('[agent-runtime] turn.end', {
    conversationId: context.conversation.conversationId,
    workflowId,
    processStatus: state?.status,
    awaitingType: context.process?.awaiting.type,
    nextRecommendedField: context.process?.awaiting.nextRecommendedField,
  });

  if (state?.status === 'WAITING_FOR_CUSTOMER_DATA') {
    decision.reply = await responseForUpdatedProcess(context, state, input.message);
  }

  if (state?.status === 'CUSTOMER_DATA_VALIDATED') {
    decision.reply = await responseForUpdatedProcess(context, state, input.message);
  }

  if (state?.status === 'WAITING_FOR_SLOT_SELECTION') {
    decision.reply = await responseForUpdatedProcess(context, state, input.message);
  }

  if (state?.status === 'APPOINTMENT_BOOKED') {
    decision.reply = await responseForUpdatedProcess(context, state, input.message);
  }

  const fallbackReply = (await deterministicFallback(context, input.message)).reply || 'Te leo. Como puedo ayudarte con la reserva?';

  return {
    provider,
    model,
    message: cleanReply(decision.reply || '', fallbackReply),
    workflowId,
    state,
    decision,
    toolResults,
  };
};
