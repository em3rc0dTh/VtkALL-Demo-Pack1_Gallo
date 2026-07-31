import path from 'path';
import { buildGuardrailContext } from './fileScanner';
import { guardrailRules } from './rules';

const args = process.argv.slice(2);
const verbose = args.includes('--verbose');
const ruleArgIndex = args.indexOf('--rule');
const selectedRule = ruleArgIndex >= 0 ? args[ruleArgIndex + 1] : undefined;

const repoRoot = path.resolve(__dirname, '../../../..');
const context = buildGuardrailContext(repoRoot);
const rules = selectedRule ? guardrailRules.filter((rule) => rule.id === selectedRule) : guardrailRules;

if (selectedRule && rules.length === 0) {
  console.error(`Unknown guardrail rule: ${selectedRule}`);
  process.exit(1);
}

console.log('VtkALL Backend Architecture Guardrails\n');

const results = rules.map((rule) => rule.run(context));
for (const item of results) {
  const label = `${item.ruleId} ${item.name}`;
  console.log(`${label.padEnd(46, '.')} ${item.passed ? 'PASS' : 'FAIL'}`);
  if (verbose || !item.passed) {
    for (const entry of item.violations) {
      console.log('');
      console.log(`${entry.file}${entry.line ? `:${entry.line}` : ''}`);
      console.log(entry.message);
      if (entry.evidence) console.log(`Evidence: ${entry.evidence}`);
    }
    if (verbose && item.passed) {
      console.log(`  ${item.summary}`);
    }
  }
}

const failed = results.filter((item) => !item.passed).length;
const passed = results.length - failed;
console.log('');
console.log(`${passed} passed`);
console.log(`${failed} failed`);

if (failed > 0) {
  process.exitCode = 1;
}
