import { GuardrailRule, result } from '../ruleTypes';
import { violation } from './shared';

export const gr98H07TriageContract: GuardrailRule = {
  id: 'GR-98',
  name: 'H07 triage contract and micro-stop are explicit',
  run: (context) => {
    const contract = context.getFile('backend/src/agent/hermes/contracts/hermesTriage.contract.ts');
    const persistence = context.getFile('backend/src/agent/hermes/orchestration/hermesTriagePersistence.service.ts');
    const violations = [];
    if (!contract?.content.includes('selectedAgent') || !contract?.content.includes('requiredContext') || !contract?.content.includes('reasonCode')) {
      violations.push(violation('backend/src/agent/hermes/contracts/hermesTriage.contract.ts', 'GR-98 violation: H07 triage contract must expose selectedAgent, requiredContext, and reasonCode.'));
    }
    if (!persistence?.content.includes("runtimeMode: 'triage_micro_stop'")) {
      violations.push(violation('backend/src/agent/hermes/orchestration/hermesTriagePersistence.service.ts', 'GR-98 violation: H07 triage persistence must record the micro-stop as an internal event.'));
    }
    return result('GR-98', 'H07 triage contract and micro-stop are explicit', 'H07 defines a formal triage contract and persists its internal checkpoint.', violations);
  },
};
