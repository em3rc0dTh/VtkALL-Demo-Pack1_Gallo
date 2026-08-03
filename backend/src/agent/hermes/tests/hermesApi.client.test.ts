import assert from 'assert';
import http from 'http';
import { HttpHermesApiClient } from '../clients/hermesApi.client';
import { HermesGatewayError } from '../contracts/hermesError.contract';
import { mapRoleSeparatedHistory, toHermesCompletionRequest } from '../mappers/hermesConversation.mapper';
import { createHermesApiClient, getHermesConfig } from '../services/hermesGateway.service';

const apiKey = 'test-hermes-key';

const startServer = (handler: http.RequestListener) => new Promise<{ server: http.Server; url: string }>((resolve) => {
  const server = http.createServer(handler);
  server.listen(0, '127.0.0.1', () => {
    const address = server.address();
    assert(address && typeof address === 'object');
    resolve({ server, url: `http://127.0.0.1:${address.port}` });
  });
});

const closeServer = (server: http.Server) => new Promise<void>((resolve) => server.close(() => resolve()));

const readBody = (req: http.IncomingMessage) => new Promise<string>((resolve) => {
  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', () => resolve(body));
});

const assertRejectCode = async (fn: () => Promise<unknown>, code: string) => {
  let error: unknown;
  try {
    await fn();
  } catch (caught) {
    error = caught;
  }
  assert(error instanceof HermesGatewayError, `expected HermesGatewayError for ${code}`);
  assert.equal((error as HermesGatewayError).code, code);
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

  await test('mapper preserves role-separated history', () => {
    const mapped = mapRoleSeparatedHistory([
      { role: 'customer', body: 'Quiero reservar una consulta.' },
      { role: 'agent', body: 'Claro. Que servicio te interesa?' },
      { role: 'user', content: 'Antes, cuanto dura?' },
    ]);
    assert.deepEqual(mapped, [
      { role: 'user', content: 'Quiero reservar una consulta.' },
      { role: 'assistant', content: 'Claro. Que servicio te interesa?' },
      { role: 'user', content: 'Antes, cuanto dura?' },
    ]);
    assert(!JSON.stringify(mapped).includes('Recent conversation'));
  });

  await test('request body excludes sensitive fields', () => {
    const body = toHermesCompletionRequest({
      businessSlug: 'demo_test',
      conversationId: 'conv_1',
      mode: 'shadow',
      messages: [{ role: 'user', content: 'Hola' }],
      context: { agentName: 'Iris', channel: 'web_agent' },
    }, 'demo-test-agent');
    const serialized = JSON.stringify(body);
    assert(!serialized.includes('phone'));
    assert(!serialized.includes('email'));
    assert(!serialized.includes('workflow'));
  });

  await test('health and chat success with correlation propagation', async () => {
    let receivedCorrelation = '';
    const { server, url } = await startServer(async (req, res) => {
      receivedCorrelation = String(req.headers['x-correlation-id'] || '');
      if (req.url === '/healthz') {
        res.end(JSON.stringify({
          ok: true,
          service: 'demo-test-hermes',
          version: 'h03',
          agent: 'demo-test-agent',
          mode: 'knowledge-only',
          knowledgeFiles: 6,
          skillFiles: 16,
          missingSkills: [],
          access: { backend: false, temporal: false, mongo: false, terminal: false, write: false },
        }));
        return;
      }
      assert.equal(req.headers.authorization, `Bearer ${apiKey}`);
      await readBody(req);
      res.end(JSON.stringify({
        model: 'demo-test-agent',
        choices: [{ message: { content: 'Hola desde Hermes' }, finish_reason: 'stop' }],
        hermes: { agent: 'demo-test-agent', version: 'h03', mode: 'knowledge-only', durationMs: 12, access: { backend: false, temporal: false, mongo: false, terminal: false, write: false } },
      }));
    });
    try {
      const client = new HttpHermesApiClient({ baseUrl: url, apiKey, model: 'demo-test-agent', timeoutMs: 1000 });
      const health = await client.getHealth({ correlationId: 'corr_123' });
      assert.equal(health.version, 'h03');
      const completion = await client.complete({
        businessSlug: 'demo_test',
        conversationId: 'conv_1',
        mode: 'shadow',
        messages: [{ role: 'user', content: 'Hola' }],
        context: { channel: 'web_agent' },
      }, { correlationId: 'corr_456' });
      assert.equal(completion.reply, 'Hola desde Hermes');
      assert.equal(completion.runtime.version, 'h03');
      assert.equal(receivedCorrelation, 'corr_456');
    } finally {
      await closeServer(server);
    }
  });

  for (const [status, code] of [[401, 'HERMES_UNAUTHORIZED'], [403, 'HERMES_UNAUTHORIZED'], [404, 'HERMES_PROVIDER_ERROR'], [500, 'HERMES_PROVIDER_ERROR']] as const) {
    await test(`status ${status} maps ${code}`, async () => {
      const { server, url } = await startServer((_req, res) => {
        res.statusCode = status;
        res.end(JSON.stringify({ ok: false }));
      });
      try {
        const client = new HttpHermesApiClient({ baseUrl: url, apiKey, model: 'demo-test-agent', timeoutMs: 1000 });
        await assertRejectCode(() => client.complete({
          businessSlug: 'demo_test',
          conversationId: 'conv_1',
          mode: 'shadow',
          messages: [{ role: 'user', content: 'Hola' }],
          context: {},
        }, { correlationId: 'corr' }), code);
      } finally {
        await closeServer(server);
      }
    });
  }

  await test('timeout maps HERMES_TIMEOUT', async () => {
    const { server, url } = await startServer((_req, _res) => undefined);
    try {
      const client = new HttpHermesApiClient({ baseUrl: url, apiKey, model: 'demo-test-agent', timeoutMs: 50 });
      await assertRejectCode(() => client.getHealth({ correlationId: 'corr' }), 'HERMES_TIMEOUT');
    } finally {
      await closeServer(server);
    }
  });

  await test('connection refused maps unavailable', async () => {
    const client = new HttpHermesApiClient({ baseUrl: 'http://127.0.0.1:9', apiKey, model: 'demo-test-agent', timeoutMs: 100 });
    await assertRejectCode(() => client.getHealth({ correlationId: 'corr' }), 'HERMES_UNAVAILABLE');
  });

  await test('malformed JSON maps invalid response', async () => {
    const { server, url } = await startServer((_req, res) => res.end('{bad'));
    try {
      const client = new HttpHermesApiClient({ baseUrl: url, apiKey, model: 'demo-test-agent', timeoutMs: 1000 });
      await assertRejectCode(() => client.getHealth({ correlationId: 'corr' }), 'HERMES_INVALID_RESPONSE');
    } finally {
      await closeServer(server);
    }
  });

  await test('empty reply maps invalid response', async () => {
    const { server, url } = await startServer((_req, res) => res.end(JSON.stringify({ choices: [{ message: { content: '' } }] })));
    try {
      const client = new HttpHermesApiClient({ baseUrl: url, apiKey, model: 'demo-test-agent', timeoutMs: 1000 });
      await assertRejectCode(() => client.complete({
        businessSlug: 'demo_test',
        conversationId: 'conv_1',
        mode: 'shadow',
        messages: [{ role: 'user', content: 'Hola' }],
        context: {},
      }, { correlationId: 'corr' }), 'HERMES_INVALID_RESPONSE');
    } finally {
      await closeServer(server);
    }
  });

  await test('disabled flag does not instantiate client', () => {
    const previous = process.env.HERMES_ENABLED;
    process.env.HERMES_ENABLED = 'false';
    assert.equal(createHermesApiClient(), undefined);
    process.env.HERMES_ENABLED = previous;
  });

  await test('enabled without key fails config', () => {
    const previousEnabled = process.env.HERMES_ENABLED;
    const previousKey = process.env.HERMES_API_KEY;
    process.env.HERMES_ENABLED = 'true';
    process.env.HERMES_API_KEY = '';
    assert.throws(() => createHermesApiClient(), /API key/);
    process.env.HERMES_ENABLED = previousEnabled;
    process.env.HERMES_API_KEY = previousKey;
  });

  await test('sample percent clamps through config', () => {
    const previous = process.env.HERMES_SHADOW_SAMPLE_PERCENT;
    process.env.HERMES_SHADOW_SAMPLE_PERCENT = '101';
    assert.equal(getHermesConfig().shadowSamplePercent, 100);
    process.env.HERMES_SHADOW_SAMPLE_PERCENT = previous;
  });

  const failed = results.filter((result) => !result.passed);
  console.log(JSON.stringify({ total: results.length, passed: results.length - failed.length, failed: failed.length, results }, null, 2));
  if (failed.length) process.exit(1);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
