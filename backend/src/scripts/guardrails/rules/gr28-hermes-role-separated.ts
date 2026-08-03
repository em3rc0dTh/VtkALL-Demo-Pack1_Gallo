import { GuardrailRule, result } from '../ruleTypes';
import { contentViolations } from './shared';

export const gr28HermesRoleSeparated: GuardrailRule = {
  id: 'GR-28',
  name: 'Hermes history remains role-separated',
  run: (context) => {
    const hermesFiles = context.files.filter((file) => file.path.startsWith('backend/src/agent/hermes/'));
    const violations = hermesFiles.flatMap((file) =>
      contentViolations(file, /Recent conversation:|user:\s*\$\{|assistant:\s*\$\{/i, 'GR-28 violation: Hermes history must remain role-separated, not flattened text.')
    );
    return result('GR-28', 'Hermes history remains role-separated', 'Hermes gateway sends message arrays with roles.', violations);
  },
};
