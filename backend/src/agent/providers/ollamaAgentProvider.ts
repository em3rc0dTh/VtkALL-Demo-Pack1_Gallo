import { AgentModelProvider } from './agentModelProvider';
import { parseDecisionJson } from './jsonDecision';

const DEFAULT_OLLAMA_MODEL = 'llama3.2:1b';

const normalizeBaseUrl = (url: string) => url.replace(/\/+$/, '');

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

export class OllamaAgentProvider implements AgentModelProvider {
  readonly name = 'ollama' as const;

  async complete(input: Parameters<AgentModelProvider['complete']>[0]) {
    const ollamaUrl = process.env.OLLAMA_URL?.trim();
    if (!ollamaUrl) {
      console.warn('[agent-runtime] ollama.disabled OLLAMA_URL is not configured.');
      return undefined;
    }

    const model = process.env.OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL;
    const timeout = timeoutMs(process.env.OLLAMA_TIMEOUT_MS, 1200);
    console.log('[agent-runtime] ollama.request', {
      baseUrl: normalizeBaseUrl(ollamaUrl),
      model,
      timeoutMs: timeout,
    });
    const response = await fetchWithTimeout(`${normalizeBaseUrl(ollamaUrl)}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        format: 'json',
        options: { temperature: 0.2 },
        messages: buildMessages(input),
      }),
    }, timeout);

    if (!response.ok) throw new Error(`OLLAMA_PROVIDER_ERROR_${response.status}`);

    const payload: any = await response.json();
    const decision = parseDecisionJson(payload?.message?.content);
    if (!decision) {
      console.warn('[agent-runtime] ollama.no_decision_json', {
        contentPreview: String(payload?.message?.content || '').slice(0, 180),
      });
    }
    return decision ? { provider: this.name, model, decision } : undefined;
  }
}
