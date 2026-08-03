import { GuardrailRule, result } from '../ruleTypes';

export const gr54H05AttachmentsLegacy: GuardrailRule = {
  id: 'GR-54',
  name: 'Attachments route to legacy during H05',
  run: (context) => {
    const file = context.getFile('backend/src/agent/hermes/routing/hermesQaEligibility.service.ts');
    const violations = !file?.content.includes('ATTACHMENT_PRESENT')
      ? [{ file: file?.path || 'backend/src/agent/hermes/routing/hermesQaEligibility.service.ts', message: 'GR-54 violation: attachment exclusion missing.' }]
      : [];
    return result('GR-54', 'Attachments route to legacy during H05', 'Attachment turns are excluded.', violations);
  },
};

