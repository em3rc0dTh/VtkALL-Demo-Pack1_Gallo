import { GuardrailRule, result } from '../ruleTypes';
import { contentViolations, isTestOrFixture } from './shared';

export const gr26HermesKeyNoDefault: GuardrailRule = {
  id: 'GR-26',
  name: 'Hermes API key has no production default',
  run: (context) => {
    const files = context.files.filter((file) =>
      !isTestOrFixture(file) &&
      !file.path.startsWith('docs/') &&
      !file.path.startsWith('hermes/scripts/')
    );
    const violations = files.flatMap((file) =>
      contentViolations(file, /HERMES_API_KEY=local-hermes-dev-key|apiKey\s*[:=]\s*process\.env\.HERMES_API_KEY\s*\|\|\s*['"]local-hermes-dev-key['"]/i, 'GR-26 violation: Hermes API key must not have a production default.')
    );
    return result('GR-26', 'Hermes API key has no production default', 'Hermes key is empty in examples and required at runtime.', violations);
  },
};
