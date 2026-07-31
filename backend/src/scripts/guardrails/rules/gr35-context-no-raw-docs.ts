import { GuardrailRule, result } from '../ruleTypes';

export const gr35ContextNoRawDocs: GuardrailRule = {
  id: 'GR-35',
  name: 'Hermes context contains no raw Mongoose documents',
  run: (context) => {
    const builder = context.getFile('backend/src/agent/hermes/context/hermesContextBuilder.service.ts');
    const violations = [];
    if (!builder?.content.includes('HermesReadOnlyContext')) {
      violations.push({ file: builder?.path || 'backend/src/agent/hermes/context/hermesContextBuilder.service.ts', message: 'GR-35 violation: context builder must return HermesReadOnlyContext DTO.' });
    }
    if (builder?.content.includes('return profile') || builder?.content.includes('return customer')) {
      violations.push({ file: builder.path, message: 'GR-35 violation: context builder must not return raw documents.' });
    }
    return result('GR-35', 'Hermes context contains no raw Mongoose documents', 'Context builder returns reduced DTOs.', violations);
  },
};
