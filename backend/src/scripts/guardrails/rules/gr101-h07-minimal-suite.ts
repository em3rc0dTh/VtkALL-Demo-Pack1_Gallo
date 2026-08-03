import { GuardrailRule, result } from '../ruleTypes';
import { violation } from './shared';

export const gr101H07MinimalSuite: GuardrailRule = {
  id: 'GR-101',
  name: 'H07 orchestration suite covers the required routing cases',
  run: (context) => {
    const test = context.getFile('backend/src/agent/hermes/tests/h07Orchestration.test.ts');
    const report = context.getFile('backend/docs/reviews/HERMES_07_TRIAGE_AND_SUBAGENTS_REPORT.md');
    const violations = [];
    for (const phrase of [
      'multi-fact conserva hechos',
      'catalog routing reutiliza',
      'scheduling-agent propone acciones',
      'side question mantiene soporte',
      'recovery-agent absorbe unknown agent recovery',
    ]) {
      if (!test?.content.includes(phrase)) {
        violations.push(violation('backend/src/agent/hermes/tests/h07Orchestration.test.ts', `GR-101 violation: H07 orchestration suite must cover ${phrase}.`));
      }
    }
    if (!report?.content.includes('Frontend manual check')) {
      violations.push(violation('backend/docs/reviews/HERMES_07_TRIAGE_AND_SUBAGENTS_REPORT.md', 'GR-101 violation: H07 report must state the manual frontend check status.'));
    }
    return result('GR-101', 'H07 orchestration suite covers the required routing cases', 'The H07 suite stays minimal but covers the requested triage and sub-agent paths.', violations);
  },
};
