import {
  recordAgentConversationMessage,
  VisibleConversationMessage,
} from '../../../services/agentConversation.service';
import { HermesReadOnlyContext } from '../context/hermesContext.contract';
import { HermesSchedulingIntent } from '../contracts/hermesSchedulingIntent.contract';
import { SchedulingActionProposal } from '../contracts/schedulingActionProposal.contract';
import { SchedulingDryRunResult } from '../contracts/schedulingDryRunResult.contract';
import { buildSchedulingActionProposal } from './hermesSchedulingProposal.service';
import { validateSchedulingActionProposal } from './hermesSchedulingProposal.validator';
import { extractHermesSchedulingIntent } from './hermesSchedulingIntent.service';

export interface HermesSchedulingDryRunInput {
  businessSlug: string;
  conversationId: string;
  workflowId?: string;
  message: string;
  messageId?: string;
  correlationId: string;
  causationId?: string;
  context: HermesReadOnlyContext;
  processState?: any;
  persist?: boolean;
}

export interface HermesSchedulingDryRunEvaluation {
  intent: HermesSchedulingIntent;
  proposal: SchedulingActionProposal;
  result: SchedulingDryRunResult;
}

const maskValue = (value?: string) => Boolean(String(value || '').trim());

const knownFactsFrom = (context: HermesReadOnlyContext, processState?: any) => ({
  conversationId: context.conversation.conversationId,
  businessSlug: context.business?.businessSlug,
  timezone: context.business?.timezone,
  activeProcess: Boolean(processState?.status || context.process?.active),
  processStatus: processState?.status || context.process?.status,
  selectedOfferingId: processState?.selectedOffering?._id || processState?.selectedOfferingId || context.process?.knownFacts?.offeringId,
  selectedSlotId: processState?.selectedSlotId,
  catalogIds: (context.catalog || []).map((offering) => offering.id),
  phoneKnown: context.customer?.knownFacts.phoneKnown || false,
  emailKnown: context.customer?.knownFacts.emailKnown || false,
});

const dryRunBody = (result: SchedulingDryRunResult) =>
  `Hermes scheduling dry-run ${result.proposedAction} -> ${result.status}`;

export const runHermesSchedulingDryRun = async (
  input: HermesSchedulingDryRunInput
): Promise<HermesSchedulingDryRunEvaluation> => {
  const messageId = input.messageId || `h06a:${input.conversationId}:${input.correlationId}`;
  const intent = extractHermesSchedulingIntent({
    businessSlug: input.businessSlug,
    conversationId: input.conversationId,
    message: input.message,
    messageId,
    context: input.context,
    processState: input.processState,
  });

  const proposal = buildSchedulingActionProposal({
    intent,
    context: input.context,
    processState: input.processState,
    correlationId: input.correlationId,
    causationId: input.causationId,
    workflowId: input.workflowId,
  });

  const validation = validateSchedulingActionProposal(proposal, {
    context: input.context,
    processState: input.processState,
    message: input.message,
  });

  const result: SchedulingDryRunResult = {
    accepted: validation.accepted,
    proposedAction: proposal.action,
    executionAllowed: false,
    temporalCalled: false,
    databaseWritten: false,
    status: validation.status,
    requiredFacts: validation.requiredFacts,
    knownFacts: {
      ...knownFactsFrom(input.context, input.processState),
      extractedFirstName: intent.extracted.firstName,
      extractedLastName: intent.extracted.lastName,
      phonePresent: maskValue(intent.extracted.phone),
      emailPresent: maskValue(intent.extracted.email),
      extractedOfferingId: intent.extracted.offeringId,
      requestedDate: intent.extracted.requestedDate,
      requestedTime: intent.extracted.requestedTime,
      slotId: intent.extracted.slotId,
      intentType: intent.type,
    },
    validationErrors: validation.validationErrors,
    nextRecommendedAction: validation.nextRecommendedAction,
  };

  if (input.persist) {
    await recordAgentConversationMessage({
      workflowId: input.workflowId || input.conversationId,
      businessSlug: input.businessSlug,
      conversationId: input.conversationId,
      role: 'system',
      visibility: 'shadow',
      interactionType: 'system_event',
      body: dryRunBody(result),
      messageId: `${messageId}:dry-run`,
      correlationId: input.correlationId,
      causationId: input.causationId,
      metadata: {
        runtimeMode: 'scheduling_dry_run',
        intentType: intent.type,
        proposedAction: proposal.action,
        accepted: result.accepted,
        status: result.status,
        temporalCalled: false,
        databaseWritten: false,
        phonePresent: maskValue(intent.extracted.phone),
        emailPresent: maskValue(intent.extracted.email),
      },
    });
  }

  return {
    intent,
    proposal,
    result,
  };
};

export const shouldRunHermesSchedulingDryRun = () =>
  process.env.HERMES_SCHEDULING_DRY_RUN_ENABLED === 'true';

export const buildSchedulingDryRunHistory = (context: HermesReadOnlyContext): VisibleConversationMessage[] =>
  context.conversation.history.map((message) => ({
    role: message.role,
    content: message.content,
  }));
