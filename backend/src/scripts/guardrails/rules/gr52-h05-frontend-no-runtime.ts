import { GuardrailRule, result } from '../ruleTypes';
import { contentViolations } from './shared';

export const gr52H05FrontendNoRuntime: GuardrailRule = {
  id: 'GR-52',
  name: 'Frontend cannot select the runtime',
  run: (context) => {
    const files = context.files.filter((file) => file.path.startsWith('frontend/'));
    const violations = files.flatMap((file) => contentViolations(file, /HERMES_QA|runtime\s*:\s*['"]hermes|selectedRuntime/i, 'GR-52 violation: frontend must not select Hermes runtime.'));
    return result('GR-52', 'Frontend cannot select the runtime', 'Runtime selection stays backend-only.', violations);
  },
};

