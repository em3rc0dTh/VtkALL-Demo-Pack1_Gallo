import { GuardrailRule, result } from '../ruleTypes';
import { contentViolations } from './shared';

export const gr30HermesAccessFlags: GuardrailRule = {
  id: 'GR-30',
  name: 'Hermes access flags remain false',
  run: (context) => {
    const files = context.files.filter((file) => file.path.startsWith('hermes/') || file.path === 'backend/.env.example');
    const violations = files.flatMap((file) =>
      contentViolations(file, /HERMES_ENABLE_(BACKEND|TEMPORAL|MONGO|TERMINAL|WRITE)_ACCESS=true|backend_access:\s*true|temporal_access:\s*true|mongo_access:\s*true|terminal_access:\s*true|write_access:\s*true/i, 'GR-30 violation: Hermes authority flags must remain false.')
    );
    return result('GR-30', 'Hermes access flags remain false', 'Hermes authority flags are fail-closed and disabled.', violations);
  },
};
