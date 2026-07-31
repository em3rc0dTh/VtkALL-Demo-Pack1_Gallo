export type HermesConversationMemoryFactCategory =
  | 'symptom'
  | 'preference'
  | 'conversation_context'
  | 'correction'
  | 'alias';

export type HermesConversationMemoryConfidence = 'low' | 'medium' | 'high';

export interface HermesConversationMemoryFact {
  key: string;
  value: unknown;
  category: HermesConversationMemoryFactCategory;
  confidence: HermesConversationMemoryConfidence;
  sourceMessageId: string;
}

export interface HermesConversationMemoryQuestion {
  topic: string;
  question: string;
}

export interface HermesConversationMemoryLastQuestion {
  question: string;
  expectedField?: string;
  messageId: string;
}

export interface HermesConversationMemorySnapshot {
  businessSlug: string;
  conversationId: string;
  version: number;
  summary: string;
  activeTopic?: string;
  salientFacts: HermesConversationMemoryFact[];
  unresolvedQuestions: HermesConversationMemoryQuestion[];
  lastAssistantQuestion?: HermesConversationMemoryLastQuestion;
  lastProcessedMessageId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface HermesConversationMemoryPatch {
  summary?: string;
  activeTopic?: string | null;
  upsertFacts?: HermesConversationMemoryFact[];
  removeFactKeys?: string[];
  unresolvedQuestions?: HermesConversationMemoryQuestion[];
  lastAssistantQuestion?: HermesConversationMemoryLastQuestion | null;
}
