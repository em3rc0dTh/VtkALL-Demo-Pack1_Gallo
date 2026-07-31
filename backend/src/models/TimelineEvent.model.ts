import mongoose, { Schema, Document } from 'mongoose';

export interface ITimelineEvent {
  _id: string;
  businessSlug: string;
  caseId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const TimelineEventSchema: Schema = new Schema(
  {
    _id: { type: String, required: true },
    businessSlug: { type: String, required: true, index: true },
    caseId: { type: String, required: true },
  },
  {
    timestamps: true,
    strict: false,
    _id: false,
  }
);

TimelineEventSchema.index({ businessSlug: 1, caseId: 1, createdAt: 1 });

export const TimelineEvent = mongoose.model<ITimelineEvent>('TimelineEvent', TimelineEventSchema);
