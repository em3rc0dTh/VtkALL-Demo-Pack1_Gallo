import { GuardrailRule, result } from '../ruleTypes';
import { importViolations } from './shared';

export const gr24HermesShadowNoWrites: GuardrailRule = {
  id: 'GR-24',
  name: 'Shadow mode cannot call write services',
  run: (context) => {
    const shadowFiles = context.files.filter((file) => file.path.includes('hermesShadow'));
    const violations = shadowFiles.flatMap((file) =>
      importViolations(file, (specifier) =>
        specifier.includes('agentSim.service') ||
        specifier.includes('agentConversation.service') ||
        specifier.includes('/services/demoTest/') ||
        specifier.includes('/models/'),
      (specifier) => `GR-24 violation: Hermes shadow cannot import write-capable service ${specifier}.`)
    );
    return result('GR-24', 'Shadow mode cannot call write services', 'Hermes shadow is read-only and client-only.', violations);
  },
};
