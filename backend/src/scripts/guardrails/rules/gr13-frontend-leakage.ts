import { GuardrailRule, result } from '../ruleTypes';
import { importViolations } from './shared';

export const gr13FrontendLeakage: GuardrailRule = {
  id: 'GR-13',
  name: 'No direct frontend/backend architecture leakage',
  run: (context) => {
    const frontendFiles = context.files.filter((file) => file.path.startsWith('frontend/'));
    const violations = frontendFiles.flatMap((file) =>
      importViolations(
        file,
        (specifier) => /backend\/src\/models|backend\/src\/db|@temporalio\/(?:client|worker)|mongoose|mongodb/i.test(specifier),
        (specifier) => `GR-13 violation: frontend imports backend/runtime infrastructure (${specifier}).`
      )
    );
    return result('GR-13', 'No direct frontend/backend architecture leakage', 'Frontend does not import backend models, DB, Temporal, Mongoose, or Mongo drivers.', violations);
  },
};
