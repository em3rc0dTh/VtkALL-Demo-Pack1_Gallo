import mongoose, { Schema } from 'mongoose';

export interface IWorkTeam {
  _id: string;
  businessSlug: string;
  name: string;
  type: 'frontdesk' | 'mechanics' | 'detailing' | 'consultation' | 'bodywork' | 'other';
  capacity: number;
  slotGranularityMinutes: number;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const WorkTeamSchema: Schema = new Schema(
  {
    _id: { type: String, required: true },
    businessSlug: { type: String, required: true, index: true },
    name: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ['frontdesk', 'mechanics', 'detailing', 'consultation', 'bodywork', 'other'],
      default: 'other',
    },
    capacity: { type: Number, required: true, default: 1, min: 1 },
    slotGranularityMinutes: { type: Number, required: true, default: 15, min: 1 },
    active: { type: Boolean, required: true, default: true },
  },
  {
    timestamps: true,
    strict: false,
    _id: false,
  }
);

WorkTeamSchema.index({ businessSlug: 1, active: 1 });
WorkTeamSchema.index({ businessSlug: 1, type: 1 });

export const WorkTeam = mongoose.model<IWorkTeam>('WorkTeam', WorkTeamSchema);
