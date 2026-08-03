import { GuardrailRule, result } from '../ruleTypes';
import { violation } from './shared';

const requiredActions = [
  'NO_ACTION',
  'START_SCHEDULE_CONSULTATION',
  'SUBMIT_OFFERING_SELECTION',
  'SUBMIT_CUSTOMER_INFORMATION',
  'SUBMIT_DATE_PREFERENCE',
  'SUBMIT_SLOT_SELECTION',
  'CANCEL_SCHEDULE_CONSULTATION',
  'REQUEST_CLARIFICATION',
];

export const gr59H06ASemanticAllowlist: GuardrailRule = {
  id: 'GR-59',
  name: 'Only semantic scheduling actions are allowed',
  run: (context) => {
    const contract = context.getFile('backend/src/agent/hermes/contracts/schedulingActionProposal.contract.ts');
    const violations = [];
    for (const action of requiredActions) {
      if (!contract?.content.includes(`'${action}'`)) {
        violations.push(violation('backend/src/agent/hermes/contracts/schedulingActionProposal.contract.ts', `GR-59 violation: missing semantic action ${action}.`));
      }
    }
    return result('GR-59', 'Only semantic scheduling actions are allowed', 'H06A scheduling actions are fixed to the semantic allowlist.', violations);
  },
};
