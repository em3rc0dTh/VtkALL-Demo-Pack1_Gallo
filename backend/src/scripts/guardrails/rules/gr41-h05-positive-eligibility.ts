import { GuardrailRule, result } from '../ruleTypes';

export const gr41H05PositiveEligibility: GuardrailRule = {
  id: 'GR-41',
  name: 'Hermes visible requires explicit positive eligibility',
  run: (context) => {
    const file = context.getFile('backend/src/agent/hermes/routing/hermesQaEligibility.service.ts');
    const content = file?.content || '';
    const violations = ['ALLOWLIST_', 'eligible: true', 'runtime: \'hermes\'']
      .filter((term) => !content.includes(term))
      .map((term) => ({ file: file?.path || 'backend/src/agent/hermes/routing/hermesQaEligibility.service.ts', message: `GR-41 violation: missing ${term}.` }));
    return result('GR-41', 'Hermes visible requires explicit positive eligibility', 'H05 uses allowlist-first visible routing.', violations);
  },
};

