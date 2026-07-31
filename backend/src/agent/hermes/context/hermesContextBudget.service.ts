export type HermesContextBudgetStats = {
  rawContextCharacterCount: number;
  finalContextCharacterCount: number;
  estimatedInputTokens: number;
  historyMessagesIncluded: number;
  historyMessagesDropped: number;
  memoryFactsIncluded: number;
  memoryFactsDropped: number;
  catalogOfferingsIncluded: number;
  catalogOfferingsDropped: number;
  contextReductionPercent: number;
};

export type HermesContextBudgetConfig = {
  maxHistoryMessages: number;
  maxMemoryFacts: number;
  maxCatalogOfferings: number;
  maxOfferingDescriptionChars: number;
  maxInterpretationChars: number;
  maxCompositionChars: number;
};

const numericEnv = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const hermesContextBudgetConfig = (): HermesContextBudgetConfig => ({
  maxHistoryMessages: numericEnv(process.env.HERMES_CONTEXT_MAX_HISTORY_MESSAGES, 8),
  maxMemoryFacts: numericEnv(process.env.HERMES_CONTEXT_MAX_MEMORY_FACTS, 8),
  maxCatalogOfferings: numericEnv(process.env.HERMES_CONTEXT_MAX_CATALOG_OFFERINGS, 5),
  maxOfferingDescriptionChars: numericEnv(process.env.HERMES_CONTEXT_MAX_OFFERING_DESCRIPTION_CHARS, 220),
  maxInterpretationChars: numericEnv(process.env.HERMES_CONTEXT_MAX_INTERPRETATION_CHARS, 12000),
  maxCompositionChars: numericEnv(process.env.HERMES_CONTEXT_MAX_COMPOSITION_CHARS, 9000),
});

export const estimateTokens = (text: string) => Math.ceil(String(text || '').length / 4);

export const compactWhitespace = (value: unknown) =>
  String(value || '').replace(/\s+/g, ' ').trim();

export const truncateText = (value: unknown, maxChars: number) => {
  const text = compactWhitespace(value);
  if (!text || text.length <= maxChars) return text;
  return `${text.slice(0, Math.max(0, maxChars - 1)).trim()}…`;
};

export const pruneEmpty = (value: any): any => {
  if (Array.isArray(value)) {
    const items = value.map(pruneEmpty).filter((item) => item !== undefined);
    return items.length ? items : undefined;
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value)
      .map(([key, item]) => [key, pruneEmpty(item)] as const)
      .filter(([, item]) => item !== undefined && item !== null && item !== '');
    return entries.length ? Object.fromEntries(entries) : undefined;
  }
  return value === undefined || value === null || value === '' ? undefined : value;
};

export const compactJson = (value: unknown) => JSON.stringify(pruneEmpty(value) || {});

export const buildBudgetStats = (input: {
  rawPayload: unknown;
  finalPayload: unknown;
  historyMessagesIncluded: number;
  historyMessagesDropped: number;
  memoryFactsIncluded: number;
  memoryFactsDropped: number;
  catalogOfferingsIncluded: number;
  catalogOfferingsDropped: number;
}): HermesContextBudgetStats => {
  const rawContextCharacterCount = compactJson(input.rawPayload).length;
  const finalContextCharacterCount = compactJson(input.finalPayload).length;
  const reduction = rawContextCharacterCount > 0
    ? Math.round(((rawContextCharacterCount - finalContextCharacterCount) / rawContextCharacterCount) * 100)
    : 0;
  return {
    rawContextCharacterCount,
    finalContextCharacterCount,
    estimatedInputTokens: estimateTokens(compactJson(input.finalPayload)),
    historyMessagesIncluded: input.historyMessagesIncluded,
    historyMessagesDropped: input.historyMessagesDropped,
    memoryFactsIncluded: input.memoryFactsIncluded,
    memoryFactsDropped: input.memoryFactsDropped,
    catalogOfferingsIncluded: input.catalogOfferingsIncluded,
    catalogOfferingsDropped: input.catalogOfferingsDropped,
    contextReductionPercent: Math.max(0, reduction),
  };
};
