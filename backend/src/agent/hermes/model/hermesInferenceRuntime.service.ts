export type HermesInferenceRuntimeMetrics = {
  totalDurationMs?: number;
  loadDurationMs?: number;
  promptEvalCount?: number;
  promptEvalDurationMs?: number;
  evalCount?: number;
  evalDurationMs?: number;
  queueWaitMs: number;
  coldStart: boolean;
  keepAliveApplied?: string | number;
  concurrentRequests: number;
  queueDepth?: number;
  activeInferenceCount?: number;
  maxConcurrent?: number;
  runtimeReason?: 'queue_unavailable' | 'queue_timeout';
};

let warmupStarted = false;
let lastWarmup: Record<string, unknown> | undefined;
const COLD_START_LOAD_THRESHOLD_MS = 1000;

const nsToMs = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed / 1_000_000) : undefined;
};

const numericEnv = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const ollamaBaseUrl = () => process.env.OLLAMA_URL?.replace(/\/+$/, '');
export const configuredOllamaModel = () =>
  process.env.HERMES_CONVERSATIONAL_OLLAMA_MODEL || process.env.OLLAMA_MODEL || 'llama3.2:1b';
export const configuredOllamaKeepAlive = () => process.env.HERMES_OLLAMA_KEEP_ALIVE || '30m';

const fetchWithTimeout = async (url: string, init: RequestInit, ms: number) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

export const runtimeMetricsFromOllamaPayload = (
  payload: any,
  input: {
    queueWaitMs: number;
    concurrentRequests: number;
    keepAliveApplied?: string | number;
    queueDepth?: number;
    activeInferenceCount?: number;
    maxConcurrent?: number;
    runtimeReason?: 'queue_unavailable' | 'queue_timeout';
  }
): HermesInferenceRuntimeMetrics => {
  const loadDurationMs = nsToMs(payload?.load_duration);
  return {
    totalDurationMs: nsToMs(payload?.total_duration),
    loadDurationMs,
    promptEvalCount: Number.isFinite(Number(payload?.prompt_eval_count)) ? Number(payload.prompt_eval_count) : undefined,
    promptEvalDurationMs: nsToMs(payload?.prompt_eval_duration),
    evalCount: Number.isFinite(Number(payload?.eval_count)) ? Number(payload.eval_count) : undefined,
    evalDurationMs: nsToMs(payload?.eval_duration),
    queueWaitMs: input.queueWaitMs,
    coldStart: Boolean(loadDurationMs && loadDurationMs >= COLD_START_LOAD_THRESHOLD_MS),
    keepAliveApplied: input.keepAliveApplied,
    concurrentRequests: input.concurrentRequests,
    queueDepth: input.queueDepth,
    activeInferenceCount: input.activeInferenceCount,
    maxConcurrent: input.maxConcurrent,
    runtimeReason: input.runtimeReason,
  };
};

export const queueRejectedRuntimeMetrics = (input: {
  reason: 'queue_unavailable' | 'queue_timeout';
  queueWaitMs: number;
  queueDepth: number;
  activeInferenceCount: number;
  maxConcurrent: number;
}): HermesInferenceRuntimeMetrics => ({
  queueWaitMs: input.queueWaitMs,
  coldStart: false,
  keepAliveApplied: configuredOllamaKeepAlive(),
  concurrentRequests: input.activeInferenceCount,
  queueDepth: input.queueDepth,
  activeInferenceCount: input.activeInferenceCount,
  maxConcurrent: input.maxConcurrent,
  runtimeReason: input.reason,
});

export const warmUpConfiguredModel = async (): Promise<void> => {
  if (warmupStarted || process.env.HERMES_OLLAMA_WARMUP_ENABLED === 'false') return;
  warmupStarted = true;
  const baseUrl = ollamaBaseUrl();
  const model = configuredOllamaModel();
  const keepAlive = configuredOllamaKeepAlive();
  if (!baseUrl) return;
  const timeoutMs = numericEnv(process.env.HERMES_OLLAMA_WARMUP_TIMEOUT_MS, 20000);
  const startedAt = Date.now();

  try {
    const response = await fetchWithTimeout(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: '',
        stream: false,
        keep_alive: keepAlive,
      }),
    }, timeoutMs);
    if (!response.ok) throw new Error(`OLLAMA_WARMUP_ERROR_${response.status}`);
    const payload: any = await response.json();
    const metrics = runtimeMetricsFromOllamaPayload(payload, {
      queueWaitMs: 0,
      concurrentRequests: 1,
      keepAliveApplied: keepAlive,
    });
    lastWarmup = {
      provider: 'ollama',
      model,
      durationMs: Date.now() - startedAt,
      loadDurationMs: metrics.loadDurationMs,
      keepAlive,
      outcome: 'ok',
    };
    console.log('[hermes-inference-runtime] warmup.completed', lastWarmup);
  } catch (error: any) {
    lastWarmup = {
      provider: 'ollama',
      model,
      durationMs: Date.now() - startedAt,
      keepAlive,
      outcome: 'failed',
      error: String(error?.message || error),
    };
    console.warn('[hermes-inference-runtime] warmup.failed', lastWarmup);
  }
};

export const getInferenceRuntimeSnapshot = () => ({
  warmupStarted,
  lastWarmup,
  provider: 'ollama',
  model: configuredOllamaModel(),
  keepAlive: configuredOllamaKeepAlive(),
});
