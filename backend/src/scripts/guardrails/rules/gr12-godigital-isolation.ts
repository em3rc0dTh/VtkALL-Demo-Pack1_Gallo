import { GuardrailRule, result } from '../ruleTypes';
import { contentViolations, isDocumentation } from './shared';

export const gr12GoDigitalIsolation: GuardrailRule = {
  id: 'GR-12',
  name: 'GoDigital Core isolation',
  run: (context) => {
    const files = context.files.filter((file) => !isDocumentation(file) && !file.path.includes('backend/src/scripts/guardrails/'));
    const violations = files.flatMap((file) =>
      contentViolations(file, /GoDigital(?!CapabilityPort)|godigital(?![_-]enabled)/i, 'GR-12 violation: GoDigital Core implementation logic must not be hardcoded in demoTest or vertical layers.')
    );
    return result('GR-12', 'GoDigital Core isolation', 'Only ports, docs, and disabled flags may reference GoDigital at this stage.', violations);
  },
};
