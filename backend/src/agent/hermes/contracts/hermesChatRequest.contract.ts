export interface HermesCompletionInput {
  businessSlug: string;
  conversationId: string;
  mode: 'shadow' | 'qa_primary';
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  context: {
    agentName?: string;
    channel?: string;
  };
}

export interface HermesCompletionRequestBody {
  model: string;
  session_id: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  metadata: {
    businessSlug: string;
    conversationId: string;
    mode: 'shadow' | 'qa_primary';
    agentName?: string;
    channel?: string;
  };
}
