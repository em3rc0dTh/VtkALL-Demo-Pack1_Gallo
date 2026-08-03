import { GuardrailRule, result } from '../ruleTypes';

export const gr37ProcessReadonly: GuardrailRule = {
  id: 'GR-37',
  name: 'Hermes process context cannot expose executable actions',
  run: (context) => {
    const reader = context.getFile('backend/src/agent/hermes/context/processContext.reader.ts');
    const violations = [];
    if (!reader?.content.includes('allowedActions: []')) {
      violations.push({ file: reader?.path || 'backend/src/agent/hermes/context/processContext.reader.ts', message: 'GR-37 violation: process context must expose empty allowedActions.' });
    }
    if (!reader?.content.includes('informationalOnly: true')) {
      violations.push({ file: reader?.path || 'backend/src/agent/hermes/context/processContext.reader.ts', message: 'GR-37 violation: process context must be informationalOnly.' });
    }
    return result('GR-37', 'Hermes process context cannot expose executable actions', 'Process context is read-only and informational.', violations);
  },
};
