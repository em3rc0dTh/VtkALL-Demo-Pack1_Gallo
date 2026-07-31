import mongoose, { Schema, Document } from 'mongoose';

export interface IAppointment {
  _id: string;
  businessSlug: string;
  caseId: string;
  customerId: string;
  managedEntityId?: string;
  resourceReservationId?: string;
  scheduledStart: Date;
  scheduledEnd?: Date;
  timezone?: string;
  appointmentType?: string;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const AppointmentSchema: Schema = new Schema(
  {
    _id: { type: String, required: true },
    businessSlug: { type: String, required: true, index: true },
    caseId: { type: String, required: true },
    customerId: { type: String, required: true },
    managedEntityId: { type: String },
    resourceReservationId: { type: String },
    scheduledStart: { type: Date, required: true },
    scheduledEnd: { type: Date },
    timezone: { type: String },
    appointmentType: { type: String },
    status: { type: String, required: true },
  },
  {
    timestamps: true,
    strict: false,
    _id: false,
  }
);

AppointmentSchema.index({ businessSlug: 1, caseId: 1 });
AppointmentSchema.index({ businessSlug: 1, resourceReservationId: 1 });
AppointmentSchema.index({ businessSlug: 1, scheduledStart: 1 });
AppointmentSchema.index({ businessSlug: 1, status: 1 });

export const Appointment = mongoose.model<IAppointment>('Appointment', AppointmentSchema);
