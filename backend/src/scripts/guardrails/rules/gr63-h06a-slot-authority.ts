import { GuardrailRule, result } from '../ruleTypes';
import { violation } from './shared';

export const gr63H06ASlotAuthority: GuardrailRule = {
  id: 'GR-63',
  name: 'Slot selection requires authoritative slot context',
  run: (context) => {
    const file = context.getFile('backend/src/agent/hermes/scheduling/hermesSchedulingProposal.validator.ts');
    const violations = [];
    if (!file?.content.includes('AUTHORITATIVE_SLOT_REQUIRED')) {
      violations.push(violation('backend/src/agent/hermes/scheduling/hermesSchedulingProposal.validator.ts', 'GR-63 violation: slot validation must require authoritative slot context.'));
    }
    return result('GR-63', 'Slot selection requires authoritative slot context', 'Validator blocks invented slot ids and requires authoritative context.', violations);
  },
};
