import { GuardrailRule, result } from '../ruleTypes';
import { violation } from './shared';

export const gr81H06BFallbackSplit: GuardrailRule = {
  id: 'GR-81',
  name: 'Pre-commit and post-commit fallback are distinct',
  run: (context) => {
    const policy = context.getFile('backend/src/agent/hermes/scheduling/hermesSchedulingExecution.policy.ts');
    const bridge = context.getFile('backend/src/agent/hermes/scheduling/hermesSchedulingBridge.service.ts');
    const violations = [];
    if (!policy?.content.includes('failOpenPreCommit')) {
      violations.push(violation('backend/src/agent/hermes/scheduling/hermesSchedulingExecution.policy.ts', 'GR-81 violation: H06B must model pre-commit fail-open policy separately.'));
    }
    if (!bridge?.content.includes('preCommitFallbackUsed')) {
      violations.push(violation('backend/src/agent/hermes/scheduling/hermesSchedulingBridge.service.ts', 'GR-81 violation: bridge result must track pre-commit fallback separately.'));
    }
    return result('GR-81', 'Pre-commit and post-commit fallback are distinct', 'H06B exposes separate fields for pre-commit and post-commit fallback state.', violations);
  },
};
