import { GuardrailRule, result } from '../ruleTypes';
import { violation } from './shared';

export const gr82H06BNoPostCommitLegacy: GuardrailRule = {
  id: 'GR-82',
  name: 'Post-commit legacy fallback is forbidden',
  run: (context) => {
    const policy = context.getFile('backend/src/agent/hermes/scheduling/hermesSchedulingExecution.policy.ts');
    const bridge = context.getFile('backend/src/agent/hermes/scheduling/hermesSchedulingBridge.service.ts');
    const violations = [];
    if (!policy?.content.includes('postCommitLegacyFallback: false')) {
      violations.push(violation('backend/src/agent/hermes/scheduling/hermesSchedulingExecution.policy.ts', 'GR-82 violation: post-commit legacy fallback must stay false.'));
    }
    if (!bridge?.content.includes('postCommitLegacyFallbackUsed: false')) {
      violations.push(violation('backend/src/agent/hermes/scheduling/hermesSchedulingBridge.service.ts', 'GR-82 violation: bridge output must never mark post-commit legacy fallback as used.'));
    }
    return result('GR-82', 'Post-commit legacy fallback is forbidden', 'H06B does not jump back to legacy after a dispatch attempt.', violations);
  },
};
