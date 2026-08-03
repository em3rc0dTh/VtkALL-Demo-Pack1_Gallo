import { GuardrailRule, result } from '../ruleTypes';
import { violation } from './shared';

export const gr99H07AgentRegistry: GuardrailRule = {
  id: 'GR-99',
  name: 'H07 sub-agents come from a registry',
  run: (context) => {
    const registry = context.getFile('backend/src/agent/hermes/orchestration/hermesAgentRegistry.ts');
    const dispatcher = context.getFile('backend/src/agent/hermes/orchestration/hermesAgentDispatcher.ts');
    const violations = [];
    for (const agent of ['conversation-agent', 'catalog-agent', 'scheduling-agent', 'recovery-agent']) {
      if (!registry?.content.includes(`id: '${agent}'`)) {
        violations.push(violation('backend/src/agent/hermes/orchestration/hermesAgentRegistry.ts', `GR-99 violation: registry must include ${agent}.`));
      }
    }
    if (!dispatcher?.content.includes('resolveHermesAgentManifest')) {
      violations.push(violation('backend/src/agent/hermes/orchestration/hermesAgentDispatcher.ts', 'GR-99 violation: dispatcher must resolve the selected sub-agent from the registry.'));
    }
    return result('GR-99', 'H07 sub-agents come from a registry', 'H07 routes through a registry-backed dispatcher instead of ad hoc specialist selection.', violations);
  },
};
