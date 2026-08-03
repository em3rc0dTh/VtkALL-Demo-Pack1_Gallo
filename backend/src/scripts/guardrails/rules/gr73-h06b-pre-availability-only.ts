import { GuardrailRule, result } from '../ruleTypes';
import { violation } from './shared';

export const gr73H06BPreAvailabilityOnly: GuardrailRule = {
  id: 'GR-73',
  name: 'Scheduling bridge allowlist excludes booking commit actions',
  run: (context) => {
    const file = context.getFile('backend/src/agent/hermes/scheduling/hermesSchedulingExecution.policy.ts');
    const violations = [];
    const content = file?.content || '';
    const h06bAllowlistBlock = content.match(/export const H06B_ALLOWED_ACTIONS = \[(.*?)\] as const;/s)?.[1] || '';
    for (const token of ['START_SCHEDULE_CONSULTATION', 'SUBMIT_OFFERING_SELECTION', 'SUBMIT_CUSTOMER_INFORMATION', 'SUBMIT_DATE_PREFERENCE']) {
      if (!h06bAllowlistBlock.includes(token)) {
        violations.push(violation('backend/src/agent/hermes/scheduling/hermesSchedulingExecution.policy.ts', `GR-73 violation: missing allowed action ${token}.`));
      }
    }
    for (const forbidden of ['SUBMIT_SLOT_SELECTION', 'CANCEL_SCHEDULE_CONSULTATION']) {
      if (h06bAllowlistBlock.includes(forbidden)) {
        violations.push(violation('backend/src/agent/hermes/scheduling/hermesSchedulingExecution.policy.ts', `GR-73 violation: forbidden action ${forbidden} entered H06B allowlist.`));
      }
    }
    return result('GR-73', 'Scheduling bridge allowlist excludes booking commit actions', 'The bridge may reach real availability, but it must still exclude slot selection and booking commit actions.', violations);
  },
};
