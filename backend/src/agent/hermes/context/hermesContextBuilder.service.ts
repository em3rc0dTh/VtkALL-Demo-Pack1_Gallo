import { getVisibleConversationHistory } from '../../../services/agentConversation.service';
import { readBusinessContext } from './businessContext.reader';
import { readCatalogContext } from './catalogContext.reader';
import { readCaseContext } from './caseContext.reader';
import { readCustomerContext } from './customerContext.reader';
import { HermesReadOnlyContext } from './hermesContext.contract';
import { readManagedEntityContext } from './managedEntityContext.reader';
import { summarizeProcessContext } from './processContext.reader';
import { readConversationMemory } from '../memory/hermesConversationMemory.service';

export interface HermesContextBuildInput {
  businessSlug: string;
  conversationId: string;
  channel?: string;
  customerId?: string;
  managedEntityId?: string;
  caseId?: string;
  processState?: any;
}

export const buildHermesReadOnlyContext = async (input: HermesContextBuildInput): Promise<{
  context: HermesReadOnlyContext;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
}> => {
  if (!input.businessSlug || !input.conversationId) {
    throw new Error('businessSlug and conversationId are required for Hermes context.');
  }

  const history = await getVisibleConversationHistory({
    businessSlug: input.businessSlug,
    conversationId: input.conversationId,
  });

  const [business, catalog, customer, caseSummary, memory] = await Promise.all([
    process.env.HERMES_READ_BUSINESS_CONTEXT === 'true' ? readBusinessContext(input.businessSlug) : undefined,
    process.env.HERMES_READ_CATALOG_CONTEXT === 'true' ? readCatalogContext(input.businessSlug) : [],
    process.env.HERMES_READ_CUSTOMER_CONTEXT === 'true' ? readCustomerContext({ businessSlug: input.businessSlug, customerId: input.customerId }) : undefined,
    process.env.HERMES_READ_CASE_CONTEXT === 'true' ? readCaseContext({
      businessSlug: input.businessSlug,
      conversationId: input.conversationId,
      customerId: input.customerId,
      caseId: input.caseId,
    }) : undefined,
    readConversationMemory({
      businessSlug: input.businessSlug,
      conversationId: input.conversationId,
    }),
  ]);

  const managedEntity = process.env.HERMES_READ_CASE_CONTEXT === 'true'
    ? await readManagedEntityContext({ businessSlug: input.businessSlug, managedEntityId: input.managedEntityId })
    : undefined;

  return {
    context: {
      business,
      conversation: {
        conversationId: input.conversationId,
        channel: input.channel || 'web_agent',
        history: history.slice(-12),
        memory: {
          version: memory.version,
          summary: memory.summary,
          activeTopic: memory.activeTopic,
          salientFacts: memory.salientFacts.map((fact) => ({
            key: fact.key,
            value: fact.value,
            category: fact.category,
            confidence: fact.confidence,
          })),
          unresolvedQuestions: memory.unresolvedQuestions,
          lastAssistantQuestion: memory.lastAssistantQuestion,
        },
      },
      customer,
      managedEntity,
      case: caseSummary,
      process: process.env.HERMES_READ_PROCESS_CONTEXT === 'true' ? summarizeProcessContext(input.processState) : undefined,
      catalog,
      permissions: {
        mode: 'shadow',
        readOnly: true,
        canExecuteActions: false,
      },
    },
    history,
  };
};
