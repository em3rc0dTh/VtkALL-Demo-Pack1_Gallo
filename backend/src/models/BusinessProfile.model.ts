import mongoose, { Schema, Document } from 'mongoose';

export interface IBusinessProfile {
  _id: string;
  businessSlug: string;
  businessName?: string;
  verticalType?: string;
  brand?: any;
  agent?: any;
  settings?: any;
  settingsVersion?: number;
  labels?: any;
  features?: any;
  statusProfileId?: string;
  workflowProfileId?: string;
  catalogProfileId?: string;
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const BusinessProfileSchema: Schema = new Schema(
  {
    _id: { type: String, required: true },
    businessSlug: { type: String, required: true, index: true },
    businessName: { type: String },
    verticalType: { type: String },
    brand: { type: Schema.Types.Mixed },
    agent: { type: Schema.Types.Mixed },
    settings: { type: Schema.Types.Mixed },
    settingsVersion: { type: Number, default: 0 },
    labels: { type: Schema.Types.Mixed },
    features: { type: Schema.Types.Mixed },
    statusProfileId: { type: String },
    workflowProfileId: { type: String },
    catalogProfileId: { type: String },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    strict: false,
    _id: false,
  }
);

export const BusinessProfile = mongoose.model<IBusinessProfile>('BusinessProfile', BusinessProfileSchema);
