import { GuardrailRule, result } from '../ruleTypes';

export const gr45H05TransactionalLegacy: GuardrailRule = {
  id: 'GR-45',
  name: 'Transactional intent routes to legacy',
  run: (context) => {
    const file = context.getFile('backend/src/agent/hermes/routing/hermesQaEligibility.policy.ts');
    const required = ['BOOKING_REQUEST', 'CANCELLATION_REQUEST', 'RESCHEDULE_REQUEST', 'CONFIRMATION_REQUEST'];
    const violations = required.filter((term) => !file?.content.includes(term)).map((term) => ({ file: file?.path || 'backend/src/agent/hermes/routing/hermesQaEligibility.policy.ts', message: `GR-45 violation: missing ${term}.` }));
    return result('GR-45', 'Transactional intent routes to legacy', 'Transactional intents are excluded from visible Hermes.', violations);
  },
};

