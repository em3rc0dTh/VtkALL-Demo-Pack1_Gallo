import mongoose, { Schema } from 'mongoose';

export interface IWorkTeamScheduleOverrideWindow {
  startTime: string;
  endTime: string;
  capacity?: number;
}

export interface IWorkTeamScheduleOverride {
  _id: string;
  businessSlug: string;
  teamId: string;
  date: string;
  mode: 'block' | 'replace' | 'extend';
  windows: IWorkTeamScheduleOverrideWindow[];
  reason?: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const WorkTeamScheduleOverrideSchema: Schema = new Schema(
  {
    _id: { type: String, required: true },
    businessSlug: { type: String, required: true, index: true },
    teamId: { type: String, required: true, index: true },
    date: { type: String, required: true },
    mode: {
      type: String,
      required: true,
      enum: ['block', 'replace', 'extend'],
    },
    windows: [
      {
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        capacity: { type: Number, min: 1 },
      },
    ],
    reason: { type: String },
    active: { type: Boolean, required: true, default: true },
  },
  {
    timestamps: true,
    strict: false,
    _id: false,
  }
);

WorkTeamScheduleOverrideSchema.index({ businessSlug: 1, teamId: 1, date: 1, active: 1 });

export const WorkTeamScheduleOverride = mongoose.model<IWorkTeamScheduleOverride>('WorkTeamScheduleOverride', WorkTeamScheduleOverrideSchema);
