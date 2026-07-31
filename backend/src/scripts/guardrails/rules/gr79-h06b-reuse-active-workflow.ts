import { GuardrailRule, result } from '../ruleTypes';
import { violation } from './shared';

export const gr79H06BReuseActiveWorkflow: GuardrailRule = {
  id: 'GR-79',
  name: 'Active workflow must be reused',
  run: (context) => {
    const bridge = context.getFile('backend/src/agent/hermes/scheduling/hermesSchedulingBridge.service.ts');
    const test = context.getFile('backend/src/tests/demoTest/h06bE2E.test.ts');
    const violations = [];
    if (!bridge?.content.includes('resolveActiveProcess')) {
      violations.push(violation('backend/src/agent/hermes/scheduling/hermesSchedulingBridge.service.ts', 'GR-79 violation: bridge must resolve the active workflow before starting a new one.'));
    }
    if (!test?.content.includes('workflow must be reused')) {
      violations.push(violation('backend/src/tests/demoTest/h06bE2E.test.ts', 'GR-79 violation: e2e coverage must assert active workflow reuse.'));
    }
    return result('GR-79', 'Active workflow must be reused', 'H06B reuses the active workflow instead of starting duplicates.', violations);
  },
};
