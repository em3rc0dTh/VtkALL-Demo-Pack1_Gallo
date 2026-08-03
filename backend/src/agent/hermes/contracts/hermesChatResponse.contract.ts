export interface HermesCompletionResult {
  reply: string;
  model?: string;
  finishReason?: string;
  durationMs: number;
  runtime: {
    agent: string;
    version: string;
    mode: string;
  };
}

export const parseHermesCompletion = (value: unknown): HermesCompletionResult | undefined => {
  const body = value as any;
  const choice = body?.choices?.[0];
  const reply = choice?.message?.content;
  if (typeof reply !== 'string' || !reply.trim() || reply.length > 12000) return undefined;
  const access = body?.hermes?.access;
  if (access && (access.backend !== false || access.temporal !== false || access.mongo !== false || access.terminal !== false || access.write !== false)) {
    return undefined;
  }
  return {
    reply,
    model: typeof body?.model === 'string' ? body.model : undefined,
    finishReason: typeof choice?.finish_reason === 'string' ? choice.finish_reason : undefined,
    durationMs: typeof body?.hermes?.durationMs === 'number' ? body.hermes.durationMs : 0,
    runtime: {
      agent: typeof body?.hermes?.agent === 'string' ? body.hermes.agent : 'demo-test-agent',
      version: typeof body?.hermes?.version === 'string' ? body.hermes.version : 'unknown',
      mode: typeof body?.hermes?.mode === 'string' ? body.hermes.mode : 'unknown',
    },
  };
};
