import { GuardrailRule, result } from '../ruleTypes';
import { contentViolations } from './shared';

export const gr75H06BNoAvailabilityCall: GuardrailRule = {
  id: 'GR-75',
  name: 'Bridge cannot bypass Temporal for availability or booking',
  run: (context) => {
    const bridge = context.getFile('backend/src/agent/hermes/scheduling/hermesSchedulingBridge.service.ts');
    const violations = bridge ? contentViolations(bridge, /\b(getAvailability|selectSlot|scheduleConsultation)\b/, 'GR-75 violation: bridge cannot bypass Temporal for availability or booking operations.') : [];
    return result('GR-75', 'Bridge cannot bypass Temporal for availability or booking', 'Availability may flow through the gateway and Temporal bridge, but not through direct domain or booking calls.', violations);
  },
};
