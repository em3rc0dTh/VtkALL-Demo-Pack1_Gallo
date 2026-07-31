import mongoose, { Schema } from 'mongoose';
import { LandingContent, LandingStatus } from '../services/landing/landing.contracts';

export interface ILandingPage {
  _id: string;
  businessSlug: string;
  pageSlug: string;
  title: string;
  status: LandingStatus;
  draft: LandingContent;
  published?: LandingContent;
  publishedVersion?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const LandingPageSchema = new Schema(
  {
    _id: { type: String, required: true },
    businessSlug: { type: String, required: true, index: true },
    pageSlug: { type: String, required: true },
    title: { type: String, required: true },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft', index: true },
    draft: { type: Schema.Types.Mixed, required: true },
    published: { type: Schema.Types.Mixed },
    publishedVersion: { type: Number },
  },
  {
    timestamps: true,
    strict: true,
    _id: false,
  }
);

LandingPageSchema.index({ businessSlug: 1, pageSlug: 1 }, { unique: true });

export const LandingPage = mongoose.model<ILandingPage>('LandingPage', LandingPageSchema);
