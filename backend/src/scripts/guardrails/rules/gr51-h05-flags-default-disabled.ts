import { GuardrailRule, result } from '../ruleTypes';

export const gr51H05FlagsDefaultDisabled: GuardrailRule = {
  id: 'GR-51',
  name: 'H05 flags default disabled',
  run: (context) => {
    const file = context.getFile('backend/.env.example');
    const required = ['HERMES_QA_VISIBLE_ENABLED=false', 'HERMES_QA_CANARY_PERCENT=0'];
    const violations = required.filter((term) => !file?.content.includes(term)).map((term) => ({ file: 'backend/.env.example', message: `GR-51 violation: missing ${term}.` }));
    return result('GR-51', 'H05 flags default disabled', 'H05 visible mode is disabled by default.', violations);
  },
};

