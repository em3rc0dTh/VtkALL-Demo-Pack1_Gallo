import mongoose, { Schema } from 'mongoose';
import { LandingContent } from '../services/landing/landing.contracts';

export interface ILandingPageVersion {
  _id: string;
  landingPageId: string;
  businessSlug: string;
  pageSlug: string;
  version: number;
  title: string;
  content: LandingContent;
  action: 'seed' | 'publish' | 'restore';
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const LandingPageVersionSchema = new Schema(
  {
    _id: { type: String, required: true },
    landingPageId: { type: String, required: true, index: true },
    businessSlug: { type: String, required: true, index: true },
    pageSlug: { type: String, required: true },
    version: { type: Number, required: true },
    title: { type: String, required: true },
    content: { type: Schema.Types.Mixed, required: true },
    action: { type: String, enum: ['seed', 'publish', 'restore'], required: true },
    createdBy: { type: String },
  },
  {
    timestamps: true,
    strict: true,
    _id: false,
  }
);

LandingPageVersionSchema.index({ landingPageId: 1, version: 1 }, { unique: true });

export const LandingPageVersion = mongoose.model<ILandingPageVersion>('LandingPageVersion', LandingPageVersionSchema);
