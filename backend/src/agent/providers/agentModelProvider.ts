import { AgentContext } from '../context/agentContext';
import { AgentDecision, AgentProviderName } from '../runtime/agentDecision';

export type AgentCompletionInput = {
  context: AgentContext;
  userMessage: string;
  systemPrompt: string;
};

export type AgentModelResponse = {
  provider: AgentProviderName;
  model?: string;
  decision: AgentDecision;
};

export interface AgentModelProvider {
  readonly name: AgentProviderName;
  complete(input: AgentCompletionInput): Promise<AgentModelResponse | undefined>;
}
