import { GuardrailRule, result } from '../ruleTypes';

export const gr50H05PublicDtoPrivate: GuardrailRule = {
  id: 'GR-50',
  name: 'Public DTO cannot expose routing or Hermes metadata',
  run: (context) => {
    const test = context.getFile('backend/src/agent/hermes/tests/h05bVisible.test.ts');
    const violations = (!test?.content.includes('eligibility') || !test?.content.includes('canaryBucket'))
      ? [{ file: test?.path || 'backend/src/agent/hermes/tests/h05bVisible.test.ts', message: 'GR-50 violation: public DTO privacy assertions missing.' }]
      : [];
    return result('GR-50', 'Public DTO cannot expose routing or Hermes metadata', 'Public DTO shape stays unchanged.', violations);
  },
};

