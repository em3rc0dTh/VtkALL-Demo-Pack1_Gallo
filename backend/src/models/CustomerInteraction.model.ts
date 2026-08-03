import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomerInteraction {
  _id: string;
  businessSlug: string;
  caseId: string;
  conversationId?: string;
  customerId?: string;
  managedEntityId?: string;
  channel?: 'web' | 'web_agent' | 'manual_agent_sim' | 'whatsapp' | 'api';
  direction?: 'inbound' | 'outbound';
  visibility?: 'customer' | 'internal' | 'shadow';
  interactionType?: 'customer_message' | 'agent_message' | 'system_event' | 'shadow_response' | string;
  messageId?: string;
  body?: string;
  message?: string;
  content?: {
    text: string;
    attachmentIds: string[];
  };
  participant?: {
    type: 'customer' | 'ai_agent' | 'staff' | 'system';
    agentName?: string;
    runtime?: 'legacy' | 'hermes';
  };
  execution?: {
    correlationId?: string;
    causationId?: string;
    workflowId?: string;
    channel?: string;
  };
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

const CustomerInteractionSchema: Schema = new Schema(
  {
    _id: { type: String, required: true },
    businessSlug: { type: String, required: true, index: true },
    caseId: { type: String, required: true },
    conversationId: { type: String, index: true },
    customerId: { type: String, index: true },
    managedEntityId: { type: String },
    channel: { type: String },
    direction: { type: String },
    visibility: { type: String, default: 'customer', index: true },
    interactionType: { type: String },
    messageId: { type: String },
    body: { type: String },
    message: { type: String },
    content: {
      text: { type: String },
      attachmentIds: { type: [String], default: [] },
    },
    participant: {
      type: { type: String },
      agentName: { type: String },
      runtime: { type: String },
    },
    execution: {
      correlationId: { type: String },
      causationId: { type: String },
      workflowId: { type: String },
      channel: { type: String },
    },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    strict: false,
    _id: false,
  }
);

CustomerInteractionSchema.index({ businessSlug: 1, caseId: 1 });
CustomerInteractionSchema.index({ businessSlug: 1, conversationId: 1, createdAt: 1 });
CustomerInteractionSchema.index({ businessSlug: 1, caseId: 1, createdAt: -1 });
CustomerInteractionSchema.index({ businessSlug: 1, customerId: 1, createdAt: -1 });
CustomerInteractionSchema.index({ businessSlug: 1, visibility: 1, createdAt: -1 });
CustomerInteractionSchema.index(
  { businessSlug: 1, conversationId: 1, messageId: 1, direction: 1, 'participant.runtime': 1 },
  { sparse: true }
);

export const CustomerInteraction = mongoose.model<ICustomerInteraction>('CustomerInteraction', CustomerInteractionSchema);
