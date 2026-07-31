import { GuardrailRule, result } from '../ruleTypes';
import { contentViolations } from './shared';

export const gr61H06ANoDomainWrites: GuardrailRule = {
  id: 'GR-61',
  name: 'H06A cannot call domain write services',
  run: (context) => {
    const files = context.files.filter((file) => file.path.startsWith('backend/src/agent/hermes/scheduling/'));
    const violations = files.flatMap((file) => [
      ...contentViolations(file, /\b(createOrReuseCustomer|createManagedEntity|createOperationalCase|scheduleConsultation|createAppointment|holdResourceReservation)\s*\(/, 'GR-61 violation: H06A cannot call domain write services.'),
      ...contentViolations(file, /from\s+['"](?![^'"]*services\/demoTest\/core(?:\/|['"]))[^'"]*services\/demoTest\/[^'"]*['"]/i, 'GR-61 violation: H06A cannot import demoTest write services.'),
    ]);
    return result('GR-61', 'H06A cannot call domain write services', 'Dry-run scheduling layer never calls business write services.', violations);
  },
};
