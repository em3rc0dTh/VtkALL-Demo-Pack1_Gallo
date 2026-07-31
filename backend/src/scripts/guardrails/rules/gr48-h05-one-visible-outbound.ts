import { GuardrailRule, result } from '../ruleTypes';

export const gr48H05OneVisibleOutbound: GuardrailRule = {
  id: 'GR-48',
  name: 'A turn can persist only one visible outbound',
  run: (context) => {
    const test = context.getFile('backend/src/agent/hermes/tests/h05bVisible.test.ts');
    const fallback = context.getFile('backend/src/agent/hermes/tests/h05cFallback.test.ts');
    const violations = (!test?.content.includes('expected one visible outbound') || !fallback?.content.includes('expected one visible outbound'))
      ? [{ file: 'backend/src/agent/hermes/tests', message: 'GR-48 violation: one-visible-outbound tests missing.' }]
      : [];
    return result('GR-48', 'A turn can persist only one visible outbound', 'H05 gates assert exactly one visible outbound.', violations);
  },
};

