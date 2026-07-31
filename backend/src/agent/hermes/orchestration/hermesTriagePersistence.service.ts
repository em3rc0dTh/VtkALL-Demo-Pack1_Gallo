import { recordAgentConversationMessage } from '../../../services/agentConversation.service';
import { HermesTriageResult } from '../contracts/hermesTriage.contract';

const sanitizedFacts = (facts: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(facts)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => {
        if (/firstName|managedEntityHint/i.test(key)) return [key, Boolean(value)];
        return [key, value];
      })
  );

export const persistHermesTriageResult = async (input: {
  workflowId?: string;
  businessSlug: string;
  conversationId: string;
  correlationId: string;
  messageId?: string;
  triage: HermesTriageResult;
  state?: any;
}) => recordAgentConversationMessage({
  workflowId: input.workflowId || input.conversationId,
  businessSlug: input.businessSlug,
  conversationId: input.conversationId,
  role: 'system',
  visibility: 'internal',
  interactionType: 'system_event',
  body: `Hermes triage ${input.triage.mode} -> ${input.triage.selectedAgent}`,
  messageId: input.messageId ? `${input.messageId}:triage` : undefined,
  correlationId: input.correlationId,
  metadata: {
    runtimeMode: 'triage_micro_stop',
    intent: input.triage.intent,
    mode: input.triage.mode,
    facts: sanitizedFacts(input.triage.facts),
    sideQuestion: input.triage.sideQuestion,
    selectedAgent: input.triage.selectedAgent,
    supportingAgents: input.triage.supportingAgents || [],
    requiredContext: input.triage.requiredContext,
    confidence: input.triage.confidence,
    reasonCode: input.triage.reasonCode,
    process: input.triage.process,
  },
  state: input.state,
});
