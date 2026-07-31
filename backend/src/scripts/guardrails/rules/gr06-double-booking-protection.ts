import { GuardrailRule, result, GuardrailViolation } from '../ruleTypes';
import { violation } from './shared';

export const gr06DoubleBookingProtection: GuardrailRule = {
  id: 'GR-06',
  name: 'Double-booking protection',
  run: (context) => {
    const violations: GuardrailViolation[] = [];
    const model = context.getFile('backend/src/models/ResourceReservation.model.ts');
    const service = context.getFile('backend/src/services/demoTest/resourceReservation.service.ts');
    const modelContent = model?.content || '';
    const serviceContent = service?.content || '';

    for (const field of ['businessSlug', 'teamId', 'slotKeys', 'status']) {
      if (!modelContent.includes(`${field}: 1`)) violations.push(violation('backend/src/models/ResourceReservation.model.ts', `GR-06 violation: capacity lookup index must include ${field}.`));
    }
    if (/unique:\s*true/.test(modelContent)) {
      violations.push(violation('backend/src/models/ResourceReservation.model.ts', 'GR-06 violation: ResourceReservation must not use a unique slotKeys index that forces capacity=1.'));
    }
    if (!serviceContent.includes('assertNoDoubleBooking') || !serviceContent.includes('consumedCapacity >= input.effectiveCapacity')) {
      violations.push(violation('backend/src/services/demoTest/resourceReservation.service.ts', 'GR-06 violation: service layer must enforce consumed capacity against effectiveCapacity.'));
    }
    if (!serviceContent.includes('isBlockingReservationDuplicateKeyError') || !serviceContent.includes('legacy unique ResourceReservation index')) {
      violations.push(violation('backend/src/services/demoTest/resourceReservation.service.ts', 'GR-06 violation: legacy unique-index failures must surface as explicit capacity-index drift.'));
    }

    return result('GR-06', 'Double-booking protection', 'Blocking reservations are enforced by service-level capacity counting so WorkTeam.capacity > 1 can reserve parallel slots.', violations);
  },
};
