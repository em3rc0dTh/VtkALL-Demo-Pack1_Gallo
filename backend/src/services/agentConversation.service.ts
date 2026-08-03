import crypto from 'crypto';
import { Case } from '../models/Case.model';
import { Customer } from '../models/Customer.model';
import { CustomerInteraction } from '../models/CustomerInteraction.model';
import { ScheduleConsultationState } from '../temporal/types';

type ConversationMessageInput = {
  workflowId: string;
  businessSlug: string;
  role: 'customer' | 'agent' | 'system';
  body: string;
  conversationId?: string;
  state?: ScheduleConsultationState;
  provider?: string;
  model?: string;
  interactionType?: string;
  messageId?: string;
  correlationId?: string;
  causationId?: string;
  visibility?: 'customer' | 'internal' | 'shadow';
  runtime?: 'legacy' | 'hermes';
  metadata?: Record<string, unknown>;
};

export type VisibleConversationMessage = {
  role: 'user' | 'assistant';
  content: string;
  createdAt?: Date;
};

export class AgentConversationConflictError extends Error {
  code = 'AGENT_CONVERSATION_CONFLICT';

  constructor(message: string) {
    super(message);
    this.name = 'AgentConversationConflictError';
  }
}

const realCaseIdFromState = (state?: ScheduleConsultationState) => {
  const appointmentEnvelope: any = state?.appointment;
  return appointmentEnvelope?.case?._id
    || appointmentEnvelope?.appointment?.caseId
    || appointmentEnvelope?.reservation?.caseId
    || undefined;
};

const customerIdFromState = (state?: ScheduleConsultationState) => {
  const appointmentEnvelope: any = state?.appointment;
  return appointmentEnvelope?.customer?._id
    || appointmentEnvelope?.appointment?.customerId
    || appointmentEnvelope?.reservation?.customerId
    || undefined;
};

const managedEntityIdFromState = (state?: ScheduleConsultationState) => {
  const appointmentEnvelope: any = state?.appointment;
  return appointmentEnvelope?.managedEntity?._id
    || appointmentEnvelope?.appointment?.managedEntityId
    || undefined;
};

export const syncWorkflowInteractionsToCase = async (workflowId: string, state?: ScheduleConsultationState) => {
  const caseId = realCaseIdFromState(state);
  if (!caseId || caseId === workflowId) return;

  await CustomerInteraction.updateMany(
    { workflowId, caseId: workflowId },
    {
      $set: {
        caseId,
        customerId: customerIdFromState(state),
        managedEntityId: managedEntityIdFromState(state),
      },
    }
  ).exec();
};

export const recordAgentConversationMessage = async ({
  workflowId,
  businessSlug,
  role,
  body,
  conversationId,
  state,
  provider,
  model,
  interactionType,
  messageId,
  correlationId,
  causationId,
  visibility,
  runtime,
  metadata,
}: ConversationMessageInput) => {
  const trimmedBody = String(body || '').trim();
  if (!trimmedBody) return null;

  const caseId = realCaseIdFromState(state) || workflowId;
  const customerId = customerIdFromState(state);
  const managedEntityId = managedEntityIdFromState(state);
  const direction = role === 'customer' ? 'inbound' : 'outbound';
  const resolvedRuntime = runtime || (role === 'agent' ? 'legacy' : undefined);
  const resolvedVisibility = visibility || 'customer';
  const document = {
    _id: `ci_${crypto.randomUUID()}`,
    businessSlug,
    caseId,
    customerId,
    managedEntityId,
    workflowId,
    conversationId,
    channel: 'web_agent',
    direction,
    actorType: role,
    participant: {
      type: role === 'customer' ? 'customer' : role === 'agent' ? 'ai_agent' : 'system',
      runtime: resolvedRuntime,
      agentName: role === 'agent' ? 'legacy' : undefined,
    },
    interactionType: interactionType || (role === 'customer' ? 'customer_message' : 'agent_message'),
    visibility: resolvedVisibility,
    messageId,
    status: state?.status || 'message_recorded',
    body: trimmedBody,
    message: trimmedBody,
    content: {
      text: trimmedBody,
      attachmentIds: [],
    },
    provider,
    model,
    execution: {
      correlationId,
      causationId,
      workflowId,
      channel: 'web_agent',
    },
    metadata: {
      temporalStatus: state?.status,
      selectedOfferingId: (state?.selectedOffering as any)?._id,
      selectedSlotId: state?.selectedSlotId,
      workflowType: 'schedule_consultation',
      runtimeMode: resolvedRuntime,
      ...metadata,
    },
  };

  if (messageId && conversationId) {
    const idempotencyQuery: any = {
      businessSlug,
      conversationId,
      messageId,
      direction,
      'participant.runtime': resolvedRuntime,
    };
    const existing: any = await CustomerInteraction.findOne(idempotencyQuery).lean().exec();
    if (existing) {
      const existingText = String(existing.content?.text || existing.body || existing.message || '').trim();
      if (existingText !== trimmedBody) {
        throw new AgentConversationConflictError('Conflicting conversation message replay.');
      }
      return existing;
    }

    try {
      return await (CustomerInteraction as any).findOneAndUpdate(
        idempotencyQuery,
        { $setOnInsert: document },
        { upsert: true, returnDocument: 'after' }
      ).exec();
    } catch (error: any) {
      if (error?.code === 11000) {
        const existingAfterRace: any = await CustomerInteraction.findOne(idempotencyQuery).lean().exec();
        const existingText = String(existingAfterRace?.content?.text || existingAfterRace?.body || existingAfterRace?.message || '').trim();
        if (existingText === trimmedBody) return existingAfterRace;
        throw new AgentConversationConflictError('Conflicting conversation message replay.');
      }
      throw error;
    }
  }

  return (CustomerInteraction as any).create(document);
};

type CentralConversationMessageInput = Omit<ConversationMessageInput, 'role' | 'visibility' | 'runtime'>;

export const recordInboundMessage = (input: CentralConversationMessageInput) =>
  recordAgentConversationMessage({
    ...input,
    role: 'customer',
    visibility: 'customer',
    interactionType: 'customer_message',
  });

export const recordVisibleAgentMessage = (input: CentralConversationMessageInput) =>
  recordAgentConversationMessage({
    ...input,
    role: 'agent',
    visibility: 'customer',
    runtime: 'legacy',
    interactionType: 'agent_message',
  });

export const recordVisibleHermesAgentMessage = (input: CentralConversationMessageInput) =>
  recordAgentConversationMessage({
    ...input,
    role: 'agent',
    visibility: 'customer',
    runtime: 'hermes',
    interactionType: 'agent_message',
  });

export const recordShadowAgentMessage = (input: CentralConversationMessageInput) =>
  recordAgentConversationMessage({
    ...input,
    role: 'agent',
    visibility: 'shadow',
    runtime: 'hermes',
    interactionType: 'shadow_response',
  });

export const recordAgentConversationTurn = async ({
  workflowId,
  conversationId,
  state,
  userMessage,
  assistantMessage,
  provider,
  model,
  interactionType,
}: {
  workflowId: string;
  conversationId?: string;
  state: ScheduleConsultationState;
  userMessage?: string;
  assistantMessage?: string;
  provider?: string;
  model?: string;
  interactionType?: string;
}) => {
  await syncWorkflowInteractionsToCase(workflowId, state);

  if (userMessage) {
    await recordInboundMessage({
      workflowId,
      conversationId,
      businessSlug: state.businessSlug,
      body: userMessage,
      state,
      interactionType: interactionType || 'customer_message',
    });
  }

  if (assistantMessage) {
    await recordVisibleAgentMessage({
      workflowId,
      conversationId,
      businessSlug: state.businessSlug,
      body: assistantMessage,
      state,
      provider,
      model,
      interactionType: interactionType || 'agent_message',
    });
  }
};

export const resolveActiveWorkflowForConversation = async ({
  businessSlug,
  conversationId,
}: {
  businessSlug: string;
  conversationId: string;
}) => {
  if (!businessSlug || !conversationId) return undefined;

  const terminalStatuses = ['APPOINTMENT_BOOKED', 'CANCELLED', 'FAILED_SERVICE_NOT_IN_CATALOG', 'FAILED_SLOT_UNAVAILABLE'];
  const nonWorkflowStatuses = ['message_recorded', 'conversation_open'];
  const interactions: any[] = await CustomerInteraction.find({
    businessSlug,
    conversationId,
    workflowId: { $exists: true, $ne: null },
  }).sort({ createdAt: -1 }).limit(50).lean().exec();

  const latestActive = interactions.find((interaction) =>
    !terminalStatuses.includes(String(interaction?.status || ''))
    && !nonWorkflowStatuses.includes(String(interaction?.status || ''))
    && String(interaction?.workflowId || '') !== conversationId
  );

  return latestActive?.workflowId ? String(latestActive.workflowId) : undefined;
};

export const resolveConversationIdForWorkflow = async ({
  businessSlug,
  workflowId,
}: {
  businessSlug?: string;
  workflowId: string;
}) => {
  if (!workflowId) return undefined;

  const query: Record<string, unknown> = {
    workflowId,
    conversationId: { $exists: true, $ne: null },
  };
  if (businessSlug) query.businessSlug = businessSlug;

  const interaction: any = await CustomerInteraction.findOne(query)
    .sort({ createdAt: 1 })
    .lean()
    .exec();

  return interaction?.conversationId ? String(interaction.conversationId) : undefined;
};

export const recordOpenAgentConversationTurn = async ({
  businessSlug,
  conversationId,
  userMessage,
  assistantMessage,
  provider,
  model,
  interactionType,
}: {
  businessSlug: string;
  conversationId: string;
  userMessage?: string;
  assistantMessage?: string;
  provider?: string;
  model?: string;
  interactionType?: string;
}) => {
  const base = {
    businessSlug,
    caseId: conversationId,
    conversationId,
    workflowId: undefined,
    channel: 'web_agent',
    status: 'conversation_open',
    interactionType: interactionType || 'agent_open_message',
  };

  if (userMessage?.trim()) {
    await recordInboundMessage({
      workflowId: conversationId,
      businessSlug,
      conversationId,
      body: userMessage,
      metadata: { openConversation: true },
    });
  }

  if (assistantMessage?.trim()) {
    await recordVisibleAgentMessage({
      workflowId: conversationId,
      businessSlug,
      conversationId,
      body: assistantMessage,
      provider,
      model,
      metadata: { openConversation: true },
    });
  }
};

export const findConversationMessageByMessageId = async ({
  businessSlug,
  conversationId,
  messageId,
  direction,
  runtime,
}: {
  businessSlug: string;
  conversationId: string;
  messageId: string;
  direction?: 'inbound' | 'outbound';
  runtime?: 'legacy' | 'hermes';
}) => {
  const query: any = {
    businessSlug,
    conversationId,
    messageId,
  };
  if (direction) query.direction = direction;
  if (runtime) query['participant.runtime'] = runtime;
  return CustomerInteraction.findOne(query).lean().exec();
};

export const getVisibleConversationHistory = async ({
  businessSlug,
  conversationId,
  limit = Number(process.env.HERMES_HISTORY_MAX_MESSAGES || '30'),
  maxChars = Number(process.env.HERMES_HISTORY_MAX_CHARS || '30000'),
}: {
  businessSlug: string;
  conversationId: string;
  limit?: number;
  maxChars?: number;
}): Promise<VisibleConversationMessage[]> => {
  if (!businessSlug || !conversationId) return [];

  const rows: any[] = await CustomerInteraction.find({
    businessSlug,
    conversationId,
    visibility: 'customer',
    interactionType: { $in: ['customer_message', 'agent_message', 'agent_open_message', 'agent_runtime_message'] },
  }).sort({ createdAt: -1, _id: -1 }).limit(Math.max(limit * 2, limit)).lean().exec();

  const chronological = rows.reverse().map((row) => ({
    role: row.direction === 'inbound' ? 'user' as const : 'assistant' as const,
    content: String(row.content?.text || row.body || row.message || '').trim(),
    createdAt: row.createdAt,
  })).filter((message) => message.content);

  const trimmed: VisibleConversationMessage[] = [];
  let chars = 0;
  for (const message of [...chronological].reverse()) {
    if (trimmed.length >= limit) break;
    if (trimmed.length > 0 && chars + message.content.length > maxChars) break;
    trimmed.unshift(message);
    chars += message.content.length;
  }
  return trimmed;
};

export const getShadowEvaluationHistory = async ({
  businessSlug,
  conversationId,
  limit = 20,
}: {
  businessSlug: string;
  conversationId: string;
  limit?: number;
}) => {
  if (!businessSlug || !conversationId) return [];
  return CustomerInteraction.find({
    businessSlug,
    conversationId,
    visibility: 'shadow',
    interactionType: 'shadow_response',
  }).sort({ createdAt: -1 }).limit(limit).lean().exec();
};

export const linkConversationToCustomer = async ({
  businessSlug,
  conversationId,
  customerId,
}: {
  businessSlug: string;
  conversationId: string;
  customerId: string;
}) => {
  if (!businessSlug || !conversationId || !customerId) return;
  const customer = await Customer.findOne({ businessSlug, _id: customerId }).select('_id').lean().exec();
  if (!customer) throw new AgentConversationConflictError('Customer does not belong to the conversation business.');
  const incompatible = await CustomerInteraction.findOne({
    businessSlug,
    conversationId,
    customerId: { $exists: true, $nin: [null, customerId] },
  }).select('_id customerId').lean().exec();
  if (incompatible) throw new AgentConversationConflictError('Conversation is already linked to a different customer.');
  await CustomerInteraction.updateMany({ businessSlug, conversationId }, { $set: { customerId } }).exec();
};

export const linkConversationToCase = async ({
  businessSlug,
  conversationId,
  caseId,
}: {
  businessSlug: string;
  conversationId: string;
  caseId: string;
}) => {
  if (!businessSlug || !conversationId || !caseId) return;
  const targetCase = await Case.findOne({ businessSlug, _id: caseId }).select('_id').lean().exec();
  if (!targetCase) throw new AgentConversationConflictError('Case does not belong to the conversation business.');
  const incompatible = await CustomerInteraction.findOne({
    businessSlug,
    conversationId,
    caseId: { $exists: true, $nin: [null, conversationId, caseId] },
  }).select('_id caseId').lean().exec();
  if (incompatible) throw new AgentConversationConflictError('Conversation is already linked to a different case.');
  await CustomerInteraction.updateMany({ businessSlug, conversationId }, { $set: { caseId } }).exec();
};
