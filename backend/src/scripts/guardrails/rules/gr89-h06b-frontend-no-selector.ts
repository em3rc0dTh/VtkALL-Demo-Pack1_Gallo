import { GuardrailRule, result } from '../ruleTypes';
import { violation } from './shared';

export const gr89H06BFrontendNoSelector: GuardrailRule = {
  id: 'GR-89',
  name: 'Frontend cannot select scheduling runtime',
  run: (context) => {
    const frontend = context.getFile('frontend/components/landing/DemoTestAgentChat.jsx');
    const violations = [];
    if (/(HERMES_SCHEDULING_BRIDGE_ENABLED|scheduling-bridge|runtime selector)/i.test(frontend?.content || '')) {
      violations.push(violation('frontend/components/landing/DemoTestAgentChat.jsx', 'GR-89 violation: frontend cannot expose H06B runtime selection controls.'));
    }
    return result('GR-89', 'Frontend cannot select scheduling runtime', 'H06B remains a backend rollout concern; frontend keeps no runtime toggle.', violations);
  },
};
