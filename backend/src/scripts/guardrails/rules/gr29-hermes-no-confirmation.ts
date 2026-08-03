import { GuardrailRule, result } from '../ruleTypes';

export const gr29HermesNoConfirmation: GuardrailRule = {
  id: 'GR-29',
  name: 'Shadow mode detects completed-operation claims',
  run: (context) => {
    const shadow = context.getFile('backend/src/agent/hermes/services/hermesShadow.service.ts');
    const required = ['tu cita quedo confirmada', 'ya reserve', 'el horario es tuyo', 'registre tus datos'];
    const violations = required
      .filter((term) => !shadow?.content.includes(term))
      .map((term) => ({ file: shadow?.path || 'backend/src/agent/hermes/services/hermesShadow.service.ts', message: `GR-29 violation: missing false-confirmation detector for ${term}.` }));
    return result('GR-29', 'Shadow mode detects completed-operation claims', 'Hermes shadow evaluator flags false operation confirmations.', violations);
  },
};
