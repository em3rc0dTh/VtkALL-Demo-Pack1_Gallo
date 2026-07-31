import mongoose, { Schema } from 'mongoose';

export interface IAvailabilitySlot {
  _id: string;
  businessSlug: string;
  catalogOfferingId: string;
  startAt: Date;
  endAt: Date;
  status: 'available' | 'booked' | 'cancelled';
  appointmentId?: string;
  customerId?: string;
  caseId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const AvailabilitySlotSchema: Schema = new Schema(
  {
    _id: { type: String, required: true },
    businessSlug: { type: String, required: true, index: true },
    catalogOfferingId: { type: String, required: true, index: true },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    status: {
      type: String,
      required: true,
      enum: ['available', 'booked', 'cancelled'],
      default: 'available',
    },
    appointmentId: { type: String },
    customerId: { type: String },
    caseId: { type: String },
  },
  {
    timestamps: true,
    strict: false,
    _id: false,
  }
);

AvailabilitySlotSchema.index({ businessSlug: 1, catalogOfferingId: 1, status: 1, startAt: 1 });
AvailabilitySlotSchema.index({ businessSlug: 1, startAt: 1 });

export const AvailabilitySlot = mongoose.model<IAvailabilitySlot>('AvailabilitySlot', AvailabilitySlotSchema);
