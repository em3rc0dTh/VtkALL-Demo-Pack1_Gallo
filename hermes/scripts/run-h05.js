const { spawnSync } = require('child_process');
const path = require('path');

const repoRoot = path.resolve(__dirname, '../..');
const backendDir = path.join(repoRoot, 'backend');
const hermesDir = path.join(repoRoot, 'hermes');
const frontendDir = path.join(repoRoot, 'frontend');

function run(label, command, args, cwd) {
  console.log(`\n== ${label} ==`);
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      HERMES_API_KEY: process.env.HERMES_API_KEY || 'local-hermes-dev-key',
      HERMES_MODEL_NAME: process.env.HERMES_MODEL_NAME || 'demo-test-agent',
    },
  });
  if (result.status !== 0) {
    console.error(`${label}: FAIL`);
    process.exit(result.status || 1);
  }
  console.log(`${label}: PASS`);
}

const mode = process.argv[2] || 'h05';

if (mode === 'routing') {
  run('HERMES-05A routing', 'npm', ['run', 'hermes:h05:routing'], backendDir);
} else if (mode === 'visible') {
  run('HERMES-05B visible Q&A', 'npm', ['run', 'hermes:h05:visible'], backendDir);
} else if (mode === 'fallback') {
  run('HERMES-05C fallback', 'npm', ['run', 'hermes:h05:fallback'], backendDir);
} else if (mode === 'e2e') {
  run('HERMES-05D e2e', 'npm', ['run', 'hermes:h05:e2e'], backendDir);
} else {
  run('HERMES-04A Mongo readiness', 'npm', ['run', 'hermes:h04:mongo-readiness'], backendDir);
  run('HERMES-02 regression', 'npm', ['run', 'hermes:h02'], hermesDir);
  run('HERMES-03 regression', 'npm', ['run', 'hermes:h03'], hermesDir);
  run('HERMES-04 regression', 'npm', ['run', 'hermes:h04'], hermesDir);
  run('HERMES-05A routing', 'npm', ['run', 'hermes:h05:routing'], backendDir);
  run('HERMES-05B visible Q&A', 'npm', ['run', 'hermes:h05:visible'], backendDir);
  run('HERMES-05C fallback', 'npm', ['run', 'hermes:h05:fallback'], backendDir);
  run('HERMES-05D e2e', 'npm', ['run', 'hermes:h05:e2e'], backendDir);
  run('Backend guardrails', 'npm', ['run', 'test:demo-test:guardrails'], backendDir);
  run('Backend build', 'npm', ['run', 'build'], backendDir);
  run('Legacy agent tests', 'npm', ['run', 'test:demo-test:agent-mcp'], backendDir);
  run('Frontend build', 'npm', ['run', 'build'], frontendDir);
  run('Frontend lint quiet', 'npm', ['run', 'lint', '--', '--quiet'], frontendDir);
  run('HERMES-05 fixture residue', 'npm', ['run', 'hermes:h05:residue'], backendDir);
}

