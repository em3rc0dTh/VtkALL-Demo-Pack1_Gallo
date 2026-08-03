import { GuardrailRule, result } from '../ruleTypes';
import { violation } from './shared';

export const gr90H06BCleanup: GuardrailRule = {
  id: 'GR-90',
  name: 'H06B workflows and fixtures must be cleaned',
  run: (context) => {
    const fixtures = context.getFile('backend/src/tests/demoTest/h06bFixtures.ts');
    const residue = context.getFile('backend/src/tests/demoTest/h06bResidue.test.ts');
    const violations = [];
    if (!fixtures?.content.includes("signalWorkflow(workflowId, 'cancelWorkflow'")) {
      violations.push(violation('backend/src/tests/demoTest/h06bFixtures.ts', 'GR-90 violation: fixture cleanup must cancel test workflows explicitly.'));
    }
    if (!residue?.content.includes('H06B residue detected')) {
      violations.push(violation('backend/src/tests/demoTest/h06bResidue.test.ts', 'GR-90 violation: residue test must fail on leftover H06B fixtures.'));
    }
    return result('GR-90', 'H06B workflows and fixtures must be cleaned', 'H06B fixtures include targeted cleanup and zero-residue verification.', violations);
  },
};
