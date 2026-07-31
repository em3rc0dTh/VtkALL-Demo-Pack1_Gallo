import { GuardrailRule, result } from '../ruleTypes';
import { contentViolations } from './shared';

export const gr07AvailabilityAuthority: GuardrailRule = {
  id: 'GR-07',
  name: 'Availability authority',
  run: (context) => {
    const backendServiceFiles = context.files.filter((file) =>
      file.path.startsWith('backend/src/services/') && file.path !== 'backend/src/services/demoTest/availability.service.ts' && !file.path.includes('seed')
    );
    const violations = backendServiceFiles.flatMap((file) =>
      contentViolations(file, /AvailabilitySlot\.find|AvailabilitySlot\.findOne|Appointment\.find\([^)]*scheduled/i, 'GR-07 violation: backend availability must not use AvailabilitySlot or Appointment as authoritative capacity source.')
    );
    const availability = context.getFile('backend/src/services/demoTest/availability.service.ts');
    for (const dependency of ['WorkTeam', 'WorkTeamScheduleRule', 'WorkTeamScheduleOverride', 'ResourceReservation', 'CatalogOffering']) {
      if (!availability?.content.includes(dependency)) {
        violations.push({ file: 'backend/src/services/demoTest/availability.service.ts', message: `GR-07 violation: availability authority must derive from ${dependency}.` });
      }
    }
    return result('GR-07', 'Availability authority', 'Availability derives from teams, rules, overrides, reservations, and offering policy.', violations);
  },
};
