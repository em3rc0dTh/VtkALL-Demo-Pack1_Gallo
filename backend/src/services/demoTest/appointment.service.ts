import { randomUUID } from 'crypto';
import { Appointment } from '../../models/Appointment.model';
import { Case } from '../../models/Case.model';
import { Customer } from '../../models/Customer.model';
import { ManagedEntity } from '../../models/ManagedEntity.model';
import { ResourceReservation } from '../../models/ResourceReservation.model';
import { DemoTestDomainError, assertRequired } from './errors';
import { ExecutionContext } from './core';
import { CancelAppointmentInput, CreateAppointmentInput } from './types';

const toDate = (value: Date | string) => (value instanceof Date ? value : new Date(value));

const sameInstant = (left: Date, right: Date) => left.getTime() === right.getTime();

// Policy: scheduled appointments require ResourceReservation, and scheduledStart/scheduledEnd must match the reservation.
export const createAppointment = async (input: CreateAppointmentInput, context?: ExecutionContext): Promise<unknown> => {
  assertRequired(input.businessSlug, 'businessSlug');
  assertRequired(input.caseId, 'caseId');
  assertRequired(input.customerId, 'customerId');
  assertRequired(input.managedEntityId, 'managedEntityId');
  assertRequired(input.resourceReservationId, 'resourceReservationId');
  assertRequired(input.scheduledStart, 'scheduledStart');
  assertRequired(input.scheduledEnd, 'scheduledEnd');

  const [customer, managedEntity, operationalCase, reservation] = await Promise.all([
    Customer.findOne({ _id: input.customerId, businessSlug: input.businessSlug }).exec(),
    ManagedEntity.findOne({ _id: input.managedEntityId, businessSlug: input.businessSlug }).exec(),
    Case.findOne({ _id: input.caseId, businessSlug: input.businessSlug }).exec(),
    ResourceReservation.findOne({ _id: input.resourceReservationId, businessSlug: input.businessSlug }).exec(),
  ]);

  if (!customer) {
    throw new DemoTestDomainError('CUSTOMER_NOT_FOUND', 'Customer was not found.', { customerId: input.customerId }, 404);
  }
  if (!managedEntity) {
    throw new DemoTestDomainError('MANAGED_ENTITY_NOT_FOUND', 'ManagedEntity was not found.', {
      managedEntityId: input.managedEntityId,
    }, 404);
  }
  if (!operationalCase) {
    throw new DemoTestDomainError('CASE_NOT_FOUND', 'Case was not found.', { caseId: input.caseId }, 404);
  }
  if (!reservation) {
    throw new DemoTestDomainError('RESERVATION_FAILED', 'ResourceReservation was not found.', {
      resourceReservationId: input.resourceReservationId,
    }, 404);
  }

  if ((managedEntity as any).customerId !== input.customerId || (operationalCase as any).customerId !== input.customerId) {
    throw new DemoTestDomainError('VALIDATION_ERROR', 'Customer, ManagedEntity, and Case ownership must match.', {
      customerId: input.customerId,
      managedEntityCustomerId: (managedEntity as any).customerId,
      caseCustomerId: (operationalCase as any).customerId,
    });
  }
  if ((operationalCase as any).managedEntityId && (operationalCase as any).managedEntityId !== input.managedEntityId) {
    throw new DemoTestDomainError('VALIDATION_ERROR', 'Case must belong to the selected ManagedEntity.', {
      caseId: input.caseId,
      managedEntityId: input.managedEntityId,
      caseManagedEntityId: (operationalCase as any).managedEntityId,
    });
  }

  const scheduledStart = toDate(input.scheduledStart);
  const scheduledEnd = toDate(input.scheduledEnd);
  if (!sameInstant(scheduledStart, (reservation as any).startAt) || !sameInstant(scheduledEnd, (reservation as any).endAt)) {
    throw new DemoTestDomainError('VALIDATION_ERROR', 'Appointment schedule must match ResourceReservation start/end.', {
      scheduledStart,
      scheduledEnd,
      reservationStartAt: (reservation as any).startAt,
      reservationEndAt: (reservation as any).endAt,
    });
  }

  const appointment = await (Appointment as any).create({
    _id: `appt_${randomUUID()}`,
    businessSlug: input.businessSlug,
    caseId: input.caseId,
    customerId: input.customerId,
    managedEntityId: input.managedEntityId,
    type: input.appointmentType,
    status: 'scheduled',
    scheduledStart,
    scheduledEnd,
    timezone: input.timezone,
    assignedTeamId: (reservation as any).teamId,
    resourceReservationId: input.resourceReservationId,
    workflow: {
      workflowId: input.workflowId || null,
      idempotencyKey: input.idempotencyKey || context?.idempotencyKey || null,
      correlationId: context?.correlationId || null,
    },
  });

  await ResourceReservation.findOneAndUpdate(
    { _id: input.resourceReservationId, businessSlug: input.businessSlug },
    { $set: { appointmentId: appointment._id } }
  ).exec();

  return appointment;
};

export const cancelAppointment = async (input: CancelAppointmentInput, _context?: ExecutionContext): Promise<unknown> => {
  assertRequired(input.businessSlug, 'businessSlug');
  assertRequired(input.appointmentId, 'appointmentId');

  const appointment = await Appointment.findOneAndUpdate(
    { _id: input.appointmentId, businessSlug: input.businessSlug },
    {
      $set: {
        status: 'cancelled',
        cancellation: {
          reason: input.reason || 'Compensation after schedule-consultation failure.',
          cancelledAt: new Date(),
        },
      },
    },
    { returnDocument: 'after' }
  ).exec();

  if (!appointment) {
    throw new DemoTestDomainError('APPOINTMENT_CREATION_FAILED', 'Appointment was not found for compensation.', {
      appointmentId: input.appointmentId,
    }, 404);
  }

  return appointment;
};
