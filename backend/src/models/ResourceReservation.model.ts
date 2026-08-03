import mongoose, { Schema } from 'mongoose';

export interface IResourceReservation {
  _id: string;
  businessSlug: string;
  teamId: string;
  catalogOfferingId: string;
  appointmentId?: string;
  customerId?: string;
  caseId?: string;
  workflowId?: string;
  startAt: Date;
  endAt: Date;
  durationMinutes: number;
  slotGranularityMinutes: number;
  requiredUnits: number;
  slotKeys: string[];
  status: 'held' | 'booked' | 'cancelled' | 'released' | 'expired';
  createdAt?: Date;
  updatedAt?: Date;
}

const ResourceReservationSchema: Schema = new Schema(
  {
    _id: { type: String, required: true },
    businessSlug: { type: String, required: true, index: true },
    teamId: { type: String, required: true, index: true },
    catalogOfferingId: { type: String, required: true, index: true },
    appointmentId: { type: String },
    customerId: { type: String },
    caseId: { type: String },
    workflowId: { type: String },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    durationMinutes: { type: Number, required: true },
    slotGranularityMinutes: { type: Number, required: true, default: 15 },
    requiredUnits: { type: Number, required: true },
    slotKeys: [{ type: String, required: true }],
    status: {
      type: String,
      required: true,
      enum: ['held', 'booked', 'cancelled', 'released', 'expired'],
      default: 'booked',
    },
  },
  {
    timestamps: true,
    strict: false,
    _id: false,
  }
);

ResourceReservationSchema.index({ businessSlug: 1, teamId: 1, status: 1, startAt: 1 });
ResourceReservationSchema.index({ businessSlug: 1, appointmentId: 1 });
ResourceReservationSchema.index({ businessSlug: 1, teamId: 1, slotKeys: 1, status: 1 });

export const ResourceReservation = mongoose.model<IResourceReservation>('ResourceReservation', ResourceReservationSchema);
