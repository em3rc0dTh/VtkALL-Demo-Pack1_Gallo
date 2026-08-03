import { GuardrailRule, result } from '../ruleTypes';

export const gr38ShadowNotVisible: GuardrailRule = {
  id: 'GR-38',
  name: 'Shadow interactions cannot become customer-visible',
  run: (context) => {
    const service = context.getFile('backend/src/services/agentConversation.service.ts');
    const violations = [];
    const marker = service?.content.indexOf('recordShadowAgentMessage') ?? -1;
    const slice = marker > -1 ? service?.content.slice(marker, marker + 400) || '' : '';
    if (!slice.includes("visibility: 'shadow'") || !slice.includes("interactionType: 'shadow_response'")) {
      violations.push({ file: service?.path || 'backend/src/services/agentConversation.service.ts', message: 'GR-38 violation: shadow messages must use visibility=shadow and shadow_response.' });
    }
    return result('GR-38', 'Shadow interactions cannot become customer-visible', 'Shadow persistence is internal-only.', violations);
  },
};
