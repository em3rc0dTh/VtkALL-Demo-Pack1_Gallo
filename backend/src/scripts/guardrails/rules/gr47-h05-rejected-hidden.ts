import { GuardrailRule, result } from '../ruleTypes';

export const gr47H05RejectedHidden: GuardrailRule = {
  id: 'GR-47',
  name: 'Rejected Hermes candidate cannot become customer-visible',
  run: (context) => {
    const file = context.getFile('backend/src/agent/hermes/routing/hermesQaPrimary.service.ts');
    const violations = (!file?.content.includes('qa_candidate_rejected') || !file?.content.includes('recordShadowAgentMessage'))
      ? [{ file: file?.path || 'backend/src/agent/hermes/routing/hermesQaPrimary.service.ts', message: 'GR-47 violation: rejected candidate not persisted as shadow.' }]
      : [];
    return result('GR-47', 'Rejected Hermes candidate cannot become customer-visible', 'Rejected candidates are internal shadow rows.', violations);
  },
};

