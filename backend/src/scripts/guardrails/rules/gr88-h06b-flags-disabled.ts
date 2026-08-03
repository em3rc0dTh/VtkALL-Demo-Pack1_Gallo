import { GuardrailRule, result } from '../ruleTypes';
import { violation } from './shared';

export const gr88H06BFlagsDisabled: GuardrailRule = {
  id: 'GR-88',
  name: 'H06B flags default disabled',
  run: (context) => {
    const envExample = context.getFile('backend/.env.example');
    const violations = [];
    for (const token of [
      'HERMES_SCHEDULING_BRIDGE_ENABLED=false',
      'HERMES_SCHEDULING_BRIDGE_CANARY_PERCENT=0',
      'HERMES_SCHEDULING_BRIDGE_FAIL_OPEN_PRE_COMMIT=true',
      'HERMES_SCHEDULING_BRIDGE_POST_COMMIT_LEGACY_FALLBACK=false',
      'HERMES_SCHEDULING_BRIDGE_MAX_ACTIONS_PER_TURN=2',
      'HERMES_AVAILABILITY_ENABLED=false',
      'HERMES_AVAILABILITY_CANARY_PERCENT=0',
      'HERMES_AVAILABILITY_MAX_SLOTS_PRESENTED=5',
      'HERMES_AVAILABILITY_REUSE_VALID_RESULTS=true',
      'HERMES_AVAILABILITY_POST_COMMIT_LEGACY_FALLBACK=false',
      'HERMES_BOOKING_ENABLED=false',
      'HERMES_BOOKING_CANARY_PERCENT=0',
      'HERMES_BOOKING_POST_COMMIT_LEGACY_FALLBACK=false',
      'HERMES_BOOKING_RECHECK_AVAILABILITY=true',
    ]) {
      if (!envExample?.content.includes(token)) {
        violations.push(violation('backend/.env.example', `GR-88 violation: missing default flag ${token}.`));
      }
    }
    return result('GR-88', 'H06B flags default disabled', 'Bridge rollout flags keep H06B disabled by default outside tests.', violations);
  },
};
