import { GuardrailRule, result } from '../ruleTypes';
import { violation } from './shared';

export const gr66H06AFlagsDefaultDisabled: GuardrailRule = {
  id: 'GR-66',
  name: 'Transactional feature flags default false',
  run: (context) => {
    const envExample = context.getFile('backend/.env.example');
    const violations = [];
    const required = [
      'HERMES_SCHEDULING_DRY_RUN_ENABLED=false',
      'HERMES_SCHEDULING_TRANSACTIONAL_ENABLED=false',
      'HERMES_SCHEDULING_CANARY_PERCENT=0',
    ];
    for (const entry of required) {
      if (!envExample?.content.includes(entry)) {
        violations.push(violation('backend/.env.example', `GR-66 violation: missing default flag ${entry}.`));
      }
    }
    return result('GR-66', 'Transactional feature flags default false', 'Scheduling dry-run and transactional flags remain disabled by default.', violations);
  },
};
