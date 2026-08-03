import { GuardrailRule, result } from '../ruleTypes';
import { violation } from './shared';

export const gr15SeedSeparation: GuardrailRule = {
  id: 'GR-15',
  name: 'Seed separation',
  run: (context) => {
    const seed = context.getFile('backend/src/services/seed.service.ts');
    const content = seed?.content || '';
    const violations = [];
    for (const required of ['DEMO_TEST_BUSINESS_PROFILE', 'DEMO_TEST_CATALOG_OFFERINGS', 'DEMO_TEST_WORK_TEAMS', 'MOCK_WORK_TEAMS']) {
      if (!content.includes(required)) violations.push(violation('backend/src/services/seed.service.ts', `GR-15 violation: seed must keep explicit ${required} fixture separation.`));
    }
    const demoStart = content.indexOf('DEMO_TEST_BUSINESS_PROFILE');
    const legacyTuraguaStart = content.indexOf('const OFFERING_DURATION_BY_ID');
    const canonicalTuraguaStart = content.indexOf('const TURAGUA_BUSINESS_PROFILE');
    const demoEnd = legacyTuraguaStart >= 0 ? legacyTuraguaStart : canonicalTuraguaStart;
    const demoBlock = demoStart >= 0 && demoEnd > demoStart ? content.slice(demoStart, demoEnd) : content;
    for (const forbidden of ['vehiclePlate', 'vehicleBrand', 'vehicleModel', 'vehicleYear', 'Iris', 'team_mechanics']) {
      if (demoBlock.includes(forbidden)) violations.push(violation('backend/src/services/seed.service.ts', `GR-15 violation: neutral demo_test seed must not require ${forbidden}.`));
    }
    return result('GR-15', 'Seed separation', 'demo_test neutral seed and Turagua vertical fixture remain separate.', violations);
  },
};
