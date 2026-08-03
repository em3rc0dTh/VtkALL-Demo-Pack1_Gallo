import { agentCapabilityGateway } from '../capabilities/agentCapabilityGateway';
import { AgentContext } from './agentContext';

export const buildAgentContext = async (input: {
  businessSlug: string;
  conversationId?: string;
  workflowId?: string;
  channel?: string;
}): Promise<AgentContext> => {
  const conversationId = input.conversationId || input.workflowId;
  const activeWorkflowId = input.workflowId || (conversationId
    ? await agentCapabilityGateway.resolveActiveProcess({ businessSlug: input.businessSlug, conversationId })
    : undefined);
  const normalizedInput = {
    ...input,
    conversationId,
    workflowId: activeWorkflowId,
  };
  const business = await agentCapabilityGateway.getBusinessContext(input.businessSlug);
  const conversation = await agentCapabilityGateway.getConversationContext(normalizedInput);
  const process = await agentCapabilityGateway.getProcessContext({ workflowId: activeWorkflowId });

  return {
    business,
    conversation,
    process,
  };
};
