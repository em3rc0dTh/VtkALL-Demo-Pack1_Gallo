import { GuardrailRule, result } from '../ruleTypes';
import { violation } from './shared';

export const gr70H06AFixtureResidueZero: GuardrailRule = {
  id: 'GR-70',
  name: 'H06A fixture residue must be zero',
  run: (context) => {
    const file = context.getFile('backend/src/agent/hermes/tests/h06aResidue.test.ts');
    const violations = [];
    if (!file?.content.includes('Fixture residue detected')) {
      violations.push(violation('backend/src/agent/hermes/tests/h06aResidue.test.ts', 'GR-70 violation: H06A must include an explicit zero-residue test.'));
    }
    return result('GR-70', 'H06A fixture residue must be zero', 'H06A test suite enforces zero fixture residue after cleanup.', violations);
  },
};
