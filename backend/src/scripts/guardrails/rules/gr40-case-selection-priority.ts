import { GuardrailRule, result } from '../ruleTypes';

export const gr40CaseSelectionPriority: GuardrailRule = {
  id: 'GR-40',
  name: 'Case selection follows explicit priority',
  run: (context) => {
    const reader = context.getFile('backend/src/agent/hermes/context/caseContext.reader.ts');
    const required = ['if (caseId)', 'CustomerInteraction.findOne', 'if (customerId)'];
    const violations = required
      .filter((term) => !reader?.content.includes(term))
      .map((term) => ({ file: reader?.path || 'backend/src/agent/hermes/context/caseContext.reader.ts', message: `GR-40 violation: case selection priority missing ${term}.` }));
    return result('GR-40', 'Case selection follows explicit priority', 'Case selection checks explicit case, linked conversation, then active customer case.', violations);
  },
};
