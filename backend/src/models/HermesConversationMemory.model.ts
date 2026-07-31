import mongoose, { Schema } from 'mongoose';

export interface IHermesConversationMemory {
  businessSlug: string;
  conversationId: string;
  version: number;
  summary: string;
  activeTopic?: string;
  salientFacts: Array<{
    key: string;
    value: unknown;
    category: string;
    confidence: string;
    sourceMessageId: string;
  }>;
  unresolvedQuestions: Array<{
    topic: string;
    question: string;
  }>;
  lastAssistantQuestion?: {
    question: string;
    expectedField?: string;
    messageId: string;
  };
  lastProcessedMessageId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const HermesConversationMemorySchema = new Schema<IHermesConversationMemory>(
  {
    businessSlug: { type: String, required: true, index: true },
    conversationId: { type: String, required: true, index: true },
    version: { type: Number, required: true, default: 0 },
    summary: { type: String, default: '' },
    activeTopic: { type: String },
    salientFacts: {
      type: [{
        key: { type: String, required: true },
        value: { type: Schema.Types.Mixed },
        category: { type: String, required: true },
        confidence: { type: String, required: true },
        sourceMessageId: { type: String, required: true },
      }],
      default: [],
    },
    unresolvedQuestions: {
      type: [{
        topic: { type: String, required: true },
        question: { type: String, required: true },
      }],
      default: [],
    },
    lastAssistantQuestion: {
      question: { type: String },
      expectedField: { type: String },
      messageId: { type: String },
    },
    lastProcessedMessageId: { type: String },
  },
  {
    timestamps: true,
  }
);

HermesConversationMemorySchema.index({ businessSlug: 1, conversationId: 1 }, { unique: true });

export const HermesConversationMemory = mongoose.model<IHermesConversationMemory>(
  'HermesConversationMemory',
  HermesConversationMemorySchema
);
