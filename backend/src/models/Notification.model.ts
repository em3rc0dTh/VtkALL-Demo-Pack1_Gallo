import mongoose, { Schema, Document } from 'mongoose';

export interface INotification {
  _id: string;
  businessSlug: string;
  caseId: string;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    _id: { type: String, required: true },
    businessSlug: { type: String, required: true, index: true },
    caseId: { type: String, required: true },
    status: { type: String, required: true },
  },
  {
    timestamps: true,
    strict: false,
    _id: false,
  }
);

NotificationSchema.index({ businessSlug: 1, caseId: 1 });
NotificationSchema.index({ businessSlug: 1, status: 1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
