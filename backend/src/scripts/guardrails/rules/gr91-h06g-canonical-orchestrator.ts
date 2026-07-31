import { GuardrailRule, result } from '../ruleTypes';
import { violation } from './shared';

export const gr91H06GCanonicalOrchestrator: GuardrailRule = {
  id: 'GR-91',
  name: 'H06G keeps one canonical public turn orchestrator',
  run: (context) => {
    const orchestrator = context.getFile('backend/src/agent/hermes/orchestration/hermesTurnOrchestrator.service.ts');
    const controller = context.getFile('backend/src/controllers/agentSim.controller.ts');
    const violations = [];

    if (!orchestrator?.content.includes('export const orchestrateHermesPublicTurn = async')) {
      violations.push(violation('backend/src/agent/hermes/orchestration/hermesTurnOrchestrator.service.ts', 'GR-91 violation: canonical public turn orchestrator export is missing.'));
    }

    if (!controller?.content.includes("import { orchestrateHermesPublicTurn }")) {
      violations.push(violation('backend/src/controllers/agentSim.controller.ts', 'GR-91 violation: public controller must import the canonical orchestrator.'));
    }

    if (!controller?.content.includes("route: 'initial'") || !controller?.content.includes("route: 'continuation'")) {
      violations.push(violation('backend/src/controllers/agentSim.controller.ts', 'GR-91 violation: both public routes must delegate through the canonical orchestrator.'));
    }

    return result('GR-91', 'H06G keeps one canonical public turn orchestrator', 'Public message routes converge on one orchestrator service.', violations);
  },
};
