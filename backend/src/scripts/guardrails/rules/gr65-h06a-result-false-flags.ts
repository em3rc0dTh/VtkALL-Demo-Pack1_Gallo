import { GuardrailRule, result } from '../ruleTypes';
import { violation } from './shared';

export const gr65H06AResultFalseFlags: GuardrailRule = {
  id: 'GR-65',
  name: 'Dry-run result always reports executionAllowed=false',
  run: (context) => {
    const file = context.getFile('backend/src/agent/hermes/contracts/schedulingDryRunResult.contract.ts');
    const violations = [];
    for (const needle of ['executionAllowed: false', 'temporalCalled: false', 'databaseWritten: false']) {
      if (!file?.content.includes(needle)) {
        violations.push(violation('backend/src/agent/hermes/contracts/schedulingDryRunResult.contract.ts', `GR-65 violation: missing invariant ${needle}.`));
      }
    }
    return result('GR-65', 'Dry-run result always reports executionAllowed=false', 'Scheduling dry-run result cannot claim execution or side effects.', violations);
  },
};
