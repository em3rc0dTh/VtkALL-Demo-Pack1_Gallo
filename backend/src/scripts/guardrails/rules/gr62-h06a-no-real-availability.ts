import { GuardrailRule, result } from '../ruleTypes';
import { contentViolations } from './shared';

export const gr62H06ANoRealAvailability: GuardrailRule = {
  id: 'GR-62',
  name: 'H06A cannot query real availability',
  run: (context) => {
    const files = context.files.filter((file) => file.path.startsWith('backend/src/agent/hermes/scheduling/'));
    const violations = files.flatMap((file) =>
      contentViolations(file, /\b(getAvailability|requestSlots|fetchAvailabilityActivity)\s*\(/, 'GR-62 violation: H06A cannot query real availability.')
    );
    return result('GR-62', 'H06A cannot query real availability', 'Dry-run scheduling does not ask backend availability services for live slots.', violations);
  },
};
