import { recordAgentConversationMessage } from '../../../services/agentConversation.service';
import { HermesResponseCandidate } from '../contracts/hermesResponseCandidate.contract';
import { HermesSkillResult } from '../contracts/hermesSkillRegistry.contract';
import { HermesSubAgentInput, HermesSubAgentResult } from '../contracts/hermesSubAgent.contract';
import { HermesAgentId } from '../contracts/hermesTriage.contract';
import { resolveHermesAgentManifest } from './hermesAgentRegistry';
import { runCatalogAgent } from '../subagents/catalogAgent';
import { runConversationAgent } from '../subagents/conversationAgent';
import { runRecoveryAgent } from '../subagents/recoveryAgent';
import { runSchedulingAgent } from '../subagents/schedulingAgent';

const runners: Record<HermesAgentId, (input: HermesSubAgentInput & {
  specialistResult?: HermesSkillResult;
  candidate?: HermesResponseCandidate;
}) => Promise<HermesSubAgentResult>> = {
  'conversation-agent': runConversationAgent,
  'catalog-agent': runCatalogAgent,
  'scheduling-agent': runSchedulingAgent,
  'recovery-agent': runRecoveryAgent,
};

export const dispatchHermesSubAgent = async (input: {
  workflowId?: string;
  businessSlug: string;
  conversationId: string;
  correlationId: string;
  messageId?: string;
  subAgentInput: HermesSubAgentInput;
  specialistResult?: HermesSkillResult;
  candidate?: HermesResponseCandidate;
  state?: any;
}) => {
  const manifest = resolveHermesAgentManifest(input.subAgentInput.triage.selectedAgent) || resolveHermesAgentManifest('recovery-agent');
  const runner = manifest ? runners[manifest.id] : runners['recovery-agent'];
  const result = await runner({
    ...input.subAgentInput,
    specialistResult: input.specialistResult,
    candidate: input.candidate,
  });

  await recordAgentConversationMessage({
    workflowId: input.workflowId || input.conversationId,
    businessSlug: input.businessSlug,
    conversationId: input.conversationId,
    role: 'system',
    visibility: 'internal',
    interactionType: 'system_event',
    body: `Hermes sub-agent ${result.agent} -> ${result.outcome}`,
    messageId: input.messageId ? `${input.messageId}:sub-agent` : undefined,
    correlationId: input.correlationId,
    metadata: {
      runtimeMode: 'sub_agent_dispatch',
      selectedAgent: result.agent,
      skill: manifest?.skill,
      outcome: result.outcome,
      pendingFacts: result.pendingFacts,
      requiresAuthoritativeExecution: result.requiresAuthoritativeExecution,
      customerFacingFacts: result.customerFacingFacts,
      prohibitedClaims: result.prohibitedClaims,
    },
    state: input.state,
  });

  return {
    manifest,
    result,
  };
};
