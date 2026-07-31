import { getMockState } from '../mockDemoTestStore';
import { nextMockId } from '../mockDemoTestIds';
import { nowMockIso } from '../mockDemoTestClock';
import { getMockScenario } from '../mockScenarioController';
import { ApiError } from '../../api/apiError';
import { assertAppointmentResponse } from '../../contracts/appointment.contract';

const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

const fingerprintPayload = (payload) => JSON.stringify({
  caseId: payload.caseId,
  customerId: payload.customerId,
  managedEntityId: payload.managedEntityId,
  teamId: payload.teamId,
  catalogOfferingId: payload.catalogOfferingId,
  startAt: payload.startAt,
  durationMinutes: payload.durationMinutes,
  timezone: payload.timezone,
  appointmentType: payload.appointmentType,
});

export async function mockScheduleConsultation(payload) {
  await delay();

  if (!payload.idempotencyKey) {
    throw new ApiError({
      code: 'IDEMPOTENCY_KEY_REQUIRED',
      message: 'Idempotency-Key es obligatorio para agendar',
      status: 400,
    });
  }

  if (!payload.caseId || !payload.customerId || !payload.startAt || !payload.teamId) {
    throw new ApiError({
      code: 'VALIDATION_ERROR',
      message: 'caseId, customerId, startAt y teamId son obligatorios',
      status: 400,
    });
  }

  const state = getMockState();
  const scenario = getMockScenario();

  const replayAppointment = state.appointments.find(app => app.workflow?.idempotencyKey === payload.idempotencyKey);
  if (replayAppointment) {
    if (replayAppointment.workflow?.requestFingerprint !== fingerprintPayload(payload)) {
      throw new ApiError({
        code: 'IDEMPOTENCY_CONFLICT',
        message: 'La misma Idempotency-Key fue usada con datos distintos',
        status: 409,
      });
    }

    const replayReservation = state.resourceReservations.find(res => res._id === replayAppointment.resourceReservationId);
    return assertAppointmentResponse({
      ok: true,
      appointment: replayAppointment,
      resourceReservation: replayReservation,
      resourceReservationId: replayReservation?._id,
      executionContext: {
        idempotencyKey: payload.idempotencyKey,
        correlationId: `mock-corr-${payload.idempotencyKey}`,
        causationId: `mock-cause-${payload.idempotencyKey}`,
      },
    });
  }

  // Validaciones
  const customer = state.customers.find(c => c._id === payload.customerId);
  const activeCase = state.cases.find(c => c._id === payload.caseId);
  const managedEntity = state.managedEntities.find(me => me._id === payload.managedEntityId);

  if (!customer || !activeCase || !managedEntity) {
    throw new ApiError({
      code: 'VALIDATION_ERROR',
      message: 'Referencias invalidas (Customer, Case o ManagedEntity)',
      status: 400,
    });
  }

  if (activeCase.customerId !== customer._id || activeCase.managedEntityId !== managedEntity._id) {
    throw new ApiError({
      code: 'VALIDATION_ERROR',
      message: 'El Case no pertenece al Customer o ManagedEntity',
      status: 400,
    });
  }

  // Verificar si ya existe una reserva held/booked para este slot
  const conflict = state.resourceReservations.find(res => 
    res.startAt === payload.startAt && (res.status === 'held' || res.status === 'booked')
  );

  // Escenario Double Booking: falla ANTES de crear el hold
  if (conflict || scenario === 'double_booking') {
    throw new ApiError({
      code: 'DOUBLE_BOOKING_CONFLICT',
      message: 'El horario seleccionado ya no esta disponible',
      status: 409
    });
  }

  // Crear Hold
  const newReservation = {
    _id: nextMockId('res'),
    startAt: payload.startAt,
    endAt: payload.endAt,
    status: 'held',
    teamId: payload.teamId,
    caseId: activeCase._id,
    idempotencyKey: payload.idempotencyKey,
    createdAt: nowMockIso()
  };
  state.resourceReservations.push(newReservation);

  state.timelineEvents.push({
    _id: nextMockId('evt'),
    eventType: 'resource_reservation.held',
    timestamp: nowMockIso(),
    caseId: activeCase._id,
    resourceReservationId: newReservation._id
  });

  // Escenario falla despues del hold
  if (scenario === 'appointment_creation_failed_after_hold') {
    newReservation.status = 'released';
    
    state.timelineEvents.push({
      _id: nextMockId('evt'),
      eventType: 'appointment.failed',
      timestamp: nowMockIso(),
      caseId: activeCase._id
    });
    state.timelineEvents.push({
      _id: nextMockId('evt'),
      eventType: 'resource_reservation.released',
      timestamp: nowMockIso(),
      caseId: activeCase._id,
      resourceReservationId: newReservation._id
    });

    throw new ApiError({
      code: 'APPOINTMENT_CREATION_FAILED',
      message: 'Fallo al crear la cita, la reserva fue liberada',
      status: 500
    });
  }

  // Flujo Success
  const newAppointment = {
    _id: nextMockId('app'),
    caseId: activeCase._id,
    customerId: customer._id,
    managedEntityId: managedEntity._id,
    resourceReservationId: newReservation._id,
    scheduledStart: payload.startAt,
    scheduledEnd: payload.endAt,
    status: 'scheduled',
    workflow: {
      idempotencyKey: payload.idempotencyKey,
      requestFingerprint: fingerprintPayload(payload),
    },
    createdAt: nowMockIso()
  };
  state.appointments.push(newAppointment);

  state.timelineEvents.push({
    _id: nextMockId('evt'),
    eventType: 'appointment.scheduled',
    timestamp: nowMockIso(),
    caseId: activeCase._id,
    appointmentId: newAppointment._id
  });

  // Confirmar reserva
  newReservation.status = 'booked';
  
  state.timelineEvents.push({
    _id: nextMockId('evt'),
    eventType: 'resource_reservation.booked',
    timestamp: nowMockIso(),
    caseId: activeCase._id,
    resourceReservationId: newReservation._id
  });

  state.timelineEvents.push({
    _id: nextMockId('evt'),
    eventType: 'status.changed',
    timestamp: nowMockIso(),
    caseId: activeCase._id,
    newStatus: 'intake'
  });

  return assertAppointmentResponse({
    ok: true,
    appointment: newAppointment,
    resourceReservation: newReservation,
    resourceReservationId: newReservation._id,
    executionContext: {
      idempotencyKey: payload.idempotencyKey,
      correlationId: `mock-corr-${payload.idempotencyKey}`,
      causationId: `mock-cause-${payload.idempotencyKey}`,
    },
  });
}
