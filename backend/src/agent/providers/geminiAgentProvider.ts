import { AgentModelProvider } from './agentModelProvider';
import { parseDecisionJson } from './jsonDecision';

const GEMINI_OPENAI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai';
const MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-1.5-flash-8b',
];

const timeoutMs = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const fetchWithTimeout = async (url: string, init: RequestInit, ms: number) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

const getApiKey = () => {
  const key = (process.env.GEMINI_API_KEY || process.env.GCP_API_KEY || '').trim();
  if (!key || ['YOUR_GEMINI_API_KEY', 'YOUR_GCP_API_KEY'].includes(key)) return undefined;
  return key;
};

const buildMessages = (input: Parameters<AgentModelProvider['complete']>[0]) => {
  const history = (input.context.conversation.recentMessages || []).map((message) => ({
    role: message.role,
    content: message.content,
  }));
  const last = history[history.length - 1];
  const hasCurrentUserMessage = last?.role === 'user' && String(last.content || '').trim() === String(input.userMessage || '').trim();

  return [
    { role: 'system', content: input.systemPrompt },
    ...history,
    ...(hasCurrentUserMessage ? [] : [{ role: 'user' as const, content: input.userMessage }]),
  ];
};

export class GeminiAgentProvider implements AgentModelProvider {
  readonly name = 'gemini' as const;

  async complete(input: Parameters<AgentModelProvider['complete']>[0]) {
    const apiKey = getApiKey();
    if (!apiKey) return undefined;

    let lastError: unknown;
    for (const model of MODELS) {
      try {
        const response = await fetchWithTimeout(`${GEMINI_OPENAI_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            temperature: 0.25,
            response_format: { type: 'json_object' },
            messages: buildMessages(input),
          }),
        }, timeoutMs(process.env.GEMINI_TIMEOUT_MS, 4000));

        if (!response.ok) {
          throw new Error(`GEMINI_PROVIDER_ERROR_${response.status}`);
        }

        const payload: any = await response.json();
        const text = payload?.choices?.[0]?.message?.content;
        const decision = parseDecisionJson(text);
        if (decision) return { provider: this.name, model, decision };
      } catch (error) {
        lastError = error;
      }
    }

    if (lastError) {
      console.warn('[agent-runtime] Gemini unavailable.', lastError);
    }
    return undefined;
  }
}
