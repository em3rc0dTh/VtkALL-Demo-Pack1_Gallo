import mongoose, { Schema, Document } from 'mongoose';

export interface IManagedEntity {
  _id: string;
  businessSlug: string;
  customerId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const ManagedEntitySchema: Schema = new Schema(
  {
    _id: { type: String, required: true },
    businessSlug: { type: String, required: true, index: true },
    customerId: { type: String, required: true },
  },
  {
    timestamps: true,
    strict: false,
    _id: false,
  }
);

ManagedEntitySchema.index({ businessSlug: 1, customerId: 1 });
ManagedEntitySchema.index({ businessSlug: 1, type: 1 });
ManagedEntitySchema.index({ businessSlug: 1, 'data.plate': 1 });

export const ManagedEntity = mongoose.model<IManagedEntity>('ManagedEntity', ManagedEntitySchema);
