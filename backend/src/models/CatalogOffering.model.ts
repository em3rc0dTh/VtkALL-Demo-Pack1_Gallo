import mongoose, { Schema, Document } from 'mongoose';

export interface ICatalogOffering {
  _id: string;
  businessSlug: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const CatalogOfferingSchema: Schema = new Schema(
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

export const CatalogOffering = mongoose.model<ICatalogOffering>('CatalogOffering', CatalogOfferingSchema);
