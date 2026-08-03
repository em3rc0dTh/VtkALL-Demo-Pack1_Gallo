const { spawnSync } = require('child_process');
const path = require('path');

const repoRoot = path.resolve(__dirname, '../..');
const backendDir = path.join(repoRoot, 'backend');
const frontendDir = path.join(repoRoot, 'frontend');
const hermesDir = path.join(repoRoot, 'hermes');

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

const mode = process.argv[2] || 'h03';

if (mode === 'h03a') {
  run('HERMES-03A runtime hardening', 'npm', ['run', 'hermes:h03a'], hermesDir);
  run('HERMES-02 regression', 'npm', ['run', 'hermes:h02'], hermesDir);
} else if (mode === 'h03b') {
  run('HERMES-03B client tests', 'npm', ['run', 'test:demo-test:hermes-client'], backendDir);
  run('Backend build', 'npm', ['run', 'build'], backendDir);
  run('Backend guardrails', 'npm', ['run', 'test:demo-test:guardrails'], backendDir);
  run('Legacy agent tests', 'npm', ['run', 'test:demo-test:agent-mcp'], backendDir);
  run('HERMES-02 regression', 'npm', ['run', 'hermes:h02'], hermesDir);
} else if (mode === 'h03c') {
  run('HERMES-03C shadow tests', 'npm', ['run', 'test:demo-test:hermes-shadow'], backendDir);
  run('Backend guardrails', 'npm', ['run', 'test:demo-test:guardrails'], backendDir);
} else {
  run('HERMES-02 regression', 'npm', ['run', 'hermes:h02'], hermesDir);
  run('HERMES-03A runtime hardening', 'npm', ['run', 'hermes:h03a'], hermesDir);
  run('HERMES-03B client tests', 'npm', ['run', 'test:demo-test:hermes-client'], backendDir);
  run('HERMES-03C shadow tests', 'npm', ['run', 'test:demo-test:hermes-shadow'], backendDir);
  run('Backend guardrails', 'npm', ['run', 'test:demo-test:guardrails'], backendDir);
  run('Backend build', 'npm', ['run', 'build'], backendDir);
  run('Legacy agent tests', 'npm', ['run', 'test:demo-test:agent-mcp'], backendDir);
  run('Frontend build', 'npm', ['run', 'build'], frontendDir);
  run('Frontend lint quiet', 'npm', ['run', 'lint', '--', '--quiet'], frontendDir);
}
