import { GuardrailRule, result } from '../ruleTypes';
import { violation } from './shared';

export const gr80H06BNoDuplicateStart: GuardrailRule = {
  id: 'GR-80',
  name: 'Same conversation cannot start duplicate workflows',
  run: (context) => {
    const idempotency = context.getFile('backend/src/tests/demoTest/h06bIdempotency.test.ts');
    const e2e = context.getFile('backend/src/tests/demoTest/h06bE2E.test.ts');
    const violations = [];
    if (!idempotency?.content.includes('same request must replay safely')) {
      violations.push(violation('backend/src/tests/demoTest/h06bIdempotency.test.ts', 'GR-80 violation: idempotency test must assert safe replay instead of duplicate workflow start.'));
    }
    if (!e2e?.content.includes('cross-conversation must isolate workflows')) {
      violations.push(violation('backend/src/tests/demoTest/h06bE2E.test.ts', 'GR-80 violation: e2e test must prove conversation-isolated workflow creation.'));
    }
    return result('GR-80', 'Same conversation cannot start duplicate workflows', 'Replay and cross-conversation tests cover duplicate-start protection.', violations);
  },
};
