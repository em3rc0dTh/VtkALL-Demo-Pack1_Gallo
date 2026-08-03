import { GuardrailRule, result } from '../ruleTypes';
import { violation } from './shared';

export const gr77H06BNoAppointmentCreate: GuardrailRule = {
  id: 'GR-77',
  name: 'Appointment cannot be created by H06B',
  run: (context) => {
    const test = context.getFile('backend/src/tests/demoTest/h06bE2E.test.ts');
    const fixtures = context.getFile('backend/src/tests/demoTest/h06bFixtures.ts');
    const violations = [];
    if (!test?.content.includes('H06B must not create appointments')) {
      violations.push(violation('backend/src/tests/demoTest/h06bE2E.test.ts', 'GR-77 violation: H06B e2e must assert zero Appointment creation.'));
    }
    if (!fixtures?.content.includes('appointments')) {
      violations.push(violation('backend/src/tests/demoTest/h06bFixtures.ts', 'GR-77 violation: H06B residue counting must include Appointment fixtures.'));
    }
    return result('GR-77', 'Appointment cannot be created by H06B', 'Appointment creation remains disabled throughout H06B.', violations);
  },
};
