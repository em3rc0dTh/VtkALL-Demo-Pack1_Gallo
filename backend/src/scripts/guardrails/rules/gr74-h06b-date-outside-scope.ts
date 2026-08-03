import { GuardrailRule, result } from '../ruleTypes';
import { violation } from './shared';

export const gr74H06BDateOutsideScope: GuardrailRule = {
  id: 'GR-74',
  name: 'Date normalization stays backend-authoritative',
  run: (context) => {
    const intent = context.getFile('backend/src/agent/hermes/scheduling/hermesSchedulingIntent.service.ts');
    const bridge = context.getFile('backend/src/agent/hermes/scheduling/hermesSchedulingBridge.service.ts');
    const normalizer = context.getFile('backend/src/agent/hermes/scheduling/hermesSchedulingDateNormalization.service.ts');
    const violations = [];
    if (!intent?.content.includes("type: 'request_availability'")) {
      violations.push(violation('backend/src/agent/hermes/scheduling/hermesSchedulingIntent.service.ts', 'GR-74 violation: date-like input must still classify as availability intent.'));
    }
    if (!normalizer?.content.includes('America/Lima')) {
      violations.push(violation('backend/src/agent/hermes/scheduling/hermesSchedulingDateNormalization.service.ts', 'GR-74 violation: date normalization must be anchored to the business timezone.'));
    }
    if (!bridge?.content.includes('normalizeHermesDatePreference')) {
      violations.push(violation('backend/src/agent/hermes/scheduling/hermesSchedulingBridge.service.ts', 'GR-74 violation: bridge must normalize date in backend before dispatch.'));
    }
    return result('GR-74', 'Date normalization stays backend-authoritative', 'Hermes may understand the request, but backend normalizes the date before Temporal dispatch.', violations);
  },
};
