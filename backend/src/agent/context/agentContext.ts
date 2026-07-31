import { AgentProcessContext } from '../../mcp/temporal/schemas/agentProcessContext';

export type ConversationContext = {
  conversationId: string;
  businessSlug: string;
  channel: string;
  customerIdentity?: {
    customerId?: string;
    knownName?: string;
    knownPhone?: string;
    identityStatus: 'anonymous' | 'partially_identified' | 'identified';
  };
  recentMessages: Array<{
    role: 'user' | 'assistant';
    content: string;
    createdAt: string;
  }>;
  summary?: string;
};

export type AgentBusinessContext = {
  businessSlug: string;
  business: {
    name: string;
    description?: string;
    timezone: string;
  };
  agent: {
    name: string;
    role: string;
    personality?: string;
  };
  capabilities: string[];
  catalogSummary?: Array<{
    id: string;
    name: string;
    description?: string;
    priceLabel?: string;
    durationMinutes?: number;
  }>;
};

export type AgentContext = {
  conversation: ConversationContext;
  business: AgentBusinessContext;
  process?: AgentProcessContext;
};
