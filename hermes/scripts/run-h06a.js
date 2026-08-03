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

const mode = process.argv[2] || 'h06a';

if (mode === 'audit') {
  run('HERMES-06A audit', 'npm', ['run', 'hermes:h06a:audit'], backendDir);
} else if (mode === 'intent') {
  run('HERMES-06A intent', 'npm', ['run', 'hermes:h06a:intent'], backendDir);
} else if (mode === 'proposal') {
  run('HERMES-06A proposal', 'npm', ['run', 'hermes:h06a:proposal'], backendDir);
} else if (mode === 'dry-run') {
  run('HERMES-06A dry-run', 'npm', ['run', 'hermes:h06a:dry-run'], backendDir);
} else if (mode === 'no-effects') {
  run('HERMES-06A no-effects', 'npm', ['run', 'hermes:h06a:no-effects'], backendDir);
} else if (mode === 'residue') {
  run('HERMES-06A residue', 'npm', ['run', 'hermes:h06a:residue'], backendDir);
} else {
  run('HERMES-04A Mongo readiness', 'npm', ['run', 'hermes:h04:mongo-readiness'], backendDir);
  run('HERMES-02 regression', 'npm', ['run', 'hermes:h02'], hermesDir);
  run('HERMES-03 regression', 'npm', ['run', 'hermes:h03'], hermesDir);
  run('HERMES-04 regression', 'npm', ['run', 'hermes:h04'], hermesDir);
  run('HERMES-05 regression', 'npm', ['run', 'hermes:h05'], hermesDir);
  run('HERMES-06A audit', 'npm', ['run', 'hermes:h06a:audit'], backendDir);
  run('HERMES-06A intent', 'npm', ['run', 'hermes:h06a:intent'], backendDir);
  run('HERMES-06A proposal', 'npm', ['run', 'hermes:h06a:proposal'], backendDir);
  run('HERMES-06A dry-run', 'npm', ['run', 'hermes:h06a:dry-run'], backendDir);
  run('HERMES-06A no-effects', 'npm', ['run', 'hermes:h06a:no-effects'], backendDir);
  run('Backend guardrails', 'npm', ['run', 'test:demo-test:guardrails'], backendDir);
  run('Backend build', 'npm', ['run', 'build'], backendDir);
  run('Legacy agent tests', 'npm', ['run', 'test:demo-test:agent-mcp'], backendDir);
  run('Frontend build', 'npm', ['run', 'build'], frontendDir);
  run('Frontend lint quiet', 'npm', ['run', 'lint', '--', '--quiet'], frontendDir);
  run('HERMES-06A residue', 'npm', ['run', 'hermes:h06a:residue'], backendDir);
}
