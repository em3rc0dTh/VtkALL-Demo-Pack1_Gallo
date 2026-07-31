import { GuardrailRule, result } from '../ruleTypes';
import { violation } from './shared';

export const gr86H06BOneVisibleOutbound: GuardrailRule = {
  id: 'GR-86',
  name: 'Exactly one visible outbound per turn',
  run: (context) => {
    const test = context.getFile('backend/src/tests/demoTest/h06bStart.test.ts');
    const violations = [];
    if (!test?.content.includes('persist one visible outbound')) {
      violations.push(violation('backend/src/tests/demoTest/h06bStart.test.ts', 'GR-86 violation: H06B start coverage must assert exactly one visible Hermes outbound.'));
    }
    return result('GR-86', 'Exactly one visible outbound per turn', 'H06B start coverage verifies one visible outbound per handled turn.', violations);
  },
};
