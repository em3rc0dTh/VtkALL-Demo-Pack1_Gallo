import { GuardrailRule, result } from '../ruleTypes';
import { contentViolations } from './shared';

export const gr34ContextReadersReadonly: GuardrailRule = {
  id: 'GR-34',
  name: 'Hermes context readers are read-only',
  run: (context) => {
    const files = context.files.filter((file) => file.path.startsWith('backend/src/agent/hermes/context/'));
    const violations = files.flatMap((file) =>
      contentViolations(file, /\.(create|updateOne|updateMany|deleteOne|deleteMany|findOneAndUpdate|save)\s*\(/, 'GR-34 violation: Hermes context readers must be read-only.')
    );
    return result('GR-34', 'Hermes context readers are read-only', 'Hermes context readers only use read operations.', violations);
  },
};
