import { spawn } from 'child_process';
import path from 'path';

type Step = {
  label: string;
  command: string;
  args: string[];
  cwd: string;
};

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const backendRoot = repoRoot;
const frontendRoot = path.resolve(repoRoot, '..', 'frontend');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const includeFrontendBuild = process.env.H06F_INCLUDE_FRONTEND_BUILD === 'true';

const steps: Step[] = [
  { label: 'backend build', command: npmCommand, args: ['run', 'build'], cwd: backendRoot },
  ...(includeFrontendBuild
    ? [{ label: 'frontend build', command: npmCommand, args: ['run', 'build'], cwd: frontendRoot }]
    : []),
];

const runStep = (step: Step) =>
  new Promise<{ ok: boolean; code: number | null; durationMs: number }>((resolve) => {
    const startedAt = Date.now();
    const child = spawn([step.command, ...step.args].join(' '), {
      cwd: step.cwd,
      shell: true,
      stdio: 'inherit',
      env: process.env,
    });

    child.on('close', (code) => {
      resolve({
        ok: code === 0,
        code,
        durationMs: Date.now() - startedAt,
      });
    });
  });

const run = async () => {
  const results: Array<{
    label: string;
    ok: boolean;
    code: number | null;
    durationMs: number;
  }> = [];

  for (const step of steps) {
    console.log(`\n[h06f-preflight] starting ${step.label}`);
    const result = await runStep(step);
    results.push({ label: step.label, ...result });
    console.log(`[h06f-preflight] ${step.label} -> ${result.ok ? 'PASS' : 'FAIL'} (${result.durationMs}ms)`);
    if (!result.ok) {
      console.log(JSON.stringify({ ok: false, failedStep: step.label, results }, null, 2));
      process.exit(1);
    }
  }

  if (!includeFrontendBuild) {
    results.push({
      label: 'frontend build',
      ok: true,
      code: 0,
      durationMs: 0,
    });
  }

  console.log(JSON.stringify({ ok: true, label: 'HERMES-06F.2 Preflight', results }, null, 2));
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
