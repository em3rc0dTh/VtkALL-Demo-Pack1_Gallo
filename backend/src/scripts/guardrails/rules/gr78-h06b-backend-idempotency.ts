import { GuardrailRule, result } from '../ruleTypes';
import { violation } from './shared';

export const gr78H06BBackendIdempotency: GuardrailRule = {
  id: 'GR-78',
  name: 'Backend derives idempotency keys',
  run: (context) => {
    const file = context.getFile('backend/src/agent/hermes/scheduling/hermesSchedulingIdempotency.service.ts');
    const violations = [];
    if (!file?.content.includes('hermes-scheduling:')) {
      violations.push(violation('backend/src/agent/hermes/scheduling/hermesSchedulingIdempotency.service.ts', 'GR-78 violation: H06B must derive a backend idempotency namespace.'));
    }
    if (!file?.content.includes('messageId') || !file?.content.includes('semanticAction')) {
      violations.push(violation('backend/src/agent/hermes/scheduling/hermesSchedulingIdempotency.service.ts', 'GR-78 violation: H06B idempotency must derive from conversation, message, and semantic action.'));
    }
    return result('GR-78', 'Backend derives idempotency keys', 'Hermes never supplies the authoritative idempotency key for H06B.', violations);
  },
};
