import { GuardrailRule, result } from '../ruleTypes';

export const gr44H05AvailabilityLegacy: GuardrailRule = {
  id: 'GR-44',
  name: 'Availability requests route to legacy',
  run: (context) => {
    const file = context.getFile('backend/src/agent/hermes/routing/hermesQaEligibility.policy.ts');
    const violations = !file?.content.includes('AVAILABILITY_REQUEST')
      ? [{ file: file?.path || 'backend/src/agent/hermes/routing/hermesQaEligibility.policy.ts', message: 'GR-44 violation: availability exclusion missing.' }]
      : [];
    return result('GR-44', 'Availability requests route to legacy', 'Availability remains operational legacy scope.', violations);
  },
};

