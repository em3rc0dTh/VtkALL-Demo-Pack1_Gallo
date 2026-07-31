import { GuardrailRule, result } from '../ruleTypes';
import { violation } from './shared';

export const gr56H06ADryRunOnly: GuardrailRule = {
  id: 'GR-56',
  name: 'H06A is dry-run only',
  run: (context) => {
    const proposal = context.getFile('backend/src/agent/hermes/contracts/schedulingActionProposal.contract.ts');
    const controller = context.getFile('backend/src/controllers/agentSim.controller.ts');
    const violations = [];
    if (!proposal?.content.includes("mode: 'dry_run'")) {
      violations.push(violation('backend/src/agent/hermes/contracts/schedulingActionProposal.contract.ts', 'GR-56 violation: scheduling proposals must be dry_run only.'));
    }
    if (!controller?.content.includes('observeHermesSchedulingDryRun')) {
      violations.push(violation('backend/src/controllers/agentSim.controller.ts', 'GR-56 violation: H06A must stay observational and internal.'));
    }
    return result('GR-56', 'H06A is dry-run only', 'Transactional scheduling remains internal and observational in H06A.', violations);
  },
};
