import { GuardrailRule, result } from '../ruleTypes';
import { violation } from './shared';

export const gr85H06BDeterministicFallback: GuardrailRule = {
  id: 'GR-85',
  name: 'Naturalization failure uses deterministic fallback',
  run: (context) => {
    const naturalization = context.getFile('backend/src/agent/hermes/scheduling/hermesSchedulingNaturalization.service.ts');
    const bridge = context.getFile('backend/src/agent/hermes/scheduling/hermesSchedulingBridge.service.ts');
    const violations = [];
    if (!naturalization?.content.includes('deterministicHermesSchedulingReply')) {
      violations.push(violation('backend/src/agent/hermes/scheduling/hermesSchedulingNaturalization.service.ts', 'GR-85 violation: deterministic fallback replies must exist.'));
    }
    if (!bridge?.content.includes('naturalizationFallbackUsed: true')) {
      violations.push(violation('backend/src/agent/hermes/scheduling/hermesSchedulingBridge.service.ts', 'GR-85 violation: bridge metadata must expose deterministic fallback usage.'));
    }
    return result('GR-85', 'Naturalization failure uses deterministic fallback', 'H06B has deterministic customer-safe responses when naturalization cannot proceed.', violations);
  },
};
