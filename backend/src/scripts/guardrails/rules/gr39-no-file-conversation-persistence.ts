import { GuardrailRule, result } from '../ruleTypes';
import { contentViolations } from './shared';

export const gr39NoFileConversationPersistence: GuardrailRule = {
  id: 'GR-39',
  name: 'No file-based conversation persistence',
  run: (context) => {
    const files = context.files.filter((file) => file.path.startsWith('backend/src/agent/hermes/') || file.path.startsWith('backend/src/services/agentConversation'));
    const violations = files.flatMap((file) =>
      contentViolations(file, /writeFileSync|appendFileSync|createWriteStream|\.jsonl/i, 'GR-39 violation: HERMES-04 must not persist conversations to files.')
    );
    return result('GR-39', 'No file-based conversation persistence', 'Conversation persistence uses CustomerInteraction, not files.', violations);
  },
};
