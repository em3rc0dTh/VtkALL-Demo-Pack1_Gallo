import { GuardrailRule, result } from '../ruleTypes';
import { importViolations } from './shared';

export const gr22HermesNoMongoose: GuardrailRule = {
  id: 'GR-22',
  name: 'Hermes integration cannot import Mongoose models',
  run: (context) => {
    const hermesFiles = context.files.filter((file) =>
      file.path.startsWith('backend/src/agent/hermes/') &&
      !file.path.startsWith('backend/src/agent/hermes/context/') &&
      !file.path.startsWith('backend/src/agent/hermes/tests/')
    );
    const violations = hermesFiles.flatMap((file) =>
      importViolations(file, (specifier) => specifier.includes('/models/') || specifier.includes('mongoose'), (specifier) =>
        `GR-22 violation: Hermes integration cannot import Mongoose or models (${specifier}).`
      )
    );
    return result('GR-22', 'Hermes integration cannot import Mongoose models', 'Hermes backend gateway remains model-free.', violations);
  },
};
