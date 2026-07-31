import { GuardrailRule, result } from '../ruleTypes';
import { importViolations } from './shared';

const legacyCrudControllerExceptions = new Set([
  'backend/src/controllers/appointments.controller.ts',
  'backend/src/controllers/attachments.controller.ts',
  'backend/src/controllers/availabilitySlots.controller.ts',
  'backend/src/controllers/businessProfiles.controller.ts',
  'backend/src/controllers/cases.controller.ts',
  'backend/src/controllers/catalogOfferings.controller.ts',
  'backend/src/controllers/customerInteractions.controller.ts',
  'backend/src/controllers/customers.controller.ts',
  'backend/src/controllers/decisionRecords.controller.ts',
  'backend/src/controllers/managedEntities.controller.ts',
  'backend/src/controllers/notifications.controller.ts',
  'backend/src/controllers/relational.controller.ts',
  'backend/src/controllers/resourceReservations.controller.ts',
  'backend/src/controllers/timelineEvents.controller.ts',
  'backend/src/controllers/workTeams.controller.ts',
  'backend/src/controllers/workTeamScheduleOverrides.controller.ts',
  'backend/src/controllers/workTeamScheduleRules.controller.ts',
]);

export const gr03DomainServiceAuthority: GuardrailRule = {
  id: 'GR-03',
  name: 'Domain service authority',
  run: (context) => {
    const apiFiles = context.files.filter((file) =>
      (file.path.startsWith('backend/src/controllers/') || file.path.startsWith('backend/src/routes/')) &&
      !legacyCrudControllerExceptions.has(file.path)
    );
    const violations = apiFiles.flatMap((file) =>
      importViolations(
        file,
        (specifier) => specifier.includes('/models/'),
        (specifier) => `GR-03 violation: API layer imports Mongoose model ${specifier}. Controllers/routes should call services.`
      )
    );
    return result('GR-03', 'Domain service authority', 'API routes/controllers must delegate business writes and calculations to services.', violations);
  },
};
