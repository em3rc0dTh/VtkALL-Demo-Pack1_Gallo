import { GuardrailRule, result } from '../ruleTypes';
import { violation } from './shared';

export const gr100H07SkillReuse: GuardrailRule = {
  id: 'GR-100',
  name: 'H07 reuses existing skills as sub-agent bases',
  run: (context) => {
    const registry = context.getFile('backend/src/agent/hermes/orchestration/hermesAgentRegistry.ts');
    const violations = [];
    const expectedPairs = [
      "id: 'conversation-agent'",
      "skill: 'customer-conversation'",
      "id: 'catalog-agent'",
      "skill: 'catalog-advisor'",
      "id: 'scheduling-agent'",
      "skill: 'scheduling-companion'",
      "id: 'recovery-agent'",
      "skill: 'recovery-escalation'",
    ];
    for (const snippet of expectedPairs) {
      if (!registry?.content.includes(snippet)) {
        violations.push(violation('backend/src/agent/hermes/orchestration/hermesAgentRegistry.ts', `GR-100 violation: registry must preserve existing skill mapping ${snippet}.`));
      }
    }
    return result('GR-100', 'H07 reuses existing skills as sub-agent bases', 'H07 specializes the current Hermes skills instead of introducing new business engines.', violations);
  },
};
