import { GuardrailRule, result } from '../ruleTypes';
import { violation } from './shared';

export const gr93H06GOneVisibleOutbound: GuardrailRule = {
  id: 'GR-93',
  name: 'H06G asserts one visible outbound per turn',
  run: (context) => {
    const test = context.getFile('backend/src/agent/hermes/tests/h06gOrchestration.test.ts');
    const violations = [];

    if (!test?.content.includes('artifacts.visibleOutbound === 1')) {
      violations.push(violation('backend/src/agent/hermes/tests/h06gOrchestration.test.ts', 'GR-93 violation: H06G orchestration test must assert a single visible outbound.'));
    }

    if (!test?.content.includes('summarizeTurnArtifacts')) {
      violations.push(violation('backend/src/agent/hermes/tests/h06gOrchestration.test.ts', 'GR-93 violation: H06G must inspect persisted turn artifacts for visible outbound count.'));
    }

    return result('GR-93', 'H06G asserts one visible outbound per turn', 'H06G test coverage checks persisted visibility counts turn by turn.', violations);
  },
};
