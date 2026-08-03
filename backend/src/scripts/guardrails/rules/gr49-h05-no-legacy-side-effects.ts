import { GuardrailRule, result } from '../ruleTypes';

export const gr49H05NoLegacySideEffects: GuardrailRule = {
  id: 'GR-49',
  name: 'Hermes accepted path cannot execute legacy side effects',
  run: (context) => {
    const test = context.getFile('backend/src/agent/hermes/tests/h05bVisible.test.ts');
    const violations = !test?.content.includes('legacyCalls === 0')
      ? [{ file: test?.path || 'backend/src/agent/hermes/tests/h05bVisible.test.ts', message: 'GR-49 violation: accepted path does not assert legacy skip.' }]
      : [];
    return result('GR-49', 'Hermes accepted path cannot execute legacy side effects', 'Accepted Hermes path skips legacy execution.', violations);
  },
};

