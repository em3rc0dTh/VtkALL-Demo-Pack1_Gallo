import { GuardrailRule, result } from '../ruleTypes';

export const gr32VisibleHistoryExcludesShadow: GuardrailRule = {
  id: 'GR-32',
  name: 'Visible history excludes shadow interactions',
  run: (context) => {
    const service = context.getFile('backend/src/services/agentConversation.service.ts');
    const violations = [];
    if (!service?.content.includes("visibility: 'customer'")) {
      violations.push({ file: service?.path || 'backend/src/services/agentConversation.service.ts', message: 'GR-32 violation: visible history must filter visibility=customer.' });
    }
    if (service?.content.includes("visibility: { $ne: 'shadow' }")) {
      violations.push({ file: service.path, message: 'GR-32 violation: visible history must positively select customer visibility, not only exclude shadow.' });
    }
    return result('GR-32', 'Visible history excludes shadow interactions', 'Visible history selects customer-visible interactions only.', violations);
  },
};
