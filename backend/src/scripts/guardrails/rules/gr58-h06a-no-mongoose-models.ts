import { GuardrailRule, result } from '../ruleTypes';
import { contentViolations } from './shared';

export const gr58H06ANoMongooseModels: GuardrailRule = {
  id: 'GR-58',
  name: 'Hermes scheduling cannot import Mongoose models',
  run: (context) => {
    const files = context.files.filter((file) => file.path.startsWith('backend/src/agent/hermes/scheduling/'));
    const violations = files.flatMap((file) =>
      contentViolations(file, /from\s+['"][^'"]*models\/[^'"]*['"]/i, 'GR-58 violation: Hermes scheduling cannot import Mongoose models.')
    );
    return result('GR-58', 'Hermes scheduling cannot import Mongoose models', 'H06A scheduling relies on read-only context rather than direct models.', violations);
  },
};
