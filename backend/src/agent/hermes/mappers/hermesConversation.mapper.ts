import { HermesCompletionInput, HermesCompletionRequestBody } from '../contracts/hermesChatRequest.contract';

export const toHermesCompletionRequest = (input: HermesCompletionInput, model: string): HermesCompletionRequestBody => {
  return {
    model,
    session_id: `${input.businessSlug}:${input.conversationId}`,
    messages: input.messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
    metadata: {
      businessSlug: input.businessSlug,
      conversationId: input.conversationId,
      mode: input.mode,
      agentName: input.context.agentName,
      channel: input.context.channel,
    },
  };
};

export const mapRoleSeparatedHistory = (
  history: Array<{ role: 'system' | 'user' | 'assistant' | 'customer' | 'agent'; content?: string; body?: string; message?: string }>
) => {
  return history
    .map((item) => {
      const role = item.role === 'customer' ? 'user' : item.role === 'agent' ? 'assistant' : item.role;
      const content = item.content ?? item.body ?? item.message ?? '';
      return role === 'system' || role === 'user' || role === 'assistant' ? { role, content: String(content) } : undefined;
    })
    .filter((item): item is { role: 'system' | 'user' | 'assistant'; content: string } => Boolean(item && item.content.trim()));
};
