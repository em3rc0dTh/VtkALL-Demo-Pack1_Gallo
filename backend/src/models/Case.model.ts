import mongoose, { Schema, Document } from 'mongoose';

export interface ICase {
  _id: string;
  businessSlug: string;
  customerId: string;
  managedEntityId?: string;
  status: string;
  caseNumber?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const CaseSchema: Schema = new Schema(
  {
    _id: { type: String, required: true },
    businessSlug: { type: String, required: true, index: true },
    customerId: { type: String, required: true },
    managedEntityId: { type: String },
    status: { type: String, required: true },
  },
  {
    timestamps: true,
    strict: false,
    _id: false,
  }
);

CaseSchema.index({ businessSlug: 1, caseNumber: 1 });
CaseSchema.index({ businessSlug: 1, customerId: 1 });
CaseSchema.index({ businessSlug: 1, managedEntityId: 1 });
CaseSchema.index({ businessSlug: 1, status: 1 });

export const Case = mongoose.model<ICase>('Case', CaseSchema);
