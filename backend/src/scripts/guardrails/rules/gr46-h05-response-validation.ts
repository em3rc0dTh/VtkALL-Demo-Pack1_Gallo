import { GuardrailRule, result } from '../ruleTypes';

export const gr46H05ResponseValidation: GuardrailRule = {
  id: 'GR-46',
  name: 'Hermes visible response must pass validation',
  run: (context) => {
    const file = context.getFile('backend/src/agent/hermes/routing/hermesQaPrimary.service.ts');
    const violations = !file?.content.includes('validateHermesQaVisibleReply')
      ? [{ file: file?.path || 'backend/src/agent/hermes/routing/hermesQaPrimary.service.ts', message: 'GR-46 violation: visible path does not validate Hermes reply.' }]
      : [];
    return result('GR-46', 'Hermes visible response must pass validation', 'Visible Hermes replies are validated before persistence.', violations);
  },
};

