import { GuardrailRule, result } from '../ruleTypes';
import { violation } from './shared';

export const gr84H06BNaturalizeAfterContext: GuardrailRule = {
  id: 'GR-84',
  name: 'Naturalization occurs after ProcessContext',
  run: (context) => {
    const bridge = context.getFile('backend/src/agent/hermes/scheduling/hermesSchedulingBridge.service.ts');
    const violations = [];
    if (!bridge?.content.includes('const finalProcess = currentProcess')) {
      violations.push(violation('backend/src/agent/hermes/scheduling/hermesSchedulingBridge.service.ts', 'GR-84 violation: bridge must derive a final ProcessContext before naturalization.'));
    }
    if (!bridge?.content.includes('deterministicHermesSchedulingReply')) {
      violations.push(violation('backend/src/agent/hermes/scheduling/hermesSchedulingBridge.service.ts', 'GR-84 violation: bridge must naturalize only after authoritative context is available.'));
    }
    return result('GR-84', 'Naturalization occurs after ProcessContext', 'Naturalized replies are composed from authoritative post-dispatch context.', violations);
  },
};
