import { HermesConversationMemory } from '../models/HermesConversationMemory.model';
import {
  HermesConversationMemoryFact,
  HermesConversationMemoryPatch,
  HermesConversationMemorySnapshot,
} from '../agent/hermes/contracts/hermesConversationMemory.contract';

const emptyMemory = (businessSlug: string, conversationId: string): HermesConversationMemorySnapshot => ({
  businessSlug,
  conversationId,
  version: 0,
  summary: '',
  salientFacts: [],
  unresolvedQuestions: [],
});

const normalizeFact = (fact: HermesConversationMemoryFact): HermesConversationMemoryFact | undefined => {
  const key = String(fact?.key || '').trim();
  if (!key) return undefined;
  const category = String(fact.category || 'conversation_context');
  const confidence = String(fact.confidence || 'medium');
  if (!['symptom', 'preference', 'conversation_context', 'correction', 'alias'].includes(category)) return undefined;
  if (!['low', 'medium', 'high'].includes(confidence)) return undefined;
  return {
    key,
    value: fact.value,
    category: category as HermesConversationMemoryFact['category'],
    confidence: confidence as HermesConversationMemoryFact['confidence'],
    sourceMessageId: String(fact.sourceMessageId || '').trim(),
  };
};

const toSnapshot = (doc: any, businessSlug: string, conversationId: string): HermesConversationMemorySnapshot => {
  if (!doc) return emptyMemory(businessSlug, conversationId);
  return {
    businessSlug,
    conversationId,
    version: Number(doc.version || 0),
    summary: String(doc.summary || ''),
    activeTopic: doc.activeTopic ? String(doc.activeTopic) : undefined,
    salientFacts: Array.isArray(doc.salientFacts) ? doc.salientFacts.map((fact: any) => ({
      key: String(fact.key || ''),
      value: fact.value,
      category: fact.category,
      confidence: fact.confidence,
      sourceMessageId: String(fact.sourceMessageId || ''),
    })).filter((fact: HermesConversationMemoryFact) => fact.key) : [],
    unresolvedQuestions: Array.isArray(doc.unresolvedQuestions) ? doc.unresolvedQuestions.map((question: any) => ({
      topic: String(question.topic || ''),
      question: String(question.question || ''),
    })).filter((question: any) => question.topic && question.question) : [],
    lastAssistantQuestion: doc.lastAssistantQuestion?.question ? {
      question: String(doc.lastAssistantQuestion.question),
      expectedField: doc.lastAssistantQuestion.expectedField ? String(doc.lastAssistantQuestion.expectedField) : undefined,
      messageId: String(doc.lastAssistantQuestion.messageId || ''),
    } : undefined,
    lastProcessedMessageId: doc.lastProcessedMessageId ? String(doc.lastProcessedMessageId) : undefined,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

export const readConversationMemory = async (input: {
  businessSlug: string;
  conversationId: string;
}): Promise<HermesConversationMemorySnapshot> => {
  try {
    const doc = await HermesConversationMemory.findOne({
      businessSlug: input.businessSlug,
      conversationId: input.conversationId,
    }).lean().exec();
    return toSnapshot(doc, input.businessSlug, input.conversationId);
  } catch (error) {
    console.warn('[hermes-memory] read failed', error);
    return emptyMemory(input.businessSlug, input.conversationId);
  }
};

const applyPatch = (
  current: HermesConversationMemorySnapshot,
  patch: HermesConversationMemoryPatch,
  messageId: string
) => {
  const next: HermesConversationMemorySnapshot = {
    ...current,
    salientFacts: [...current.salientFacts],
    unresolvedQuestions: [...current.unresolvedQuestions],
  };

  if (patch.summary !== undefined) next.summary = String(patch.summary || '').slice(0, 4000);
  if (patch.activeTopic !== undefined) next.activeTopic = patch.activeTopic ? String(patch.activeTopic).slice(0, 200) : undefined;

  const removeKeys = new Set((patch.removeFactKeys || []).map((key) => String(key || '').trim()).filter(Boolean));
  if (removeKeys.size) next.salientFacts = next.salientFacts.filter((fact) => !removeKeys.has(fact.key));

  for (const rawFact of patch.upsertFacts || []) {
    const fact = normalizeFact({
      ...rawFact,
      sourceMessageId: rawFact.sourceMessageId || messageId,
    });
    if (!fact) continue;
    const index = next.salientFacts.findIndex((item) => item.key === fact.key);
    if (index >= 0) next.salientFacts[index] = fact;
    else next.salientFacts.push(fact);
  }
  next.salientFacts = next.salientFacts.slice(-40);

  if (patch.unresolvedQuestions) {
    next.unresolvedQuestions = patch.unresolvedQuestions
      .map((question) => ({
        topic: String(question.topic || '').trim(),
        question: String(question.question || '').trim(),
      }))
      .filter((question) => question.topic && question.question)
      .slice(-10);
  }

  if (patch.lastAssistantQuestion !== undefined) {
    next.lastAssistantQuestion = patch.lastAssistantQuestion
      ? {
        question: String(patch.lastAssistantQuestion.question || '').trim(),
        expectedField: patch.lastAssistantQuestion.expectedField ? String(patch.lastAssistantQuestion.expectedField) : undefined,
        messageId: String(patch.lastAssistantQuestion.messageId || messageId),
      }
      : undefined;
    if (!next.lastAssistantQuestion?.question) next.lastAssistantQuestion = undefined;
  }

  next.lastProcessedMessageId = messageId;
  next.version = Number(current.version || 0) + 1;
  return next;
};

export const applyConversationMemoryPatch = async (input: {
  businessSlug: string;
  conversationId: string;
  messageId: string;
  patch?: HermesConversationMemoryPatch;
}): Promise<HermesConversationMemorySnapshot> => {
  const messageId = String(input.messageId || '').trim();
  const current = await readConversationMemory(input);
  if (!input.patch || !messageId || current.lastProcessedMessageId === messageId) return current;

  try {
    const next = applyPatch(current, input.patch, messageId);
    const updated = await HermesConversationMemory.findOneAndUpdate(
      {
        businessSlug: input.businessSlug,
        conversationId: input.conversationId,
        $or: [
          { lastProcessedMessageId: { $ne: messageId } },
          { lastProcessedMessageId: { $exists: false } },
        ],
      },
      {
        $set: {
          summary: next.summary,
          activeTopic: next.activeTopic,
          salientFacts: next.salientFacts,
          unresolvedQuestions: next.unresolvedQuestions,
          lastAssistantQuestion: next.lastAssistantQuestion,
          lastProcessedMessageId: messageId,
        },
        $inc: { version: 1 },
        $setOnInsert: {
          businessSlug: input.businessSlug,
          conversationId: input.conversationId,
        },
      },
      {
        upsert: true,
        new: true,
      }
    ).lean().exec();
    return toSnapshot(updated, input.businessSlug, input.conversationId);
  } catch (error) {
    console.warn('[hermes-memory] write failed', error);
    return current;
  }
};
