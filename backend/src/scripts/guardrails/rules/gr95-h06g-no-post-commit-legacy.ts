import { GuardrailRule, result } from '../ruleTypes';
import { violation } from './shared';

export const gr95H06GNoPostCommitLegacy: GuardrailRule = {
  id: 'GR-95',
  name: 'H06G forbids post-commit legacy fallback',
  run: (context) => {
    const visibleRuntime = context.getFile('backend/src/agent/hermes/orchestration/hermesVisibleRuntime.service.ts');
    const test = context.getFile('backend/src/agent/hermes/tests/h06gOrchestration.test.ts');
    const violations = [];

    if (!visibleRuntime?.content.includes("fallbackMode: committed && !config.postCommitLegacyFallback ? 'deterministic_post_commit' : 'legacy_pre_commit'")) {
      violations.push(violation('backend/src/agent/hermes/orchestration/hermesVisibleRuntime.service.ts', 'GR-95 violation: visible runtime must keep deterministic post-commit fallback.'));
    }

    if (!test?.content.includes("postCommit.runtime === 'hermes'") || !test?.content.includes("postCommit.fallbackMode === 'deterministic_post_commit'")) {
      violations.push(violation('backend/src/agent/hermes/tests/h06gOrchestration.test.ts', 'GR-95 violation: H06G orchestration test must assert post-commit fallback stays off legacy.'));
    }

    return result('GR-95', 'H06G forbids post-commit legacy fallback', 'Post-commit fallback remains deterministic and never reopens legacy execution.', violations);
  },
};
