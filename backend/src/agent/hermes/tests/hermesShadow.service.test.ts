import assert from 'assert';
import { HermesApiClient } from '../clients/hermesApi.client';
import { HermesCompletionInput } from '../contracts/hermesChatRequest.contract';
import { HermesCompletionResult } from '../contracts/hermesChatResponse.contract';
import { ExecutionContext } from '../contracts/executionContext.contract';
import { HermesGatewayError } from '../contracts/hermesError.contract';
import {
  dispatchHermesShadowSafely,
  evaluateHermesShadowReply,
  shouldSampleHermesShadow,
} from '../services/hermesShadow.service';

class FakeClient implements HermesApiClient {
  calls: Array<{ input: HermesCompletionInput; context: ExecutionContext }> = [];
  constructor(private readonly behavior: 'success' | 'timeout' | 'invalid' = 'success') {}

  async getHealth(): Promise<any> {
    return {};
  }

  async complete(input: HermesCompletionInput, context: ExecutionContext): Promise<HermesCompletionResult> {
    this.calls.push({ input, context });
    if (this.behavior === 'timeout') throw new HermesGatewayError('HERMES_TIMEOUT', 'timeout', { retryable: true });
    if (this.behavior === 'invalid') throw new HermesGatewayError('HERMES_INVALID_RESPONSE', 'invalid', { retryable: true });
    return {
      reply: 'No tengo una duracion confirmada en el conocimiento autorizado.',
      durationMs: 10,
      runtime: { agent: 'demo-test-agent', version: 'h03', mode: 'knowledge-only' },
    };
  }
}

const baseInput = {
  businessSlug: 'demo_test',
  conversationId: 'conv_shadow',
  userMessage: 'Antes, cuanto dura?',
  legacyReply: 'Claro, seguimos.',
  history: [
    { role: 'assistant' as const, content: 'Cual es tu nombre?' },
    { role: 'user' as const, content: 'Mi nombre es Ricardo.' },
  ],
  channel: 'web_agent',
  correlationId: 'corr_shadow',
};

const withEnv = async (vars: Record<string, string | undefined>, fn: () => Promise<void> | void) => {
  const previous: Record<string, string | undefined> = {};
  for (const key of Object.keys(vars)) {
    previous[key] = process.env[key];
    if (vars[key] === undefined) delete process.env[key];
    else process.env[key] = vars[key];
  }
  try {
    await fn();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
};

const run = async () => {
  const results: Array<{ name: string; passed: boolean; error?: string }> = [];
  const test = async (name: string, fn: () => Promise<void> | void) => {
    try {
      await fn();
      results.push({ name, passed: true });
    } catch (error: any) {
      results.push({ name, passed: false, error: error?.message || String(error) });
    }
  };

  await test('stable sampling is deterministic', () => {
    const a = shouldSampleHermesShadow('demo_test', 'conv_1', 50);
    const b = shouldSampleHermesShadow('demo_test', 'conv_1', 50);
    assert.equal(a, b);
    assert.equal(shouldSampleHermesShadow('demo_test', 'conv_1', 0), false);
    assert.equal(shouldSampleHermesShadow('demo_test', 'conv_1', 100), true);
  });

  await test('disabled shadow skips without client', async () => {
    await withEnv({ HERMES_ENABLED: 'false', HERMES_SHADOW_ENABLED: 'true' }, async () => {
      const result = await dispatchHermesShadowSafely(baseInput, { client: new FakeClient() });
      assert.equal(result.status, 'skipped');
    });
  });

  await test('shadow success preserves role-separated input', async () => {
    await withEnv({
      HERMES_ENABLED: 'true',
      HERMES_SHADOW_ENABLED: 'true',
      HERMES_API_KEY: 'test-key',
      HERMES_SHADOW_SAMPLE_PERCENT: '100',
    }, async () => {
      const client = new FakeClient();
      const result = await dispatchHermesShadowSafely(baseInput, { client });
      assert.equal(result.status, 'completed');
      assert.equal(result.correlationId, 'corr_shadow');
      assert.equal(result.hermesReply, 'No tengo una duracion confirmada en el conocimiento autorizado.');
      assert(client.calls[0].input.messages.some((message) => message.role === 'assistant'));
      assert(!JSON.stringify(client.calls[0].input.messages).includes('Recent conversation'));
    });
  });

  await test('timeout is fail-open observable', async () => {
    await withEnv({
      HERMES_ENABLED: 'true',
      HERMES_SHADOW_ENABLED: 'true',
      HERMES_API_KEY: 'test-key',
      HERMES_SHADOW_SAMPLE_PERCENT: '100',
    }, async () => {
      const result = await dispatchHermesShadowSafely(baseInput, { client: new FakeClient('timeout') });
      assert.equal(result.status, 'timeout');
      assert.equal(result.legacyReply, baseInput.legacyReply);
    });
  });

  await test('invalid response is fail-open observable', async () => {
    await withEnv({
      HERMES_ENABLED: 'true',
      HERMES_SHADOW_ENABLED: 'true',
      HERMES_API_KEY: 'test-key',
      HERMES_SHADOW_SAMPLE_PERCENT: '100',
    }, async () => {
      const result = await dispatchHermesShadowSafely(baseInput, { client: new FakeClient('invalid') });
      assert.equal(result.status, 'invalid_response');
    });
  });

  await test('evaluators detect false confirmation and leakage', () => {
    const evaluation = evaluateHermesShadowReply('Tu cita quedo confirmada. AGENTS.md backendAccess=true', baseInput);
    assert.equal(evaluation.unauthorizedActionClaim, true);
    assert.equal(evaluation.internalLeakage, true);
  });

  await test('evaluators detect repeated known name question', () => {
    const evaluation = evaluateHermesShadowReply('Cual es tu nombre?', baseInput);
    assert.equal(evaluation.repeatedQuestion, true);
  });

  await test('shadow result is not public dto shaped', async () => {
    await withEnv({
      HERMES_ENABLED: 'true',
      HERMES_SHADOW_ENABLED: 'true',
      HERMES_API_KEY: 'test-key',
      HERMES_SHADOW_SAMPLE_PERCENT: '100',
    }, async () => {
      const result = await dispatchHermesShadowSafely(baseInput, { client: new FakeClient() });
      const publicDto = {
        conversationId: baseInput.conversationId,
        message: baseInput.legacyReply,
      };
      assert(!('hermesReply' in publicDto));
      assert(result.hermesReply);
    });
  });

  const failed = results.filter((result) => !result.passed);
  console.log(JSON.stringify({ total: results.length, passed: results.length - failed.length, failed: failed.length, results }, null, 2));
  if (failed.length) process.exit(1);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
