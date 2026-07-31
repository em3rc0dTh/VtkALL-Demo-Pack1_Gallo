import { GuardrailRule, result } from '../ruleTypes';
import { violation } from './shared';

export const gr76H06BNoReservationCreate: GuardrailRule = {
  id: 'GR-76',
  name: 'ResourceReservation cannot be created by H06B',
  run: (context) => {
    const test = context.getFile('backend/src/tests/demoTest/h06bE2E.test.ts');
    const fixtures = context.getFile('backend/src/tests/demoTest/h06bFixtures.ts');
    const violations = [];
    if (!test?.content.includes('H06B must not create reservations')) {
      violations.push(violation('backend/src/tests/demoTest/h06bE2E.test.ts', 'GR-76 violation: H06B e2e must assert zero ResourceReservation creation.'));
    }
    if (!fixtures?.content.includes('resourceReservations')) {
      violations.push(violation('backend/src/tests/demoTest/h06bFixtures.ts', 'GR-76 violation: H06B residue counting must include ResourceReservation fixtures.'));
    }
    return result('GR-76', 'ResourceReservation cannot be created by H06B', 'Reservation side effects stay at zero across H06B coverage.', violations);
  },
};
