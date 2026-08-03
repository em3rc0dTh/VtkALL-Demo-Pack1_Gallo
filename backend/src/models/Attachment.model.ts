import mongoose, { Schema, Document } from 'mongoose';

export interface IAttachment {
  _id: string;
  businessSlug: string;
  caseId: string;
  entity?: {
    type: string;
    id: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const AttachmentSchema: Schema = new Schema(
  {
    _id: { type: String, required: true },
    businessSlug: { type: String, required: true, index: true },
    caseId: { type: String, required: true },
    entity: {
      type: { type: String },
      id: { type: String },
    },
  },
  {
    timestamps: true,
    strict: false,
    _id: false,
  }
);

AttachmentSchema.index({ businessSlug: 1, caseId: 1 });
AttachmentSchema.index({ businessSlug: 1, 'entity.type': 1, 'entity.id': 1 });

export const Attachment = mongoose.model<IAttachment>('Attachment', AttachmentSchema);
