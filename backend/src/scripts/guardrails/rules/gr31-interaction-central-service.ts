import { GuardrailRule, result } from '../ruleTypes';
import { contentViolations } from './shared';

export const gr31InteractionCentralService: GuardrailRule = {
  id: 'GR-31',
  name: 'CustomerInteraction writes use central service',
  run: (context) => {
    const files = context.files.filter((file) =>
      file.path.startsWith('backend/src/') &&
      file.path !== 'backend/src/services/agentConversation.service.ts' &&
      !file.path.includes('/tests/') &&
      !file.path.includes('/controllers/customerInteractions.controller.ts') &&
      !file.path.includes('/services/seed.service.ts') &&
      !file.path.includes('/controllers/relational.controller.ts')
    );
    const violations = files.flatMap((file) =>
      contentViolations(file, /CustomerInteraction\.(create|updateOne|updateMany|findOneAndUpdate|deleteOne|deleteMany)\s*\(/, 'GR-31 violation: runtime CustomerInteraction writes must use agentConversation.service.')
    );
    return result('GR-31', 'CustomerInteraction writes use central service', 'Runtime code writes interactions through the central service.', violations);
  },
};
