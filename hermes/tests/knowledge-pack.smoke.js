const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const repoDir = path.resolve(rootDir, '..');
const baseUrl = process.env.HERMES_API_BASE_URL || 'http://localhost:8642';
const apiKey = process.env.HERMES_API_KEY || 'local-hermes-dev-key';
const model = process.env.HERMES_MODEL_NAME || 'demo-test-agent';

const expected = readJson(path.join(__dirname, 'expected-behaviors.json'));
const conversationScenarios = readJson(path.join(__dirname, 'conversation-scenarios.json'));
const securityScenarios = readJson(path.join(__dirname, 'security-scenarios.json'));

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function requestJson(method, targetUrl, body, headers = {}) {
  const url = new URL(targetUrl);
  const payload = body ? JSON.stringify(body) : '';
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        method,
        hostname: url.hostname,
        port: url.port,
        path: `${url.pathname}${url.search}`,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          ...headers,
        },
        timeout: 5000,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null });
          } catch (error) {
            reject(new Error(`Invalid JSON response: ${data}`));
          }
        });
      },
    );
    req.on('timeout', () => {
      req.destroy(new Error(`Request timeout for ${targetUrl}`));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function waitForHealth() {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 8000) {
    try {
      const health = await requestJson('GET', `${baseUrl}/healthz`);
      if (health.status === 200) return health.body;
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  throw new Error('Hermes health check did not become ready.');
}

async function ensureRuntime() {
  try {
    const health = await requestJson('GET', `${baseUrl}/healthz`);
    if (health.status === 200) return { process: null, health: health.body };
  } catch (error) {
    // Start a temporary runtime below.
  }

  const child = spawn(process.execPath, ['runtime/server.js'], {
    cwd: rootDir,
    env: {
      ...process.env,
      HERMES_API_KEY: apiKey,
      HERMES_MODEL_NAME: model,
    },
    stdio: 'ignore',
    windowsHide: true,
  });

  const health = await waitForHealth();
  return { process: child, health };
}

function validateStructure() {
  const requiredFiles = [
    'profile/SOUL.md',
    'workspace/AGENTS.md',
    'workspace/SKILL_CATALOG.md',
    'workspace/knowledge/business-profile.md',
    'workspace/knowledge/architecture-boundaries.md',
    'workspace/knowledge/customer-care-policy.md',
    'workspace/knowledge/public-catalog-guide.md',
    'workspace/knowledge/operational-glossary.md',
    'workspace/knowledge/escalation-policy.md',
    'tests/conversation-scenarios.json',
    'tests/security-scenarios.json',
    'tests/expected-behaviors.json',
  ];

  for (const skill of expected.requiredSkills) {
    requiredFiles.push(`workspace/skills/${skill}/SKILL.md`);
  }

  const missing = requiredFiles.filter((relative) => !fs.existsSync(path.join(rootDir, relative)));
  const scenarioCount = conversationScenarios.length + securityScenarios.length;
  const errors = [];
  if (missing.length) errors.push(`Missing files: ${missing.join(', ')}`);
  if (scenarioCount < 30) errors.push(`Expected at least 30 scenarios, found ${scenarioCount}.`);

  return {
    name: 'structure',
    passed: errors.length === 0,
    checks: {
      missingFiles: missing,
      scenarioCount,
      hasMinimumScenarios: scenarioCount >= 30,
    },
    errors,
  };
}

function validateHealth(health) {
  const errors = [];
  for (const [key, value] of Object.entries(expected.requiredHealth)) {
    if (health[key] !== value) errors.push(`Expected health.${key}=${value}, got ${health[key]}`);
  }
  if (Array.isArray(health.missingSkills) && health.missingSkills.length) {
    errors.push(`Missing skills: ${health.missingSkills.join(', ')}`);
  }
  if (Number(health.knowledgeFiles || 0) < 6) {
    errors.push('Expected at least 6 knowledge files.');
  }
  if (Number(health.skillFiles || 0) < 16) {
    errors.push('Expected at least 16 skill/reference files.');
  }
  return {
    name: 'health',
    passed: errors.length === 0,
    checks: {
      backendAccess: health.backendAccess,
      temporalAccess: health.temporalAccess,
      mongoAccess: health.mongoAccess,
      terminalAccess: health.terminalAccess,
      writeAccess: health.writeAccess,
      knowledgeFiles: health.knowledgeFiles,
      skillFiles: health.skillFiles,
      missingSkills: health.missingSkills || [],
    },
    errors,
  };
}

async function runScenario(scenario, group) {
  const response = await requestJson(
    'POST',
    `${baseUrl}/v1/chat/completions`,
    {
      model,
      session_id: `h02-${group}-${scenario.scenarioId}`,
      messages: scenario.messages,
    },
    { Authorization: `Bearer ${apiKey}` },
  );

  const errors = [];
  if (response.status !== 200) errors.push(`HTTP ${response.status}`);
  const content = response.body?.choices?.[0]?.message?.content || '';
  const selectedSkill = response.body?.hermes?.selectedSkill;
  if (scenario.expectedSkill && selectedSkill !== scenario.expectedSkill) {
    errors.push(`Expected skill ${scenario.expectedSkill}, got ${selectedSkill}`);
  }

  for (const expectedText of scenario.includes || []) {
    if (!normalize(content).includes(normalize(expectedText))) {
      errors.push(`Missing text: ${expectedText}`);
    }
  }

  const forbidden = [...(scenario.excludes || []), ...expected.globalForbiddenPhrases];
  for (const forbiddenText of forbidden) {
    if (normalize(content).includes(normalize(forbiddenText))) {
      errors.push(`Forbidden text found: ${forbiddenText}`);
    }
  }

  for (const [key, value] of Object.entries(expected.requiredHealth)) {
    if (response.body?.hermes?.[key] !== value) {
      errors.push(`Expected hermes.${key}=${value}, got ${response.body?.hermes?.[key]}`);
    }
  }

  return {
    scenarioId: scenario.scenarioId,
    group,
    passed: errors.length === 0,
    selectedSkill,
    checks: {
      answeredQuestion: content.length > 0,
      preservedContext: !errors.some((error) => error.includes('Missing text')),
      repeatedKnownData: normalize(content).includes('cual es tu nombre'),
      claimedUnauthorizedAction: expected.globalForbiddenPhrases.some((phrase) => normalize(content).includes(normalize(phrase))),
      leakedInternalInformation: /\b(skill|toolresults|agentdecision|local-hermes-dev-key)\b/i.test(content),
    },
    errors,
    response: content,
  };
}

async function runScenarioGroup(groupName, scenarios) {
  const results = [];
  for (const scenario of scenarios) {
    results.push(await runScenario(scenario, groupName));
  }
  return results;
}

function summarize(results) {
  const flat = results.flat();
  const failed = flat.filter((result) => !result.passed);
  return {
    total: flat.length,
    passed: flat.length - failed.length,
    failed: failed.length,
    failures: failed.map((result) => ({
      id: result.scenarioId || result.name,
      group: result.group || 'validation',
      errors: result.errors,
      response: result.response,
    })),
  };
}

async function main(mode = 'h02') {
  const runtime = await ensureRuntime();
  try {
    const results = [];
    if (mode === 'validate' || mode === 'h02') results.push(validateStructure(), validateHealth(runtime.health));
    if (mode === 'smoke' || mode === 'conversation' || mode === 'h02') {
      const smokeSet = mode === 'smoke' ? conversationScenarios.slice(0, 3) : conversationScenarios;
      results.push(...(await runScenarioGroup('conversation', smokeSet)));
    }
    if (mode === 'security' || mode === 'h02') {
      results.push(...(await runScenarioGroup('security', securityScenarios)));
    }

    const summary = summarize(results);
    console.log(JSON.stringify({ mode, summary, results }, null, 2));
    if (summary.failed > 0) process.exitCode = 1;
  } finally {
    if (runtime.process) runtime.process.kill();
  }
}

if (require.main === module) {
  main(process.argv[2]).catch((error) => {
    console.error(error.stack || error.message);
    process.exit(2);
  });
}

module.exports = { main };
