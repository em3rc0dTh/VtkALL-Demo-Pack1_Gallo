import mongoose, { Schema } from 'mongoose';

export interface IWorkTeamScheduleRule {
  _id: string;
  businessSlug: string;
  teamId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  capacity?: number;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const WorkTeamScheduleRuleSchema: Schema = new Schema(
  {
    _id: { type: String, required: true },
    businessSlug: { type: String, required: true, index: true },
    teamId: { type: String, required: true, index: true },
    weekday: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    capacity: { type: Number, min: 1 },
    active: { type: Boolean, required: true, default: true },
  },
  {
    timestamps: true,
    strict: false,
    _id: false,
  }
);

WorkTeamScheduleRuleSchema.index({ businessSlug: 1, teamId: 1, weekday: 1, active: 1 });

export const WorkTeamScheduleRule = mongoose.model<IWorkTeamScheduleRule>('WorkTeamScheduleRule', WorkTeamScheduleRuleSchema);
