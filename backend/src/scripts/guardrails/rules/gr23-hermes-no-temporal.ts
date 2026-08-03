import { GuardrailRule, result } from '../ruleTypes';
import { importViolations } from './shared';

export const gr23HermesNoTemporal: GuardrailRule = {
  id: 'GR-23',
  name: 'Hermes integration cannot import Temporal SDK',
  run: (context) => {
    const hermesFiles = context.files.filter((file) => file.path.startsWith('backend/src/agent/hermes/'));
    const violations = hermesFiles.flatMap((file) =>
      importViolations(
        file,
        (specifier) => specifier.includes('@temporalio') || (specifier.includes('/temporal/') && !specifier.includes('/mcp/temporal/schemas/')),
        (specifier) =>
        `GR-23 violation: Hermes integration cannot import Temporal (${specifier}).`
      )
    );
    return result('GR-23', 'Hermes integration cannot import Temporal SDK', 'Hermes backend gateway remains Temporal-free.', violations);
  },
};
