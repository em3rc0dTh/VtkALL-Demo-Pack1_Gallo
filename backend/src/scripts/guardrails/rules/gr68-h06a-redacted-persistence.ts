import { GuardrailRule, result } from '../ruleTypes';
import { violation } from './shared';

export const gr68H06ARedactedPersistence: GuardrailRule = {
  id: 'GR-68',
  name: 'Personal data is redacted in dry-run persistence',
  run: (context) => {
    const file = context.getFile('backend/src/agent/hermes/scheduling/hermesSchedulingDryRun.service.ts');
    const violations = [];
    if (!file?.content.includes('phonePresent') || !file?.content.includes('emailPresent')) {
      violations.push(violation('backend/src/agent/hermes/scheduling/hermesSchedulingDryRun.service.ts', 'GR-68 violation: dry-run persistence must store redacted personal-data presence flags.'));
    }
    if (file?.content.includes('phone: intent.extracted.phone') || file?.content.includes('email: intent.extracted.email')) {
      violations.push(violation('backend/src/agent/hermes/scheduling/hermesSchedulingDryRun.service.ts', 'GR-68 violation: dry-run persistence must not store full phone or email values.'));
    }
    return result('GR-68', 'Personal data is redacted in dry-run persistence', 'Dry-run persistence stores only redacted presence flags for personal data.', violations);
  },
};
