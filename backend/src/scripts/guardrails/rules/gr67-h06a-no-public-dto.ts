import { GuardrailRule, result } from '../ruleTypes';
import { violation } from './shared';

export const gr67H06ANoPublicDto: GuardrailRule = {
  id: 'GR-67',
  name: 'H06A output cannot enter public DTO',
  run: (context) => {
    const controller = context.getFile('backend/src/controllers/agentSim.controller.ts');
    const violations = [];
    if (controller?.content.includes('proposedAction:') || controller?.content.includes('dryRun')) {
      violations.push(violation('backend/src/controllers/agentSim.controller.ts', 'GR-67 violation: H06A output cannot enter the public DTO.'));
    }
    return result('GR-67', 'H06A output cannot enter public DTO', 'Controller keeps dry-run output out of the public response payload.', violations);
  },
};
