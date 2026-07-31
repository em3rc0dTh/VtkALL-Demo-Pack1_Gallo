import mongoose, { Schema, Document } from 'mongoose';

export interface IDecisionRecord {
  _id: string;
  businessSlug: string;
  caseId: string;
  entity: {
    type: string;
    id: string;
  };
  decisionType: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const DecisionRecordSchema: Schema = new Schema(
  {
    _id: { type: String, required: true },
    businessSlug: { type: String, required: true, index: true },
    caseId: { type: String, required: true },
    entity: {
      type: { type: String, required: true },
      id: { type: String, required: true },
    },
    decisionType: { type: String, required: true },
  },
  {
    timestamps: true,
    strict: false,
    _id: false,
  }
);

DecisionRecordSchema.index({ businessSlug: 1, caseId: 1 });
DecisionRecordSchema.index({ businessSlug: 1, 'entity.type': 1, 'entity.id': 1 });
DecisionRecordSchema.index({ businessSlug: 1, decisionType: 1 });

export const DecisionRecord = mongoose.model<IDecisionRecord>('DecisionRecord', DecisionRecordSchema);
