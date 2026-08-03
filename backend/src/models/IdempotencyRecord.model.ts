import mongoose, { Schema } from 'mongoose';

export type IdempotencyStatus = 'processing' | 'succeeded' | 'failed_retryable' | 'failed_final';

export interface IIdempotencyRecord {
  _id: string;
  businessSlug: string;
  scope: string;
  idempotencyKey: string;
  requestFingerprint: string;
  operation: string;
  status: IdempotencyStatus;
  ownerToken?: string;
  leaseExpiresAt?: Date;
  result?: {
    kind: 'success';
    httpStatus?: number;
    payload?: unknown;
    entityRefs?: Array<{ type: string; id: string }>;
  };
  failure?: {
    code: string;
    message: string;
    retryable: boolean;
  };
  execution: {
    correlationId: string;
    firstCausationId: string;
    lastCausationId: string;
    workflowId?: string;
    workflowRunId?: string;
    activityId?: string;
    channel: string;
  };
  attempts: number;
  createdAt?: Date;
  updatedAt?: Date;
  completedAt?: Date;
  expiresAt?: Date;
}

const IdempotencyRecordSchema: Schema = new Schema(
  {
    _id: { type: String, required: true },
    businessSlug: { type: String, required: true, index: true },
    scope: { type: String, required: true },
    idempotencyKey: { type: String, required: true },
    requestFingerprint: { type: String, required: true },
    operation: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ['processing', 'succeeded', 'failed_retryable', 'failed_final'],
      default: 'processing',
    },
    ownerToken: { type: String },
    leaseExpiresAt: { type: Date },
    result: { type: Schema.Types.Mixed },
    failure: { type: Schema.Types.Mixed },
    execution: {
      correlationId: { type: String, required: true },
      firstCausationId: { type: String, required: true },
      lastCausationId: { type: String, required: true },
      workflowId: { type: String },
      workflowRunId: { type: String },
      activityId: { type: String },
      channel: { type: String, required: true },
    },
    attempts: { type: Number, required: true, default: 1 },
    completedAt: { type: Date },
    expiresAt: { type: Date },
  },
  {
    timestamps: true,
    strict: false,
    _id: false,
  }
);

IdempotencyRecordSchema.index({ businessSlug: 1, scope: 1, idempotencyKey: 1 }, { unique: true });
IdempotencyRecordSchema.index({ status: 1, leaseExpiresAt: 1 });
IdempotencyRecordSchema.index({ businessSlug: 1, operation: 1, requestFingerprint: 1 });

export const IdempotencyRecord = mongoose.model<IIdempotencyRecord>('IdempotencyRecord', IdempotencyRecordSchema);
