import { GuardrailRule, result } from '../ruleTypes';

export const gr53H05PersonalDataLegacy: GuardrailRule = {
  id: 'GR-53',
  name: 'Personal-data writes route to legacy',
  run: (context) => {
    const file = context.getFile('backend/src/agent/hermes/routing/hermesQaEligibility.policy.ts');
    const violations = !file?.content.includes('PERSONAL_DATA_WRITE')
      ? [{ file: file?.path || 'backend/src/agent/hermes/routing/hermesQaEligibility.policy.ts', message: 'GR-53 violation: personal data exclusion missing.' }]
      : [];
    return result('GR-53', 'Personal-data writes route to legacy', 'Identity/data-write turns are excluded.', violations);
  },
};

