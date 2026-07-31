import { GuardrailRule, result } from '../ruleTypes';

export const gr27HermesFailureFailOpen: GuardrailRule = {
  id: 'GR-27',
  name: 'Hermes failure cannot break legacy output',
  run: (context) => {
    const shadow = context.getFile('backend/src/agent/hermes/services/hermesShadow.service.ts');
    const violations = [];
    if (!shadow?.content.includes('catch (error)')) {
      violations.push({ file: shadow?.path || 'backend/src/agent/hermes/services/hermesShadow.service.ts', message: 'GR-27 violation: shadow dispatch must catch Hermes errors.' });
    }
    if (!shadow?.content.includes("statusFromError(error)")) {
      violations.push({ file: shadow?.path || 'backend/src/agent/hermes/services/hermesShadow.service.ts', message: 'GR-27 violation: shadow dispatch must normalize errors instead of throwing.' });
    }
    return result('GR-27', 'Hermes failure cannot break legacy output', 'Shadow dispatcher catches and returns observable internal results.', violations);
  },
};
