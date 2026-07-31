import { GuardrailRule, result } from '../ruleTypes';
import { violation } from './shared';

export const gr69H06ALegacyAuthoritative: GuardrailRule = {
  id: 'GR-69',
  name: 'Active legacy response remains authoritative',
  run: (context) => {
    const controller = context.getFile('backend/src/controllers/agentSim.controller.ts');
    const violations = [];
    if (!controller?.content.includes('message: qaResult.message') || !controller?.content.includes('message: result.message')) {
      violations.push(violation('backend/src/controllers/agentSim.controller.ts', 'GR-69 violation: legacy response must remain authoritative in controller responses.'));
    }
    return result('GR-69', 'Active legacy response remains authoritative', 'H06A observes internally while legacy-visible response remains authoritative.', violations);
  },
};
