import { GuardrailRule, result } from '../ruleTypes';
import { violation } from './shared';

export const gr64H06ASeparateIntentProposal: GuardrailRule = {
  id: 'GR-64',
  name: 'Scheduling intent and action proposal are separate contracts',
  run: (context) => {
    const violations = [];
    if (!context.hasFile('backend/src/agent/hermes/contracts/hermesSchedulingIntent.contract.ts')) {
      violations.push(violation('backend/src/agent/hermes/contracts/hermesSchedulingIntent.contract.ts', 'GR-64 violation: HermesSchedulingIntent contract is required.'));
    }
    if (!context.hasFile('backend/src/agent/hermes/contracts/schedulingActionProposal.contract.ts')) {
      violations.push(violation('backend/src/agent/hermes/contracts/schedulingActionProposal.contract.ts', 'GR-64 violation: SchedulingActionProposal contract is required.'));
    }
    return result('GR-64', 'Scheduling intent and action proposal are separate contracts', 'Interpretation and authorization remain separate in H06A.', violations);
  },
};
