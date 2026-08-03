import { GuardrailRule, result } from '../ruleTypes';
import { contentViolations } from './shared';

export const gr55H05NoTemporalWriteServices: GuardrailRule = {
  id: 'GR-55',
  name: 'Hermes H05 cannot import Temporal or write services',
  run: (context) => {
    const files = context.files.filter((file) => file.path.startsWith('backend/src/agent/hermes/routing/'));
    const violations = files.flatMap((file) => [
      ...contentViolations(file, /from\s+['"][^'"]*temporal[^'"]*['"]|from\s+['"][^'"]*services\/agentSim[^'"]*['"]|from\s+['"][^'"]*availability[^'"]*['"]/i, 'GR-55 violation: H05 routing policy cannot import operational services.'),
      ...contentViolations(file, /\b(startScheduleConsultation|signalWorkflow|requestSlots|selectSlot|submitCustomerData)\s*\(/, 'GR-55 violation: H05 routing policy cannot call operational services.'),
    ]);
    return result('GR-55', 'Hermes H05 cannot import Temporal or write services', 'H05 routing policy stays read-only and non-operational.', violations);
  },
};
