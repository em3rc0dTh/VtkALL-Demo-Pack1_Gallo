import { CatalogOffering } from '../../models/CatalogOffering.model';
import { ResourceReservation } from '../../models/ResourceReservation.model';
import { DemoTestDomainError, assertRequired } from './errors';
import {
  ExecutionContext,
  executeIdempotentCommand,
  reconcileScheduleConsultationResult,
  withExecutionScope,
} from './core';
import { createAppointment, cancelAppointment } from './appointment.service';
import { getCaseById, updateCaseStatus } from './case.service';
import { getCustomerById } from './customer.service';
import { getManagedEntityById } from './managedEntity.service';
import { getAvailability } from './availability.service';
import {
  confirmResourceReservation,
  holdResourceReservation,
  releaseResourceReservation,
} from './resourceReservation.service';
import { recordTimelineEvent } from './timeline.service';
import { ScheduleConsultationInput, ScheduleConsultationResult } from './types';

const toDate = (value: Date | string) => (value instanceof Date ? value : new Date(value));

const addMinutes = (date: Date, minutes: number) => new Date(date.getTime() + minutes * 60_000);

const dateInTimezone = (date: Date, timezone: string) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

const statusForCase = (verticalType?: string) => {
  if (verticalType === 'custom_orders') {
    return 'consultation_pending';
  }
  return 'appointment_scheduled';
};

const statusGroupForCase = (status: string) => {
  if (status === 'consultation_pending') {
    return 'consultation';
  }
  return 'appointment';
};

const recordAppointmentFailed = async (
  input: ScheduleConsultationInput,
  message: string,
  metadata: Record<string, unknown>,
  context?: ExecutionContext
) => {
  try {
    await recordTimelineEvent({
      businessSlug: input.businessSlug,
      caseId: input.caseId,
      eventType: 'appointment.failed',
      title: 'Appointment scheduling failed',
      description: message,
      visibility: 'internal',
      actor: { type: 'system', name: 'demo_test' },
      metadata,
    }, context);
  } catch {
    // Do not mask the original orchestration error with a timeline write error.
  }
};

const findBlockingReservationForRequestedInterval = async (input: ScheduleConsultationInput, startAt: Date) => {
  const endAt = addMinutes(startAt, input.durationMinutes);
  return ResourceReservation.findOne({
    businessSlug: input.businessSlug,
    teamId: input.teamId,
    startAt,
    endAt,
    $or: [
      { status: 'booked' },
      {
        status: 'held',
        $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }],
      },
    ],
  }).lean().exec();
};

const scheduleConsultationOnce = async (
  input: ScheduleConsultationInput,
  context?: ExecutionContext
): Promise<ScheduleConsultationResult> => {
  assertRequired(input.businessSlug, 'businessSlug');
  assertRequired(input.caseId, 'caseId');
  assertRequired(input.customerId, 'customerId');
  assertRequired(input.managedEntityId, 'managedEntityId');
  assertRequired(input.teamId, 'teamId');
  assertRequired(input.catalogOfferingId, 'catalogOfferingId');
  assertRequired(input.startAt, 'startAt');
  assertRequired(input.durationMinutes, 'durationMinutes');
  assertRequired(input.timezone, 'timezone');
  assertRequired(input.appointmentType, 'appointmentType');

  const startAt = toDate(input.startAt);
  const scopedContext = withExecutionScope(context, {
    businessSlug: input.businessSlug,
    caseId: input.caseId,
    workflowId: input.workflowId || context?.workflowId,
    idempotencyKey: input.idempotencyKey || context?.idempotencyKey,
  });
  const customer = await getCustomerById({ businessSlug: input.businessSlug, customerId: input.customerId });
  const managedEntity = await getManagedEntityById({
    businessSlug: input.businessSlug,
    managedEntityId: input.managedEntityId,
  });
  const operationalCase = await getCaseById({ businessSlug: input.businessSlug, caseId: input.caseId });

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

  const offering = await CatalogOffering.findOne({
    _id: input.catalogOfferingId,
    businessSlug: input.businessSlug,
  }).lean().exec();
  if (!offering) {
    throw new DemoTestDomainError('VALIDATION_ERROR', 'CatalogOffering was not found.', {
      catalogOfferingId: input.catalogOfferingId,
    }, 404);
  }

  const availability = await getAvailability({
    businessSlug: input.businessSlug,
    teamId: input.teamId,
    catalogOfferingId: input.catalogOfferingId,
    date: dateInTimezone(startAt, input.timezone),
    durationMinutes: input.durationMinutes,
    timezone: input.timezone,
  }, scopedContext);
  const selectedSlot = availability.slots.find((slot) => slot.startAt.getTime() === startAt.getTime());
  if (!selectedSlot) {
    const blockingReservation = await findBlockingReservationForRequestedInterval(input, startAt);
    if (blockingReservation) {
      throw new DemoTestDomainError('DOUBLE_BOOKING_CONFLICT', 'The selected slot is no longer available.', {
        businessSlug: input.businessSlug,
        teamId: input.teamId,
        startAt,
        endAt: addMinutes(startAt, input.durationMinutes),
        catalogOfferingId: input.catalogOfferingId,
      }, 409);
    }

    throw new DemoTestDomainError('NO_AVAILABILITY', 'The selected slot is not available.', {
      businessSlug: input.businessSlug,
      teamId: input.teamId,
      startAt,
      endAt: addMinutes(startAt, input.durationMinutes),
      catalogOfferingId: input.catalogOfferingId,
    }, 409);
  }

  let reservation: any = null;
  let appointment: any = null;

  try {
    reservation = await holdResourceReservation({
      businessSlug: input.businessSlug,
      teamId: input.teamId,
      catalogOfferingId: input.catalogOfferingId,
      caseId: input.caseId,
      customerId: input.customerId,
      managedEntityId: input.managedEntityId,
      startAt: selectedSlot.startAt,
      endAt: selectedSlot.endAt,
      durationMinutes: selectedSlot.durationMinutes,
      slotGranularityMinutes: selectedSlot.slotGranularityMinutes,
      timezone: input.timezone,
      requiredUnits: selectedSlot.requiredUnits,
      slotKeys: selectedSlot.slotKeys,
      effectiveCapacity: selectedSlot.effectiveCapacity,
      idempotencyKey: input.idempotencyKey || scopedContext.idempotencyKey,
      workflowId: input.workflowId,
    }, scopedContext);

    try {
      appointment = await createAppointment({
        businessSlug: input.businessSlug,
        caseId: input.caseId,
        customerId: input.customerId,
        managedEntityId: input.managedEntityId,
        resourceReservationId: reservation._id,
        scheduledStart: selectedSlot.startAt,
        scheduledEnd: selectedSlot.endAt,
        timezone: input.timezone,
        appointmentType: input.appointmentType,
        idempotencyKey: input.idempotencyKey || scopedContext.idempotencyKey,
        workflowId: input.workflowId,
      }, scopedContext);
    } catch (error) {
      await releaseResourceReservation({
        businessSlug: input.businessSlug,
        resourceReservationId: reservation._id,
        reason: 'Appointment creation failed after hold.',
      }, scopedContext);
      await recordAppointmentFailed(input, 'Appointment creation failed after reservation hold.', {
        reservationId: reservation._id,
        cause: error instanceof Error ? error.message : String(error),
      }, scopedContext);
      throw new DemoTestDomainError('APPOINTMENT_CREATION_FAILED', 'Appointment creation failed after reservation hold.', {
        reservationId: reservation._id,
        cause: error instanceof Error ? error.message : String(error),
      }, 500);
    }

    let bookedReservation: any;
    try {
      const transition = await confirmResourceReservation({
        businessSlug: input.businessSlug,
        resourceReservationId: reservation._id,
        reason: 'Appointment created.',
      }, scopedContext);
      bookedReservation = transition.reservation;
    } catch (error) {
      let appointmentCancelFailed = false;
      await releaseResourceReservation({
        businessSlug: input.businessSlug,
        resourceReservationId: reservation._id,
        reason: 'Reservation confirmation failed after appointment creation.',
      }, scopedContext);
      try {
        await cancelAppointment({
          businessSlug: input.businessSlug,
          appointmentId: appointment._id,
          reason: 'Reservation confirmation failed.',
        }, scopedContext);
      } catch {
        appointmentCancelFailed = true;
      }
      await recordAppointmentFailed(input, 'Reservation confirmation failed after appointment creation.', {
        reservationId: reservation._id,
        appointmentId: appointment._id,
        appointmentCancelFailed,
        cause: error instanceof Error ? error.message : String(error),
      }, scopedContext);
      throw new DemoTestDomainError('RESERVATION_FAILED', 'Reservation confirmation failed after appointment creation.', {
        reservationId: reservation._id,
        appointmentId: appointment._id,
        appointmentCancelFailed,
        cause: error instanceof Error ? error.message : String(error),
      }, 500);
    }

    await recordTimelineEvent({
      businessSlug: input.businessSlug,
      caseId: input.caseId,
      eventType: 'appointment.scheduled',
      title: 'Appointment scheduled',
      description: `Appointment scheduled for ${selectedSlot.startAt.toISOString()}.`,
      visibility: 'internal',
      actor: { type: 'system', name: 'demo_test' },
      metadata: {
        appointmentId: appointment._id,
        reservationId: reservation._id,
        teamId: input.teamId,
      },
    }, scopedContext);

    const nextStatus = statusForCase((operationalCase as any).verticalType);
    const updatedCase = await updateCaseStatus({
      businessSlug: input.businessSlug,
      caseId: input.caseId,
      status: nextStatus,
      statusGroup: statusGroupForCase(nextStatus),
      reason: 'Appointment scheduled.',
    }, scopedContext);

    void customer;
    return {
      appointment,
      resourceReservation: bookedReservation,
      case: {
        _id: (updatedCase as any)._id,
        status: (updatedCase as any).status,
      },
    };
  } catch (error) {
    if (error instanceof DemoTestDomainError) {
      throw error;
    }
    throw new DemoTestDomainError('INTERNAL_ERROR', 'Schedule consultation failed.', {
      cause: error instanceof Error ? error.message : String(error),
    }, 500);
  }
};

const scheduleReplayPayload = (result: ScheduleConsultationResult) => ({
  appointment: result.appointment,
  resourceReservation: result.resourceReservation,
  case: result.case,
  ...(result.warnings ? { warnings: result.warnings } : {}),
});

export const scheduleConsultation = async (
  input: ScheduleConsultationInput,
  context?: ExecutionContext
): Promise<ScheduleConsultationResult> => {
  const scopedContext = withExecutionScope(context, {
    businessSlug: input.businessSlug,
    caseId: input.caseId,
    workflowId: input.workflowId || context?.workflowId,
    idempotencyKey: input.idempotencyKey || context?.idempotencyKey,
  });

  const idempotent = await executeIdempotentCommand<ScheduleConsultationInput, ScheduleConsultationResult>({
    scope: 'consultation.schedule',
    operation: 'scheduleConsultation',
    input: {
      ...input,
      idempotencyKey: input.idempotencyKey || scopedContext.idempotencyKey,
      workflowId: input.workflowId || scopedContext.workflowId,
    },
    context: scopedContext,
    requireKey: true,
    buildReplayPayload: scheduleReplayPayload,
    entityRefs: (result) => [
      { type: 'Appointment', id: String((result.appointment as any)._id) },
      { type: 'ResourceReservation', id: String((result.resourceReservation as any)._id) },
      { type: 'Case', id: String(result.case._id) },
    ],
    reconcile: async ({ input: reconcileInput }) =>
      reconcileScheduleConsultationResult(reconcileInput) as Promise<ScheduleConsultationResult | null>,
    execute: () => scheduleConsultationOnce({
      ...input,
      idempotencyKey: input.idempotencyKey || scopedContext.idempotencyKey,
      workflowId: input.workflowId || scopedContext.workflowId,
    }, scopedContext),
  });

  return idempotent.result;
};
