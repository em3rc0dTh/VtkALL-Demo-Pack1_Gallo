import { AgentProcessContext } from '../../../mcp/temporal/schemas/agentProcessContext';
import {
  findConversationMessageByMessageId,
  recordAgentConversationMessage,
  recordInboundMessage,
  recordVisibleHermesAgentMessage,
} from '../../../services/agentConversation.service';
import { SemanticError } from '../../../services/demoTest/core';
import { agentCapabilityGateway } from '../../capabilities/agentCapabilityGateway';
import { buildHermesReadOnlyContext } from '../context/hermesContextBuilder.service';
import { HermesReadOnlyContext, PublicOfferingSummary } from '../context/hermesContext.contract';
import { HermesSchedulingIntent } from '../contracts/hermesSchedulingIntent.contract';
import { SchedulingActionProposal } from '../contracts/schedulingActionProposal.contract';
import { buildSchedulingActionProposal } from './hermesSchedulingProposal.service';
import { extractHermesSchedulingIntent } from './hermesSchedulingIntent.service';
import {
  H06DAllowedAction,
  getHermesSchedulingBridgeBucket,
  getHermesSchedulingBridgeConfig,
  hasSchedulingSecurityRisk,
  isAllowedSchedulingBridgeAction,
  isHermesSchedulingBridgeCanaryEnabled,
  isOutOfScopeSchedulingIntent,
  isSupportedProcessState,
  normalizeProcessState,
  sanitizeProposalWorkflowAuthority,
} from './hermesSchedulingExecution.policy';
import {
  HermesSchedulingBridgeDecline,
  HermesSchedulingBridgeTurnResult,
  SchedulingExecutionResult,
} from './hermesSchedulingExecution.contract';
import {
  answerHermesSchedulingSideQuestion,
  deterministicHermesSchedulingReply,
} from './hermesSchedulingNaturalization.service';
import { executeHermesSchedulingCommand } from './hermesSchedulingIdempotency.service';
import { reconcileHermesSchedulingExecution } from './hermesSchedulingReconciliation.service';
import { buildHermesAvailabilityPresentation, HermesAvailabilityPresentation } from './hermesSchedulingAvailabilityPresentation.service';
import { normalizeHermesDatePreference } from './hermesSchedulingDateNormalization.service';
import { resolveHermesSlotSelection } from './hermesSchedulingSlotSelection.service';

type GatewayLike = typeof agentCapabilityGateway;
type ConversationRecorder = typeof recordAgentConversationMessage;

export interface HermesSchedulingBridgeInput {
  businessSlug: string;
  conversationId: string;
  message: string;
  attachmentIds?: string[];
  messageId: string;
  correlationId: string;
  channel?: string;
}

type BridgeDeps = {
  gateway?: GatewayLike;
  buildContext?: typeof buildHermesReadOnlyContext;
  recordInbound?: typeof recordInboundMessage;
  recordVisible?: typeof recordVisibleHermesAgentMessage;
  recordInternal?: ConversationRecorder;
  bucketFn?: typeof getHermesSchedulingBridgeBucket;
  findMessageById?: typeof findConversationMessageByMessageId;
};

type BridgePlan =
  | { kind: 'decline'; reason: HermesSchedulingBridgeDecline['reason'] }
  | { kind: 'clarify'; reply: string; semanticActions: Array<'REQUEST_CLARIFICATION'> }
  | {
      kind: 'handled_no_mutation';
      semanticActions: Array<'NO_ACTION' | 'REQUEST_AVAILABILITY'>;
      reply: string;
      availabilityPresentation?: HermesAvailabilityPresentation;
    }
  | {
      kind: 'execute';
      actions: Array<{ action: H06DAllowedAction; payload: Record<string, unknown> }>;
      semanticActions: Array<'START_SCHEDULE_CONSULTATION' | 'SUBMIT_OFFERING_SELECTION' | 'SUBMIT_CUSTOMER_INFORMATION' | 'SUBMIT_DATE_PREFERENCE' | 'SUBMIT_SLOT_SELECTION' | 'REQUEST_AVAILABILITY'>;
    };

const readRecordedText = (record: any) =>
  String(record?.content?.text || record?.body || record?.message || '').trim();

const replaySemanticActions = (value: unknown): HermesSchedulingBridgeTurnResult['semanticActions'] => {
  const allowed = new Set([
    'START_SCHEDULE_CONSULTATION',
    'SUBMIT_OFFERING_SELECTION',
    'SUBMIT_CUSTOMER_INFORMATION',
    'SUBMIT_DATE_PREFERENCE',
    'SUBMIT_SLOT_SELECTION',
    'REQUEST_AVAILABILITY',
    'REQUEST_CLARIFICATION',
    'NO_ACTION',
  ]);
  return String(value || '')
    .split(',')
    .map((token) => token.trim())
    .filter((token): token is HermesSchedulingBridgeTurnResult['semanticActions'][number] => allowed.has(token));
};

const replayExecutionResults = (record: any, processContext?: AgentProcessContext): SchedulingExecutionResult[] => {
  const semanticActions = replaySemanticActions(record?.metadata?.semanticAction).filter((item) =>
    item === 'START_SCHEDULE_CONSULTATION'
    || item === 'SUBMIT_OFFERING_SELECTION'
    || item === 'SUBMIT_CUSTOMER_INFORMATION'
    || item === 'SUBMIT_DATE_PREFERENCE'
    || item === 'SUBMIT_SLOT_SELECTION'
  );
  if (!semanticActions.length) return [];
  return semanticActions.map((action, index) => ({
    accepted: true,
    committed: true,
    action,
    outcome: 'REPLAYED',
    workflow: {
      workflowId: record?.workflowId ? String(record.workflowId) : processContext?.process.workflowId,
      started: action === 'START_SCHEDULE_CONSULTATION',
      reused: action !== 'START_SCHEDULE_CONSULTATION',
    },
    processContext,
    execution: {
      correlationId: String(record?.execution?.correlationId || record?.metadata?.correlationId || `replay:${record?.messageId || index}`),
      idempotencyKey: `${String(record?.metadata?.idempotencyReference || record?.messageId || 'replay')}:${index + 1}`,
    },
  }));
};

const semanticErrorResult = (
  action: SchedulingExecutionResult['action'],
  correlationId: string,
  causationId: string | undefined,
  idempotencyKey: string,
  code: string,
  message: string,
  retryable = false,
  workflowId?: string
): SchedulingExecutionResult => ({
  accepted: false,
  committed: false,
  action,
  outcome: 'SEMANTIC_ERROR',
  workflow: {
    workflowId,
    started: action === 'START_SCHEDULE_CONSULTATION',
    reused: action !== 'START_SCHEDULE_CONSULTATION',
  },
  execution: {
    correlationId,
    causationId,
    idempotencyKey,
  },
  error: {
    code,
    retryable,
    message,
  },
});

const normalize = (value: string) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const OFFERING_TERM_ALIASES: Record<string, string[]> = {
  basic: ['basica', 'básica'],
  consultation: ['consulta'],
  service: ['servicio'],
  services: ['servicios'],
  evaluation: ['evaluacion', 'evaluación'],
  schedule: ['agenda', 'agendar', 'reserva', 'reservar'],
};

const localizedOfferingAliases = (value: string) => {
  const normalized = normalize(value)
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!normalized) return [];

  const tokens = normalized.split(' ').filter(Boolean);
  const variants = new Set<string>([normalized]);
  const expandedPerToken = tokens.map((token) => [token, ...(OFFERING_TERM_ALIASES[token] || []).map(normalize)]);

  const walk = (index: number, current: string[]) => {
    if (index >= expandedPerToken.length) {
      variants.add(current.join(' ').trim());
      return;
    }
    for (const option of expandedPerToken[index]) {
      walk(index + 1, [...current, option]);
    }
  };

  walk(0, []);
  return [...variants].filter(Boolean);
};

const offeringMatchesMessage = (offering: PublicOfferingSummary, message: string) => {
  const normalizedMessage = normalize(message);
  const synonyms = [
    normalize(offering.id),
    ...localizedOfferingAliases(offering.name || ''),
    ...localizedOfferingAliases(offering.description || ''),
  ].filter(Boolean);
  return synonyms.some((token) => {
    if (normalizedMessage.includes(token)) return true;
    const terms = token.split(' ').filter((term) => term.length >= 4);
    return terms.length >= 2 && terms.every((term) => normalizedMessage.includes(term));
  });
};

const resolveOfferingCandidate = (
  message: string,
  proposal: SchedulingActionProposal,
  context: HermesReadOnlyContext
):
  | { kind: 'resolved'; offering: PublicOfferingSummary }
  | { kind: 'ambiguous' }
  | { kind: 'missing' } => {
  const catalog = context.catalog || [];
  if (!catalog.length) return { kind: 'missing' };

  if (proposal.payload.offeringId) {
    const exact = catalog.find((offering) => offering.id === proposal.payload.offeringId);
    return exact ? { kind: 'resolved', offering: exact } : { kind: 'missing' };
  }

  const normalizedMessage = normalize(message);
  if (/\b(primera opcion|primera opción|la primera|first option)\b/.test(normalizedMessage)) {
    return catalog[0] ? { kind: 'resolved', offering: catalog[0] } : { kind: 'missing' };
  }

  const matches = catalog.filter((offering) => offeringMatchesMessage(offering, message));
  if (matches.length === 1) return { kind: 'resolved', offering: matches[0] };
  if (matches.length > 1) return { kind: 'ambiguous' };
  return { kind: 'missing' };
};

const customerDataPayload = (intent: HermesSchedulingIntent) => {
  const payload: Record<string, unknown> = {};
  if (intent.extracted.firstName) payload.firstName = intent.extracted.firstName;
  if (intent.extracted.lastName) payload.lastName = intent.extracted.lastName;
  if (intent.extracted.phone) payload.phone = intent.extracted.phone;
  if (intent.extracted.email) payload.email = intent.extracted.email;
  if (intent.extracted.managedEntityHint) payload.managedEntityDisplayName = intent.extracted.managedEntityHint;
  return payload;
};

const dateFromSlots = (slots: any[], timezone: string) => {
  const first = slots[0];
  if (!first?.startAt) return undefined;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(first.startAt));
};

const buildReplayAvailabilityPresentation = (
  processContext: AgentProcessContext | undefined,
  metadata: any,
  maxSlots: number
) => {
  if (!metadata?.availabilityDate || !processContext) return undefined;
  return buildHermesAvailabilityPresentation({
    businessSlug: processContext.process.workflowId ? String((processContext.rawState as any)?.businessSlug || '') : '',
    conversationId: String(metadata.conversationId || ''),
    processContext,
    datePreference: {
      status: 'accepted',
      preferredDate: String(metadata.availabilityDate),
      timezone: String(metadata.availabilityTimezone || 'America/Lima'),
      rawText: '',
    },
    maxSlots,
  });
};

const buildExecutionPlan = (args: {
  intent: HermesSchedulingIntent;
  proposal: SchedulingActionProposal;
  processContext?: AgentProcessContext;
  context: HermesReadOnlyContext;
  message: string;
  config: ReturnType<typeof getHermesSchedulingBridgeConfig>;
}): BridgePlan => {
  const processState = normalizeProcessState(args.context.process, args.processContext?.rawState);
  const activeProcess = processState !== 'NO_ACTIVE_PROCESS';

  if (!isSupportedProcessState(processState)) {
    return { kind: 'decline', reason: 'PROCESS_STATE_OUT_OF_SCOPE' };
  }

  if (args.intent.type === 'side_question' && activeProcess) {
    const sideQuestionAnswer = answerHermesSchedulingSideQuestion(args.message, args.context, args.processContext);
    return {
      kind: 'handled_no_mutation',
      semanticActions: ['NO_ACTION'],
      reply: sideQuestionAnswer || deterministicHermesSchedulingReply({
        message: args.message,
        context: args.context,
        intent: args.intent,
        processContext: args.processContext,
        bridgeOutcome: 'NO_CHANGE',
      }),
    };
  }

  if (isOutOfScopeSchedulingIntent(args.intent)) {
    return { kind: 'decline', reason: 'ACTION_OUT_OF_SCOPE' };
  }

  if (args.intent.type === 'request_availability') {
    const timezone = args.context.business?.timezone || 'America/Lima';
    const normalizedDate = normalizeHermesDatePreference({
      message: args.message,
      timezone,
    });

    if (normalizedDate.status === 'clarification_required') {
      return {
        kind: 'clarify',
        semanticActions: ['REQUEST_CLARIFICATION'],
        reply: normalizedDate.message,
      };
    }

    if (normalizedDate.status === 'rejected') {
      return {
        kind: 'handled_no_mutation',
        semanticActions: ['NO_ACTION'],
        reply: normalizedDate.code === 'PAST_DATE'
          ? 'La fecha que indicaste ya paso en la zona horaria del negocio. Dime otro dia y reviso horarios.'
          : 'Esa fecha esta fuera del horizonte permitido. Dime una fecha mas cercana y reviso horarios.',
      };
    }

    if (!args.config.availabilityEnabled) {
      return { kind: 'decline', reason: 'ACTION_OUT_OF_SCOPE' };
    }

    if (!isHermesSchedulingBridgeCanaryEnabled(args.intent.source.businessSlug, args.intent.source.conversationId, args.config.availabilityCanaryPercent)) {
      return { kind: 'decline', reason: 'ACTION_OUT_OF_SCOPE' };
    }

    if (processState !== 'CUSTOMER_DATA_VALIDATED' && processState !== 'WAITING_FOR_SLOT_SELECTION') {
      return { kind: 'decline', reason: 'PROCESS_STATE_OUT_OF_SCOPE' };
    }

    const rawState: any = args.processContext?.rawState || {};
    const authoritativeSlots = Array.isArray(rawState.availableSlots) ? rawState.availableSlots : [];
    const existingDate = dateFromSlots(authoritativeSlots, timezone);

    if (
      args.config.reuseValidAvailabilityResults
      && processState === 'WAITING_FOR_SLOT_SELECTION'
      && existingDate === normalizedDate.preferredDate
      && authoritativeSlots.length
    ) {
        const availabilityPresentation = buildHermesAvailabilityPresentation({
          businessSlug: args.context.business?.businessSlug || args.intent.source.businessSlug,
          conversationId: args.context.conversation.conversationId,
          processContext: args.processContext,
          datePreference: normalizedDate,
          maxSlots: args.config.availabilityMaxSlotsPresented,
      });
      return {
        kind: 'handled_no_mutation',
        semanticActions: ['REQUEST_AVAILABILITY'],
        availabilityPresentation,
        reply: deterministicHermesSchedulingReply({
          message: args.message,
          context: args.context,
          intent: args.intent,
          processContext: args.processContext,
          bridgeOutcome: 'NO_CHANGE',
          availabilityPresentation,
        }),
      };
    }

    return {
      kind: 'execute',
      actions: [{
        action: 'SUBMIT_DATE_PREFERENCE',
        payload: {
          requestedDate: normalizedDate.preferredDate,
          ...(normalizedDate.dayPart ? { requestedDayPart: normalizedDate.dayPart } : {}),
          ...(normalizedDate.notBeforeTime ? { notBeforeTime: normalizedDate.notBeforeTime } : {}),
        },
      }],
      semanticActions: ['SUBMIT_DATE_PREFERENCE', 'REQUEST_AVAILABILITY'],
    };
  }

  if (args.intent.type === 'select_slot') {
    if (!args.config.bookingEnabled) {
      return { kind: 'decline', reason: 'ACTION_OUT_OF_SCOPE' };
    }

    if (!isHermesSchedulingBridgeCanaryEnabled(
      args.intent.source.businessSlug,
      args.intent.source.conversationId,
      args.config.bookingCanaryPercent
    )) {
      return { kind: 'decline', reason: 'ACTION_OUT_OF_SCOPE' };
    }

    if (processState !== 'WAITING_FOR_SLOT_SELECTION') {
      return { kind: 'decline', reason: 'PROCESS_STATE_OUT_OF_SCOPE' };
    }

    const resolvedSlot = resolveHermesSlotSelection({
      businessSlug: args.intent.source.businessSlug,
      conversationId: args.intent.source.conversationId,
      message: args.message,
      processContext: args.processContext,
      context: args.context,
    });

    if (resolvedSlot.status === 'clarification_required') {
      return {
        kind: 'clarify',
        semanticActions: ['REQUEST_CLARIFICATION'],
        reply: resolvedSlot.message,
      };
    }

    if (resolvedSlot.status === 'rejected') {
      return {
        kind: 'handled_no_mutation',
        semanticActions: ['NO_ACTION'],
        reply: resolvedSlot.message,
      };
    }

    return {
      kind: 'execute',
      actions: [{ action: 'SUBMIT_SLOT_SELECTION', payload: { slotId: resolvedSlot.slotId } }],
      semanticActions: ['SUBMIT_SLOT_SELECTION'],
    };
  }

  if (
    processState === 'WAITING_FOR_SERVICE_SELECTION'
    && (
      args.intent.type === 'select_offering'
      || args.intent.type === 'ambiguous'
      || (activeProcess && args.proposal.action === 'SUBMIT_OFFERING_SELECTION')
    )
  ) {
    const resolved = resolveOfferingCandidate(args.message, args.proposal, args.context);
    if (resolved.kind === 'ambiguous') {
      return {
        kind: 'clarify',
        semanticActions: ['REQUEST_CLARIFICATION'],
        reply: 'Puedo continuar con la reserva, pero necesito que me indiques exactamente cual servicio deseas.',
      };
    }
    if (resolved.kind === 'missing') {
      return {
        kind: 'clarify',
        semanticActions: ['REQUEST_CLARIFICATION'],
        reply: 'No encontre esa oferta dentro del catalogo autorizado. Que servicio deseas reservar?',
      };
    }
    return {
      kind: 'execute',
      actions: [{ action: 'SUBMIT_OFFERING_SELECTION', payload: { offeringId: resolved.offering.id } }],
      semanticActions: ['SUBMIT_OFFERING_SELECTION'],
    };
  }

  if (args.intent.type === 'provide_customer_data' || (activeProcess && args.proposal.action === 'SUBMIT_CUSTOMER_INFORMATION')) {
    if (processState !== 'WAITING_FOR_CUSTOMER_DATA') {
      return { kind: 'decline', reason: 'PROCESS_STATE_OUT_OF_SCOPE' };
    }
    const payload = customerDataPayload(args.intent);
    if (!Object.keys(payload).length) {
      return {
        kind: 'handled_no_mutation',
        semanticActions: ['NO_ACTION'],
        reply: deterministicHermesSchedulingReply({
          message: args.message,
          context: args.context,
          intent: args.intent,
          processContext: args.processContext,
          bridgeOutcome: 'NO_CHANGE',
        }),
      };
    }
    return {
      kind: 'execute',
      actions: [{ action: 'SUBMIT_CUSTOMER_INFORMATION', payload }],
      semanticActions: ['SUBMIT_CUSTOMER_INFORMATION'],
    };
  }

  if (args.intent.type === 'start_booking') {
    if (activeProcess) {
      return {
        kind: 'handled_no_mutation',
        semanticActions: ['NO_ACTION'],
        reply: deterministicHermesSchedulingReply({
          message: args.message,
          context: args.context,
          intent: args.intent,
          processContext: args.processContext,
          bridgeOutcome: 'NO_CHANGE',
        }),
      };
    }

    const actions: Array<{ action: H06DAllowedAction; payload: Record<string, unknown> }> = [
      { action: 'START_SCHEDULE_CONSULTATION', payload: {} },
    ];

    const resolvedOffering = resolveOfferingCandidate(args.message, args.proposal, args.context);
    if (resolvedOffering.kind === 'resolved') {
      actions.push({ action: 'SUBMIT_OFFERING_SELECTION', payload: { offeringId: resolvedOffering.offering.id } });
    } else if (resolvedOffering.kind === 'ambiguous') {
      return {
        kind: 'clarify',
        semanticActions: ['REQUEST_CLARIFICATION'],
        reply: 'Puedo iniciar el proceso, pero necesito que me indiques exactamente cual servicio deseas.',
      };
    } else {
      const payload = customerDataPayload(args.intent);
      if (Object.keys(payload).length) {
        actions.push({ action: 'SUBMIT_CUSTOMER_INFORMATION', payload });
      }
    }

    return {
      kind: 'execute',
      actions,
      semanticActions: actions.map((item) => item.action) as BridgePlan & any,
    } as BridgePlan;
  }

  if (activeProcess) {
    return {
      kind: 'handled_no_mutation',
      semanticActions: ['NO_ACTION'],
      reply: deterministicHermesSchedulingReply({
        message: args.message,
        context: args.context,
        intent: args.intent,
        processContext: args.processContext,
        bridgeOutcome: 'NO_CHANGE',
      }),
    };
  }

  return { kind: 'decline', reason: 'LEGACY_REQUIRED' };
};

const continueActionName = (action: H06DAllowedAction) => {
  if (action === 'SUBMIT_OFFERING_SELECTION') return 'submit_offering_selection';
  if (action === 'SUBMIT_DATE_PREFERENCE') return 'submit_date_preference';
  if (action === 'SUBMIT_SLOT_SELECTION') return 'submit_slot_selection';
  return 'submit_customer_information';
};

const continueActionPayload = (action: H06DAllowedAction, payload: Record<string, unknown>) => {
  if (action === 'SUBMIT_OFFERING_SELECTION') {
    return payload.offeringId ? { catalogOfferingId: String(payload.offeringId) } : payload;
  }
  if (action === 'SUBMIT_DATE_PREFERENCE') {
    return payload.requestedDate ? { preferredDate: String(payload.requestedDate) } : payload;
  }
  if (action === 'SUBMIT_SLOT_SELECTION') {
    return payload.slotId ? { slotId: String(payload.slotId) } : payload;
  }
  return payload;
};

const persistInternalExecutionEvent = async (args: {
  recorder: ConversationRecorder;
  workflowId: string;
  businessSlug: string;
  conversationId: string;
  body: string;
  messageId: string;
  correlationId: string;
  metadata: Record<string, unknown>;
  state?: unknown;
}) => {
  await args.recorder({
    workflowId: args.workflowId,
    businessSlug: args.businessSlug,
    conversationId: args.conversationId,
    role: 'system',
    visibility: 'internal',
    interactionType: 'system_event',
    body: args.body,
    messageId: `${args.messageId}:execution`,
    correlationId: args.correlationId,
    metadata: {
      runtimeMode: 'scheduling_execution',
      ...args.metadata,
    },
    state: args.state as any,
  });
};

const executeSingleBridgeAction = async (args: {
  gateway: GatewayLike;
  businessSlug: string;
  conversationId: string;
  messageId: string;
  correlationId: string;
  causationId?: string;
  action: H06DAllowedAction;
  payload: Record<string, unknown>;
  workflowId?: string;
  processContext?: AgentProcessContext;
}) => {
  const execute = async (): Promise<Omit<SchedulingExecutionResult, 'execution'>> => {
    try {
      if (args.action === 'START_SCHEDULE_CONSULTATION') {
        const processContext = await args.gateway.startProcess({
          processType: 'schedule_consultation',
          businessSlug: args.businessSlug,
          conversationId: args.conversationId,
          customerMessage: '',
        });
        return {
          accepted: true,
          committed: true,
          action: args.action,
          outcome: 'EXECUTED',
          workflow: {
            workflowId: processContext.process.workflowId,
            started: true,
            reused: false,
          },
          processContext,
        };
      }

      if (!args.processContext?.process?.workflowId) {
        throw new SemanticError({
          code: 'PROCESS_NOT_FOUND' as any,
          message: 'No active workflow was resolved for the requested continuation action.',
        });
      }

      const processContext = await args.gateway.continueProcess({
        process: args.processContext,
        conversationId: args.conversationId,
        action: continueActionName(args.action),
        data: continueActionPayload(args.action, args.payload),
      }) as AgentProcessContext & { skipped?: boolean; reason?: string };

      if ((processContext as any)?.skipped) {
        return {
          accepted: false,
          committed: false,
          action: args.action,
          outcome: 'PROCESS_STATE_MISMATCH',
          workflow: {
            workflowId: args.processContext.process.workflowId,
            started: false,
            reused: true,
          },
          processContext: args.processContext,
          error: {
            code: String((processContext as any).reason || 'PROCESS_STATE_MISMATCH'),
            retryable: false,
            message: 'The authoritative process did not allow this action.',
          },
        };
      }

      const rawState: any = processContext?.rawState || {};
      if (args.action === 'SUBMIT_SLOT_SELECTION') {
        if (String(processContext.process?.status || '') === 'APPOINTMENT_BOOKED' && rawState.appointment?.reservation?._id && rawState.appointment?.appointment?._id) {
          return {
            accepted: true,
            committed: true,
            action: args.action,
            outcome: 'EXECUTED',
            workflow: {
              workflowId: processContext.process.workflowId,
              started: false,
              reused: true,
            },
            processContext,
          };
        }

        if (String(processContext.process?.status || '') === 'WAITING_FOR_SLOT_SELECTION') {
          const errorMessage = Array.isArray(rawState.errors) && rawState.errors.length
            ? String(rawState.errors[0])
            : 'The authoritative slot could not be reserved.';
          return {
            accepted: false,
            committed: false,
            action: args.action,
            outcome: 'SEMANTIC_ERROR',
            workflow: {
              workflowId: processContext.process.workflowId,
              started: false,
              reused: true,
            },
            processContext,
            error: {
              code: /double_booking_conflict/i.test(errorMessage) ? 'DOUBLE_BOOKING_CONFLICT' : 'SLOT_UNAVAILABLE',
              retryable: false,
              message: errorMessage,
            },
          };
        }
      }

      return {
        accepted: true,
        committed: true,
        action: args.action,
        outcome: 'EXECUTED',
        workflow: {
          workflowId: processContext.process.workflowId,
          started: false,
          reused: true,
        },
        processContext: processContext as AgentProcessContext,
      };
    } catch (error: any) {
      const reconciled = await reconcileHermesSchedulingExecution({
        businessSlug: args.businessSlug,
        conversationId: args.conversationId,
        expectedAction: args.action,
        correlationId: args.correlationId,
        workflowId: args.workflowId || args.processContext?.process.workflowId,
        reason: error,
      });

      if (reconciled.outcome === 'EXECUTED') {
        return {
          accepted: true,
          committed: true,
          action: args.action,
          outcome: reconciled.outcome,
          workflow: reconciled.workflow,
          processContext: reconciled.processContext,
        };
      }

      return {
        accepted: false,
        committed: true,
        action: args.action,
        outcome: reconciled.outcome,
        workflow: reconciled.workflow,
        processContext: reconciled.processContext,
        error: reconciled.error,
      };
    }
  };

  return executeHermesSchedulingCommand({
    businessSlug: args.businessSlug,
    conversationId: args.conversationId,
    messageId: args.messageId,
    semanticAction: args.action,
    payload: args.payload,
    correlationId: args.correlationId,
    causationId: args.causationId,
    workflowId: args.workflowId,
    execute,
  });
};

export const runHermesSchedulingBridgeTurn = async (
  input: HermesSchedulingBridgeInput,
  deps: BridgeDeps = {}
): Promise<HermesSchedulingBridgeTurnResult | HermesSchedulingBridgeDecline> => {
  const gateway = deps.gateway || agentCapabilityGateway;
  const buildContext = deps.buildContext || buildHermesReadOnlyContext;
  const recordInbound = deps.recordInbound || recordInboundMessage;
  const recordVisible = deps.recordVisible || recordVisibleHermesAgentMessage;
  const recordInternal = deps.recordInternal || recordAgentConversationMessage;
  const bucketFn = deps.bucketFn || getHermesSchedulingBridgeBucket;
  const findMessageById = deps.findMessageById || findConversationMessageByMessageId;

  const config = getHermesSchedulingBridgeConfig();
  const canaryBucket = bucketFn(input.businessSlug, input.conversationId);

  if (!config.enabled) return { handled: false, reason: 'FEATURE_DISABLED', canaryBucket };
  if (!isHermesSchedulingBridgeCanaryEnabled(input.businessSlug, input.conversationId, config.canaryPercent)) {
    return { handled: false, reason: 'NOT_IN_CANARY', canaryBucket };
  }
  if ((input.attachmentIds || []).length) return { handled: false, reason: 'ATTACHMENT_PRESENT', canaryBucket };
  if (hasSchedulingSecurityRisk(input.message)) return { handled: false, reason: 'SECURITY_RISK', canaryBucket };

  const inboundMessageId = `${input.messageId}:inbound`;
  const visibleMessageId = `${input.messageId}:hermes`;
  const existingInbound = await findMessageById({
    businessSlug: input.businessSlug,
    conversationId: input.conversationId,
    messageId: inboundMessageId,
    direction: 'inbound',
  });
  const existingInboundText = readRecordedText(existingInbound);
  if (existingInbound && existingInboundText !== String(input.message || '').trim()) {
    const workflowId = (existingInbound as any).workflowId ? String((existingInbound as any).workflowId) : undefined;
    const processContext = workflowId ? await gateway.getProcessContext({ workflowId }) : undefined;
    return {
      handled: true,
      committed: false,
      runtime: 'hermes',
      bridgeOutcome: 'VALIDATION_REJECTED',
      semanticActions: ['START_SCHEDULE_CONSULTATION'],
      executionResults: [
        semanticErrorResult(
          'START_SCHEDULE_CONSULTATION',
          input.correlationId,
          undefined,
          `hermes-scheduling:${input.businessSlug}:${input.conversationId}:${input.messageId}:conflict`,
          'IDEMPOTENCY_CONFLICT',
          'The same messageId was already used with a different visible payload.',
          false,
          workflowId
        ),
      ],
      processContext,
      workflowId,
      state: processContext?.rawState,
      message: 'Detecte un conflicto de repeticion para este turno y no voy a ejecutar la accion otra vez.',
      canaryBucket,
      preCommitFallbackUsed: false,
      postCommitLegacyFallbackUsed: false,
      naturalizationFallbackUsed: true,
      internalEventPersisted: false,
    };
  }

  if (existingInbound && existingInboundText === String(input.message || '').trim()) {
    const existingVisible = await findMessageById({
      businessSlug: input.businessSlug,
      conversationId: input.conversationId,
      messageId: visibleMessageId,
      direction: 'outbound',
      runtime: 'hermes',
    });
    if (existingVisible) {
      const workflowId = (existingVisible as any).workflowId ? String((existingVisible as any).workflowId) : undefined;
      const processContext = workflowId ? await gateway.getProcessContext({ workflowId }) : undefined;
      const semanticActions = replaySemanticActions(existingVisible.metadata?.semanticAction);
      return {
        handled: true,
        committed: true,
        runtime: 'hermes',
        bridgeOutcome: 'REPLAYED',
        semanticActions,
        executionResults: replayExecutionResults(existingVisible, processContext),
        processContext,
        workflowId,
        state: processContext?.rawState,
        message: readRecordedText(existingVisible),
        availabilityPresentation: buildReplayAvailabilityPresentation(processContext, existingVisible.metadata, config.availabilityMaxSlotsPresented),
        canaryBucket,
        preCommitFallbackUsed: false,
        postCommitLegacyFallbackUsed: false,
        naturalizationFallbackUsed: Boolean(existingVisible?.metadata?.naturalizationFallbackUsed),
        internalEventPersisted: false,
      };
    }
  }

  const activeWorkflowId = await gateway.resolveActiveProcess({
    businessSlug: input.businessSlug,
    conversationId: input.conversationId,
  });
  const activeProcess = activeWorkflowId
    ? await gateway.getProcessContext({ workflowId: activeWorkflowId })
    : undefined;

  const built = await buildContext({
    businessSlug: input.businessSlug,
    conversationId: input.conversationId,
    channel: input.channel || 'web_agent',
    processState: activeProcess?.rawState,
    caseId: activeProcess?.process.caseId,
  });
  const context = built.context;

  const intent = extractHermesSchedulingIntent({
    businessSlug: input.businessSlug,
    conversationId: input.conversationId,
    message: input.message,
    messageId: input.messageId,
    context,
    processState: activeProcess?.rawState,
  });
  const proposal = buildSchedulingActionProposal({
    intent,
    context,
    processState: activeProcess?.rawState,
    correlationId: input.correlationId,
    workflowId: activeWorkflowId,
  }) as SchedulingActionProposal;

  const workflowAuthority = sanitizeProposalWorkflowAuthority(proposal, activeWorkflowId);
  if (!workflowAuthority.accepted) {
    return { handled: false, reason: 'LEGACY_REQUIRED', canaryBucket };
  }

  const plan = buildExecutionPlan({
    intent,
    proposal,
    processContext: activeProcess,
    context,
    message: input.message,
    config,
  });

  if (plan.kind === 'decline') {
    return { handled: false, reason: plan.reason, canaryBucket };
  }

  if (plan.kind === 'clarify') {
    await recordInbound({
      workflowId: activeWorkflowId || input.conversationId,
      businessSlug: input.businessSlug,
      conversationId: input.conversationId,
      body: input.message,
      state: activeProcess?.rawState as any,
      messageId: inboundMessageId,
      correlationId: input.correlationId,
      metadata: { runtimeMode: 'scheduling_primary' },
    });
    await recordVisible({
      workflowId: activeWorkflowId || input.conversationId,
      businessSlug: input.businessSlug,
      conversationId: input.conversationId,
      body: plan.reply,
      state: activeProcess?.rawState as any,
      messageId: visibleMessageId,
      correlationId: input.correlationId,
      metadata: {
        runtimeMode: 'scheduling_primary',
        semanticAction: plan.semanticActions.join(','),
        executionOutcome: 'VALIDATION_REJECTED',
        workflowStarted: false,
        workflowReused: Boolean(activeWorkflowId),
        processStatus: activeProcess?.process.status,
        conversationId: input.conversationId,
        canaryBucket,
        naturalizationFallbackUsed: true,
      },
    });
    return {
      handled: true,
      committed: false,
      runtime: 'hermes',
      bridgeOutcome: 'REQUEST_CLARIFICATION',
      semanticActions: plan.semanticActions,
      executionResults: [],
      processContext: activeProcess,
      workflowId: activeWorkflowId,
      state: activeProcess?.rawState as any,
      message: plan.reply,
      canaryBucket,
      preCommitFallbackUsed: false,
      postCommitLegacyFallbackUsed: false,
      naturalizationFallbackUsed: true,
      internalEventPersisted: false,
    };
  }

  if (plan.kind === 'handled_no_mutation') {
    await recordInbound({
      workflowId: activeWorkflowId || input.conversationId,
      businessSlug: input.businessSlug,
      conversationId: input.conversationId,
      body: input.message,
      state: activeProcess?.rawState as any,
      messageId: inboundMessageId,
      correlationId: input.correlationId,
      metadata: { runtimeMode: 'scheduling_primary' },
    });
    await recordVisible({
      workflowId: activeWorkflowId || input.conversationId,
      businessSlug: input.businessSlug,
      conversationId: input.conversationId,
      body: plan.reply,
      state: activeProcess?.rawState as any,
      messageId: visibleMessageId,
      correlationId: input.correlationId,
      metadata: {
        runtimeMode: 'scheduling_primary',
        semanticAction: plan.semanticActions.join(','),
        executionOutcome: 'NO_CHANGE',
        workflowStarted: false,
        workflowReused: Boolean(activeWorkflowId),
        processStatus: activeProcess?.process.status,
        conversationId: input.conversationId,
        canaryBucket,
        naturalizationFallbackUsed: true,
        availabilityDate: plan.availabilityPresentation?.date,
        availabilityTimezone: plan.availabilityPresentation?.timezone,
        availabilitySlotCount: plan.availabilityPresentation?.slots.length,
      },
    });
    return {
      handled: true,
      committed: false,
      runtime: 'hermes',
      bridgeOutcome: 'NO_CHANGE',
      semanticActions: plan.semanticActions,
      executionResults: [],
      processContext: activeProcess,
      workflowId: activeWorkflowId,
      state: activeProcess?.rawState,
      message: plan.reply,
      availabilityPresentation: plan.availabilityPresentation,
      canaryBucket,
      preCommitFallbackUsed: false,
      postCommitLegacyFallbackUsed: false,
      naturalizationFallbackUsed: true,
      internalEventPersisted: false,
    };
  }

  await recordInbound({
    workflowId: activeWorkflowId || input.conversationId,
    businessSlug: input.businessSlug,
    conversationId: input.conversationId,
    body: input.message,
    state: activeProcess?.rawState as any,
    messageId: inboundMessageId,
    correlationId: input.correlationId,
    metadata: { runtimeMode: 'scheduling_primary' },
  });

  const executionResults: SchedulingExecutionResult[] = [];
  let currentProcess = activeProcess;
  let currentWorkflowId = activeWorkflowId;

  for (const [index, item] of plan.actions.entries()) {
    let execution: SchedulingExecutionResult;
    try {
      execution = await executeSingleBridgeAction({
        gateway,
        businessSlug: input.businessSlug,
        conversationId: input.conversationId,
        messageId: `${input.messageId}:${index + 1}`,
        correlationId: input.correlationId,
        action: item.action,
        payload: item.payload,
        workflowId: currentWorkflowId,
        processContext: currentProcess,
      });
    } catch (error: any) {
      execution = semanticErrorResult(
        item.action,
        input.correlationId,
        undefined,
        `hermes-scheduling:${input.businessSlug}:${input.conversationId}:${input.messageId}:${item.action}`,
        String(error?.code || 'INTERNAL_ERROR'),
        String(error?.message || 'Scheduling bridge command failed.'),
        Boolean(error?.retryable),
        currentWorkflowId
      );
    }
    executionResults.push(execution);
    currentWorkflowId = execution.workflow.workflowId || currentWorkflowId;
    currentProcess = execution.processContext || currentProcess;
    if (!execution.committed || execution.outcome === 'EXECUTION_UNKNOWN' || execution.outcome === 'SEMANTIC_ERROR') {
      break;
    }
  }

  const bridgeOutcome = executionResults.some((item) => item.outcome === 'EXECUTION_UNKNOWN')
    ? 'EXECUTION_UNKNOWN'
    : executionResults.every((item) => item.outcome === 'REPLAYED')
      ? 'REPLAYED'
      : executionResults.some((item) => item.outcome === 'EXECUTED')
        ? 'EXECUTED'
        : 'NO_CHANGE';
  const finalProcess = currentProcess;

  const normalizedDate = intent.type === 'request_availability'
    ? normalizeHermesDatePreference({
      message: input.message,
      timezone: context.business?.timezone || 'America/Lima',
    })
    : undefined;
  const availabilityPresentation = (
    normalizedDate?.status === 'accepted'
    && finalProcess
  )
    ? buildHermesAvailabilityPresentation({
      businessSlug: input.businessSlug,
      conversationId: input.conversationId,
      processContext: finalProcess,
      datePreference: normalizedDate,
      maxSlots: config.availabilityMaxSlotsPresented,
    })
    : undefined;

  const naturalized = deterministicHermesSchedulingReply({
    message: input.message,
    context,
    intent,
    processContext: finalProcess,
    bridgeOutcome,
    availabilityPresentation,
  });

  if (currentWorkflowId) {
    await persistInternalExecutionEvent({
      recorder: recordInternal,
      workflowId: currentWorkflowId,
      businessSlug: input.businessSlug,
      conversationId: input.conversationId,
      body: `Hermes scheduling bridge ${plan.actions.map((item) => item.action).join(' + ')} -> ${bridgeOutcome}`,
      messageId: input.messageId,
      correlationId: input.correlationId,
      metadata: {
        semanticAction: plan.semanticActions.join(','),
        executionOutcome: bridgeOutcome,
        workflowStarted: executionResults.some((item) => item.workflow.started),
        workflowReused: executionResults.some((item) => item.workflow.reused),
        processStatus: finalProcess?.process.status,
        conversationId: input.conversationId,
        canaryBucket,
        availabilityDate: availabilityPresentation?.date,
        availabilityTimezone: availabilityPresentation?.timezone,
        availabilitySlotCount: availabilityPresentation?.slots.length,
      },
      state: finalProcess?.rawState,
    });
  }

  await recordVisible({
    workflowId: currentWorkflowId || input.conversationId,
    businessSlug: input.businessSlug,
    conversationId: input.conversationId,
    body: naturalized,
    state: finalProcess?.rawState as any,
    messageId: visibleMessageId,
    correlationId: input.correlationId,
    metadata: {
      runtimeMode: 'scheduling_primary',
      semanticAction: plan.semanticActions.join(','),
      executionOutcome: bridgeOutcome,
      workflowStarted: executionResults.some((item) => item.workflow.started),
      workflowReused: executionResults.some((item) => item.workflow.reused),
      processStatus: finalProcess?.process.status,
      conversationId: input.conversationId,
      canaryBucket,
      naturalizationFallbackUsed: true,
      idempotencyReference: executionResults.map((item) => item.execution.idempotencyKey).join(','),
      availabilityDate: availabilityPresentation?.date,
      availabilityTimezone: availabilityPresentation?.timezone,
      availabilitySlotCount: availabilityPresentation?.slots.length,
    },
  });

  return {
    handled: true,
    committed: executionResults.some((item) => item.committed),
    runtime: 'hermes',
    bridgeOutcome,
    semanticActions: plan.semanticActions,
    executionResults,
    processContext: finalProcess,
    workflowId: currentWorkflowId,
    state: finalProcess?.rawState,
    message: naturalized,
    availabilityPresentation,
    canaryBucket,
    preCommitFallbackUsed: false,
    postCommitLegacyFallbackUsed: false,
    naturalizationFallbackUsed: true,
    internalEventPersisted: Boolean(currentWorkflowId),
  };
};
