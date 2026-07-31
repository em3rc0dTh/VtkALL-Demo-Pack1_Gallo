export type AgentProviderName = 'gemini' | 'ollama' | 'default' | 'hermes';

export type AgentActionName =
  | 'search_catalog'
  | 'get_offering_details'
  | 'start_schedule_consultation'
  | 'continue_schedule_consultation'
  | 'get_current_process_state';

export type AgentDecisionAction = {
  capability: AgentActionName;
  arguments: Record<string, unknown>;
};

export type AgentDecision = {
  reply?: string;
  intent?: {
    name: string;
    confidence: number;
  };
  actions?: AgentDecisionAction[];
  extractedData?: Record<string, unknown>;
};

export type AgentRuntimeResult = {
  provider: AgentProviderName;
  model?: string;
  message: string;
  workflowId?: string;
  state?: any;
  decision?: AgentDecision;
  toolResults?: Array<{
    capability: string;
    result: unknown;
  }>;
};
