const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const stateDir = path.join(rootDir, '.runtime');
const pidFile = path.join(stateDir, 'hermes.pid');
const baseUrl = process.env.HERMES_API_BASE_URL || 'http://127.0.0.1:8642';
const apiKey = process.env.HERMES_API_KEY || 'local-hermes-dev-key';

function ensureStateDir() {
  fs.mkdirSync(stateDir, { recursive: true });
}

function isRunning(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readPid() {
  try {
    return Number(fs.readFileSync(pidFile, 'utf8').trim());
  } catch {
    return 0;
  }
}

function request(method, targetUrl, body, headers = {}) {
  const url = new URL(targetUrl);
  const payload = body ? JSON.stringify(body) : '';
  return new Promise((resolve, reject) => {
    const req = http.request({
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        ...headers,
      },
      timeout: 5000,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function health() {
  const response = await request('GET', `${baseUrl}/healthz`);
  console.log(response.body);
  if (response.status !== 200) process.exitCode = 1;
}

async function start() {
  ensureStateDir();
  const pid = readPid();
  if (isRunning(pid)) {
    console.log(`Hermes already running pid=${pid}`);
    return;
  }
  try {
    const response = await request('GET', `${baseUrl}/healthz`);
    if (response.status === 200) {
      console.error('Hermes port is already occupied by a responsive service; refusing duplicate start without pid ownership.');
      process.exit(1);
    }
  } catch {
    // Port is free or service is down.
  }

  const child = spawn(process.execPath, ['runtime/server.js'], {
    cwd: rootDir,
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
    env: {
      ...process.env,
      HERMES_HOST: process.env.HERMES_HOST || '127.0.0.1',
      HERMES_PORT: process.env.HERMES_PORT || '8642',
      HERMES_API_KEY: apiKey,
      HERMES_MODEL_NAME: process.env.HERMES_MODEL_NAME || 'demo-test-agent',
    },
  });
  child.unref();
  fs.writeFileSync(pidFile, String(child.pid));
  console.log(`Hermes started pid=${child.pid}`);
}

async function stop() {
  const pid = readPid();
  if (!pid || !isRunning(pid)) {
    try { fs.unlinkSync(pidFile); } catch {}
    console.log('Hermes not running by pid file.');
    return;
  }
  process.kill(pid, 'SIGTERM');
  const started = Date.now();
  while (Date.now() - started < 5000) {
    if (!isRunning(pid)) break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (isRunning(pid)) {
    console.error(`Hermes pid=${pid} did not stop cleanly.`);
    process.exit(1);
  }
  try { fs.unlinkSync(pidFile); } catch {}
  console.log(`Hermes stopped pid=${pid}`);
}

async function smoke() {
  const healthResponse = await request('GET', `${baseUrl}/healthz`);
  if (healthResponse.status !== 200) throw new Error(`health failed: ${healthResponse.status}`);
  const chat = await request('POST', `${baseUrl}/v1/chat/completions`, {
    model: 'demo-test-agent',
    messages: [{ role: 'user', content: 'Hola, quien eres?' }],
  }, { Authorization: `Bearer ${apiKey}`, 'X-Correlation-Id': 'corr_smoke' });
  if (chat.status !== 200) throw new Error(`chat failed: ${chat.status} ${chat.body}`);
  console.log('hermes smoke: PASS');
}

async function main() {
  const command = process.argv[2];
  if (command === 'start') return start();
  if (command === 'stop') return stop();
  if (command === 'restart') {
    await stop();
    return start();
  }
  if (command === 'health') return health();
  if (command === 'smoke') return smoke();
  console.error('Usage: node scripts/runtime-control.js <start|stop|restart|health|smoke>');
  process.exit(2);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
