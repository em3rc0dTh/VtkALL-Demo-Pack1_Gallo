import { GuardrailRule, result } from '../ruleTypes';
import { importViolations } from './shared';

export const gr04ModelAccess: GuardrailRule = {
  id: 'GR-04',
  name: 'Model access restrictions',
  run: (context) => {
    const forbiddenFiles = context.files.filter((file) =>
      file.path.includes('backend/src/temporal/workflows/') ||
      file.path.startsWith('frontend/') ||
      file.path.startsWith('backend/src/routes/') ||
      file.path.includes('backend/src/platform/ports/') ||
      file.path.includes('backend/src/platform/adapters/')
    );
    const violations = forbiddenFiles.flatMap((file) =>
      importViolations(file, (specifier) => specifier.includes('/models/') || specifier.includes('backend/src/models'), (specifier) =>
        `GR-04 violation: forbidden layer imports Mongoose model ${specifier}.`
      )
    );
    return result('GR-04', 'Model access restrictions', 'Mongoose models stay out of workflows, frontend, route definitions, ports, and adapters.', violations);
  },
};
