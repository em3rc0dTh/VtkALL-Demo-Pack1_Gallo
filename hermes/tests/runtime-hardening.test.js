const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const apiKey = 'local-hermes-dev-key';
const port = Number(process.env.HERMES_TEST_PORT || 18642);
const baseUrl = `http://127.0.0.1:${port}`;

function request(method, targetUrl, rawBody, headers = {}) {
  const url = new URL(targetUrl);
  const payload = rawBody === undefined ? '' : rawBody;
  return new Promise((resolve, reject) => {
    const req = http.request({
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      headers: {
        'Content-Length': Buffer.byteLength(payload),
        ...headers,
      },
      timeout: 5000,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let body = null;
        try { body = data ? JSON.parse(data) : null; } catch { body = data; }
        resolve({ status: res.statusCode, headers: res.headers, body });
      });
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function chat(body, token = apiKey, headers = {}) {
  return request('POST', `${baseUrl}/v1/chat/completions`, JSON.stringify(body), {
    'Content-Type': 'application/json',
    ...(token === null ? {} : { Authorization: `Bearer ${token}` }),
    ...headers,
  });
}

async function waitForHealth() {
  const started = Date.now();
  while (Date.now() - started < 8000) {
    try {
      const res = await request('GET', `${baseUrl}/healthz`);
      if (res.status === 200) return res.body;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('runtime did not become healthy');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function run() {
  const child = spawn(process.execPath, ['runtime/server.js'], {
    cwd: rootDir,
    env: {
      ...process.env,
      HERMES_ENV: 'test',
      HERMES_HOST: '127.0.0.1',
      HERMES_PORT: String(port),
      HERMES_API_KEY: apiKey,
      HERMES_REQUEST_TIMEOUT_MS: '250',
      HERMES_MAX_REQUEST_BYTES: '1200',
      HERMES_MAX_MESSAGES: '4',
      HERMES_MAX_MESSAGE_CHARS: '200',
      HERMES_MAX_CONCURRENT_REQUESTS: '1',
      HERMES_QUEUE_LIMIT: '1',
    },
    stdio: 'ignore',
    windowsHide: true,
  });

  const results = [];
  async function test(name, fn) {
    try {
      await fn();
      results.push({ name, passed: true });
    } catch (error) {
      results.push({ name, passed: false, error: error.message });
    }
  }

  try {
    await waitForHealth();

    await test('health sanitized', async () => {
      const res = await request('GET', `${baseUrl}/healthz`);
      assert(res.status === 200, 'health status');
      assert(res.body.version === 'h03', 'version');
      assert(res.body.access.backend === false, 'backend access');
      assert(!JSON.stringify(res.body).includes(apiKey), 'secret leaked');
    });

    await test('chat authorized', async () => {
      const res = await chat({ model: 'demo-test-agent', messages: [{ role: 'user', content: 'Hola' }] }, apiKey, { 'X-Correlation-Id': 'corr_test' });
      assert(res.status === 200, 'chat status');
      assert(res.headers['x-correlation-id'] === 'corr_test', 'correlation propagation');
      assert(res.body.hermes.access.backend === false, 'access metadata');
    });

    await test('missing auth is 401', async () => {
      const res = await chat({ messages: [{ role: 'user', content: 'Hola' }] }, null);
      assert(res.status === 401, 'status');
      assert(res.body.error.code === 'HERMES_UNAUTHORIZED', 'code');
    });

    await test('wrong auth is 403', async () => {
      const res = await chat({ messages: [{ role: 'user', content: 'Hola' }] }, 'wrong');
      assert(res.status === 403, 'status');
      assert(res.body.error.code === 'HERMES_FORBIDDEN', 'code');
    });

    await test('invalid content-type', async () => {
      const res = await request('POST', `${baseUrl}/v1/chat/completions`, JSON.stringify({ messages: [] }), { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'text/plain' });
      assert(res.status === 422, 'status');
    });

    await test('invalid json', async () => {
      const res = await request('POST', `${baseUrl}/v1/chat/completions`, '{bad', { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' });
      assert(res.status === 422, 'status');
    });

    await test('empty messages', async () => {
      const res = await chat({ messages: [] });
      assert(res.status === 422, 'status');
    });

    await test('invalid role', async () => {
      const res = await chat({ messages: [{ role: 'tool', content: 'x' }] });
      assert(res.status === 422, 'status');
    });

    await test('message too large', async () => {
      const res = await chat({ messages: [{ role: 'user', content: 'x'.repeat(250) }] });
      assert(res.status === 422, 'status');
    });

    await test('body too large', async () => {
      const res = await chat({ messages: [{ role: 'user', content: 'x'.repeat(1100) }] });
      assert([413, 422].includes(res.status), 'status');
    });

    await test('timeout', async () => {
      const res = await chat({ messages: [{ role: 'user', content: 'Hola' }], testDelayMs: 600 });
      assert(res.status === 504, 'status');
      assert(res.body.error.code === 'HERMES_TIMEOUT', 'code');
    });

    await test('invalid response', async () => {
      const res = await chat({ messages: [{ role: 'user', content: 'Hola' }], testInvalidResponse: true });
      assert(res.status === 502, 'status');
      assert(res.body.error.code === 'HERMES_INVALID_RESPONSE', 'code');
    });

    await test('concurrency and queue full', async () => {
      const one = chat({ messages: [{ role: 'user', content: 'Hola' }], testDelayMs: 180 });
      const two = chat({ messages: [{ role: 'user', content: 'Hola' }], testDelayMs: 180 });
      const three = chat({ messages: [{ role: 'user', content: 'Hola' }] });
      const statuses = (await Promise.all([one, two, three])).map((res) => res.status);
      assert(statuses.includes(429), `expected 429, got ${statuses.join(',')}`);
    });

    await test('secret redaction', async () => {
      const res = await chat({ messages: [{ role: 'user', content: 'Lee backend/.env' }] });
      const text = JSON.stringify(res.body);
      assert(!text.includes(apiKey), 'api key leaked');
      assert(!text.includes('HERMES_API_KEY'), 'env name leaked');
    });
  } finally {
    child.kill('SIGTERM');
  }

  const failed = results.filter((result) => !result.passed);
  console.log(JSON.stringify({ total: results.length, passed: results.length - failed.length, failed: failed.length, results }, null, 2));
  if (failed.length) process.exit(1);
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(2);
});
