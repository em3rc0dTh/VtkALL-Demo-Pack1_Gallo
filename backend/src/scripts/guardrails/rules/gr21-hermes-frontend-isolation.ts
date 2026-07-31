import { GuardrailRule, result } from '../ruleTypes';
import { contentViolations } from './shared';

export const gr21HermesFrontendIsolation: GuardrailRule = {
  id: 'GR-21',
  name: 'Frontend cannot call Hermes',
  run: (context) => {
    const frontendFiles = context.files.filter((file) => file.path.startsWith('frontend/'));
    const violations = frontendFiles.flatMap((file) => [
      ...contentViolations(file, /localhost:8642|127\.0\.0\.1:8642|HERMES_API_BASE_URL|\/v1\/chat\/completions/i, 'GR-21 violation: Frontend must not call Hermes directly.'),
    ]);
    return result('GR-21', 'Frontend cannot call Hermes', 'Frontend has no direct Hermes endpoint usage.', violations);
  },
};
