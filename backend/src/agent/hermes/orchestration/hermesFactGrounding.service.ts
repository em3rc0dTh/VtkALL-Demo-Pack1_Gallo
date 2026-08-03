import { HermesReadOnlyContext } from '../context/hermesContext.contract';

const normalize = (value: string) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export const currentMessageHasFact = (message: string, pattern: RegExp) =>
  pattern.test(normalize(message));

export const conversationHasConfirmedFact = (context: HermesReadOnlyContext | undefined, pattern: RegExp) => {
  const memoryFacts = context?.conversation?.memory?.salientFacts || [];
  if (memoryFacts.some((fact) => pattern.test(normalize(String(fact.value || fact.key || ''))))) return true;
  return (context?.conversation?.history || [])
    .slice(-6)
    .some((entry) => entry.role === 'user' && pattern.test(normalize(entry.content)));
};

export const mayStateAsReportedFact = (input: {
  message: string;
  context?: HermesReadOnlyContext;
  pattern: RegExp;
}) =>
  currentMessageHasFact(input.message, input.pattern)
  || conversationHasConfirmedFact(input.context, input.pattern);
