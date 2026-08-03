import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer {
  _id: string;
  businessSlug: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const CustomerSchema: Schema = new Schema(
  {
    _id: { type: String, required: true },
    businessSlug: { type: String, required: true, index: true },
  },
  {
    timestamps: true,
    strict: false,
    _id: false,
  }
);

CustomerSchema.index({ businessSlug: 1, 'contact.phones.normalized': 1 });

export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);
