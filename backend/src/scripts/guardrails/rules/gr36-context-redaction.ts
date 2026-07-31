import { GuardrailRule, result } from '../ruleTypes';

export const gr36ContextRedaction: GuardrailRule = {
  id: 'GR-36',
  name: 'Hermes context redacts sensitive fields',
  run: (context) => {
    const policy = context.getFile('backend/src/agent/hermes/context/contextRedaction.policy.ts');
    const required = ['redactCustomer', 'redactText', 'phoneKnown', 'emailKnown'];
    const violations = required
      .filter((term) => !policy?.content.includes(term))
      .map((term) => ({ file: policy?.path || 'backend/src/agent/hermes/context/contextRedaction.policy.ts', message: `GR-36 violation: redaction policy missing ${term}.` }));
    return result('GR-36', 'Hermes context redacts sensitive fields', 'Context redaction policy masks sensitive values and exposes known booleans.', violations);
  },
};
