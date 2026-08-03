import { GuardrailRule, result } from '../ruleTypes';
import { violation } from './shared';

export const gr97H07TriageOrchestrator: GuardrailRule = {
  id: 'GR-97',
  name: 'H07 orchestrator performs triage before sub-agent dispatch',
  run: (context) => {
    const orchestrator = context.getFile('backend/src/agent/hermes/orchestration/hermesTurnOrchestrator.service.ts');
    const violations = [];
    if (!orchestrator?.content.includes('buildHermesTriageResult')) {
      violations.push(violation('backend/src/agent/hermes/orchestration/hermesTurnOrchestrator.service.ts', 'GR-97 violation: canonical orchestrator must build an H07 triage result.'));
    }
    if (!orchestrator?.content.includes('persistHermesTriageResult')) {
      violations.push(violation('backend/src/agent/hermes/orchestration/hermesTurnOrchestrator.service.ts', 'GR-97 violation: canonical orchestrator must persist the triage micro-stop.'));
    }
    if (!orchestrator?.content.includes('dispatchHermesSubAgent')) {
      violations.push(violation('backend/src/agent/hermes/orchestration/hermesTurnOrchestrator.service.ts', 'GR-97 violation: canonical orchestrator must dispatch a selected sub-agent.'));
    }
    return result('GR-97', 'H07 orchestrator performs triage before sub-agent dispatch', 'The public turn coordinator now builds triage, records it, and dispatches one sub-agent.', violations);
  },
};
