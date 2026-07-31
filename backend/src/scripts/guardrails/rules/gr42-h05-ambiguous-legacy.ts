import { GuardrailRule, result } from '../ruleTypes';

export const gr42H05AmbiguousLegacy: GuardrailRule = {
  id: 'GR-42',
  name: 'Ambiguous turns route to legacy',
  run: (context) => {
    const file = context.getFile('backend/src/agent/hermes/routing/hermesQaEligibility.policy.ts');
    const violations = !file?.content.includes('AMBIGUOUS_MESSAGE')
      ? [{ file: file?.path || 'backend/src/agent/hermes/routing/hermesQaEligibility.policy.ts', message: 'GR-42 violation: ambiguous message exclusion missing.' }]
      : [];
    return result('GR-42', 'Ambiguous turns route to legacy', 'Short ambiguous continuations are excluded.', violations);
  },
};

