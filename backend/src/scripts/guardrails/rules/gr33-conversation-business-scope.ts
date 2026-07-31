import { GuardrailRule, result } from '../ruleTypes';

export const gr33ConversationBusinessScope: GuardrailRule = {
  id: 'GR-33',
  name: 'Conversation queries require businessSlug',
  run: (context) => {
    const service = context.getFile('backend/src/services/agentConversation.service.ts');
    const violations = [];
    for (const marker of ['getVisibleConversationHistory', 'getShadowEvaluationHistory', 'resolveActiveWorkflowForConversation']) {
      const index = service?.content.indexOf(`export const ${marker}`);
      const slice = index && index > -1 ? service?.content.slice(index, index + 900) || '' : '';
      if (!slice.includes('businessSlug') || !slice.includes('conversationId')) {
        violations.push({ file: service?.path || 'backend/src/services/agentConversation.service.ts', message: `GR-33 violation: ${marker} must require businessSlug + conversationId.` });
      }
    }
    return result('GR-33', 'Conversation queries require businessSlug', 'Conversation reads are scoped by businessSlug and conversationId.', violations);
  },
};
