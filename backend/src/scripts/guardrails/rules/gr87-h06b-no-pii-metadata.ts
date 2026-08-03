import { GuardrailRule, result } from '../ruleTypes';
import { contentViolations } from './shared';

export const gr87H06BNoPiiMetadata: GuardrailRule = {
  id: 'GR-87',
  name: 'PII cannot enter technical metadata or logs',
  run: (context) => {
    const bridge = context.getFile('backend/src/agent/hermes/scheduling/hermesSchedulingBridge.service.ts');
    const violations = bridge
      ? contentViolations(bridge, /\b(metadata:\s*{[^}]*\b(firstName|lastName|phone|email)\b)/, 'GR-87 violation: H06B metadata cannot persist raw customer PII.')
      : [];
    return result('GR-87', 'PII cannot enter technical metadata or logs', 'H06B technical metadata stays free of raw customer PII fields.', violations);
  },
};
