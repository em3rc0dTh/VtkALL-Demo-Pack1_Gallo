import { GuardrailRule, result } from '../ruleTypes';

export const gr43H05ActiveProcessLegacy: GuardrailRule = {
  id: 'GR-43',
  name: 'Active process routes to legacy during H05',
  run: (context) => {
    const service = context.getFile('backend/src/agent/hermes/routing/hermesQaEligibility.service.ts');
    const policy = context.getFile('backend/src/agent/hermes/routing/hermesQaEligibility.policy.ts');
    const violations = (!service?.content.includes('ACTIVE_PROCESS') || !policy?.content.includes('hasActiveProcess'))
      ? [{ file: service?.path || 'backend/src/agent/hermes/routing/hermesQaEligibility.service.ts', message: 'GR-43 violation: active process exclusion missing.' }]
      : [];
    return result('GR-43', 'Active process routes to legacy during H05', 'Active process is fail-closed to legacy.', violations);
  },
};

