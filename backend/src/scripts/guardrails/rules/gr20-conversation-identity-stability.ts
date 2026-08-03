import { GuardrailRule, result } from '../ruleTypes';

export const gr20ConversationIdentityStability: GuardrailRule = {
  id: 'GR-20',
  name: 'Conversation identity stability',
  run: (context) => {
    const violations = [];
    const chat = context.getFile('frontend/components/landing/DemoTestAgentChat.jsx');
    if (!chat?.content.includes('sessionStorage')) {
      violations.push({
        file: 'frontend/components/landing/DemoTestAgentChat.jsx',
        message: 'GR-20 violation: Public Agent chat must persist conversationId across component rerenders in the same browser tab.',
      });
    }
    if (!chat?.content.includes('conversationId') || !chat.content.includes('openMessage({ businessSlug, conversationId')) {
      violations.push({
        file: 'frontend/components/landing/DemoTestAgentChat.jsx',
        message: 'GR-20 violation: Agent chat must send the stable conversationId with open messages.',
      });
    }

    const repository = context.getFile('frontend/lib/api/agentSimRepository.js');
    if (!repository?.content.includes('openMessage({ businessSlug, conversationId, message })')) {
      violations.push({
        file: 'frontend/lib/api/agentSimRepository.js',
        message: 'GR-20 violation: Frontend Agent repository must expose conversationId on openMessage.',
      });
    }

    return result(
      'GR-20',
      'Conversation identity stability',
      'Frontend keeps a stable conversationId and sends it on every open Agent turn.',
      violations
    );
  },
};
