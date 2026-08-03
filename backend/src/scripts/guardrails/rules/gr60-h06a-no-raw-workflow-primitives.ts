import { GuardrailRule, result } from '../ruleTypes';
import { contentViolations } from './shared';

export const gr60H06ANoRawWorkflowPrimitives: GuardrailRule = {
  id: 'GR-60',
  name: 'Raw workflow primitives are forbidden',
  run: (context) => {
    const file = context.getFile('backend/src/agent/hermes/scheduling/hermesSchedulingProposal.validator.ts');
    const violations = file && !file.content.includes('SECURITY_RISK')
      ? [{
        file: file.path,
        message: 'GR-60 violation: validator must reject raw workflow primitives.',
      }]
      : [];
    return result('GR-60', 'Raw workflow primitives are forbidden', 'H06A validator rejects raw workflow primitives and operational instructions.', violations);
  },
};
