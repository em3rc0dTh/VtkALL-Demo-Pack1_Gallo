import { condition, defineQuery, defineSignal, proxyActivities, setHandler, workflowInfo } from '@temporalio/workflow';
import type * as activities from '../activities/scheduleConsultation.activities';
import { CustomerDataInput, ScheduleConsultationInput, ScheduleConsultationState } from '../types';

const {
  fetchAvailabilityActivity,
  fetchCatalogActivity,
  fetchRequiredFieldsActivity,
  validateCustomerDataActivity,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 seconds',
  retry: {
    maximumAttempts: 3,
  },
});

const { reserveAppointmentActivity } = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 seconds',
  retry: {
    maximumAttempts: 1,
  },
});

export const getScheduleConsultationState = defineQuery<ScheduleConsultationState>('getScheduleConsultationState');
export const getScheduleConsultationProcessContext = defineQuery<any>('getScheduleConsultationProcessContext');
export const selectCatalogOffering = defineSignal<[payload: { catalogOfferingId: string }]>('selectCatalogOffering');
export const submitCustomerData = defineSignal<[payload: CustomerDataInput]>('submitCustomerData');
export const requestSlots = defineSignal<[payload?: { preferredDate?: string }]>('requestSlots');
export const selectSlot = defineSignal<[payload: { slotId: string }]>('selectSlot');
export const cancelWorkflow = defineSignal<[payload?: { reason?: string }]>('cancelWorkflow');

const terminalStatuses = ['APPOINTMENT_BOOKED', 'FAILED_SERVICE_NOT_IN_CATALOG', 'FAILED_SLOT_UNAVAILABLE', 'CANCELLED'];

const processContextFor = (state: ScheduleConsultationState) => {
  const requiredFields = state.requiredFields.map((field: any) => String(field.key || field.label));
  const missingField = requiredFields.find((field) => !String((state.customerData as any)?.[field] || '').trim());
  const awaiting = (() => {
    if (state.status === 'WAITING_FOR_SERVICE_SELECTION') {
      return { type: 'offering_selection', requiredFields: ['catalogOfferingId'], nextRecommendedField: 'catalogOfferingId' };
    }
    if (state.status === 'WAITING_FOR_CUSTOMER_DATA') {
      return {
        type: missingField === 'managedEntityDisplayName' ? 'managed_entity_information' : 'customer_information',
        requiredFields,
        nextRecommendedField: missingField,
      };
    }
    if (state.status === 'CUSTOMER_DATA_VALIDATED') {
      return { type: 'date_preference', requiredFields: ['preferredDate'], nextRecommendedField: 'preferredDate' };
    }
    if (state.status === 'WAITING_FOR_SLOT_SELECTION') {
      return { type: 'slot_selection', requiredFields: ['slotId'], nextRecommendedField: 'slotId' };
    }
    return { type: 'none' };
  })();

  const allowedActions = (() => {
    if (state.status === 'WAITING_FOR_SERVICE_SELECTION') return ['submit_offering_selection', 'cancel_process'];
    if (state.status === 'WAITING_FOR_CUSTOMER_DATA') return ['submit_customer_information', 'cancel_process'];
    if (state.status === 'CUSTOMER_DATA_VALIDATED') return ['submit_date_preference', 'cancel_process'];
    if (state.status === 'WAITING_FOR_SLOT_SELECTION') return ['submit_slot_selection', 'submit_date_preference', 'cancel_process'];
    return [];
  })();

  return {
    process: {
      workflowId: state.workflowId,
      workflowType: 'schedule_consultation',
      status: state.status,
      caseId: (state.appointment as any)?.case?._id || (state.appointment as any)?.appointment?.caseId,
    },
    knownFacts: {
      offering: state.selectedOffering,
      customer: state.customerData,
      managedEntity: state.customerData?.managedEntityDisplayName
        ? {
          displayName: state.customerData.managedEntityDisplayName,
          summary: state.customerData.managedEntitySummary,
        }
        : undefined,
      selectedSlotId: state.selectedSlotId,
    },
    awaiting,
    allowedActions,
    availableOptions: state.status === 'WAITING_FOR_SLOT_SELECTION' ? state.availableSlots : state.catalog,
  };
};

export async function ScheduleConsultationWorkflow(input: ScheduleConsultationInput): Promise<ScheduleConsultationState> {
  if (!input.businessSlug) {
    throw new Error('businessSlug is required for generic scheduling workflow.');
  }
  const businessSlug = input.businessSlug;
  const info = workflowInfo();
  const state: ScheduleConsultationState = {
    workflowId: info.workflowId,
    businessSlug,
    status: 'CATALOG_REQUESTED',
    nextAction: 'LOAD_CATALOG',
    agentInstruction: 'Temporal esta consultando el catalogo disponible para mostrarselo al cliente.',
    catalog: [],
    requiredFields: [],
    availableSlots: [],
    errors: [],
  };

  setHandler(getScheduleConsultationState, () => state);
  setHandler(getScheduleConsultationProcessContext, () => processContextFor(state));

  setHandler(selectCatalogOffering, async ({ catalogOfferingId }) => {
    const selectedOffering = state.catalog.find((offering: any) => offering._id === catalogOfferingId);
    if (!selectedOffering) {
      state.status = 'FAILED_SERVICE_NOT_IN_CATALOG';
      state.nextAction = 'STOP';
      state.agentInstruction = 'El servicio elegido no existe en el catalogo. No se puede agendar.';
      state.errors = [`Servicio fuera de catalogo: ${catalogOfferingId}`];
      return;
    }

    state.selectedOffering = selectedOffering;
    state.selectedTeamId = selectedOffering.fulfillmentPolicy?.suggestedTeamId;
    state.durationMinutes = selectedOffering.fulfillmentPolicy?.estimatedDurationMinutes;
    state.requiredFields = await fetchRequiredFieldsActivity(businessSlug, catalogOfferingId);
    state.status = 'WAITING_FOR_CUSTOMER_DATA';
    state.nextAction = 'REQUEST_CUSTOMER_DATA';
    state.agentInstruction = 'Pidele al cliente los datos requeridos por el perfil vertical y el servicio seleccionado.';
  });

  setHandler(submitCustomerData, async (customerData) => {
    const mergedCustomerData = {
      ...(state.customerData || {}),
      ...(customerData || {}),
    } as CustomerDataInput;
    const validation = await validateCustomerDataActivity(businessSlug, mergedCustomerData);
    if (!validation.valid) {
      state.customerData = mergedCustomerData;
      state.status = 'WAITING_FOR_CUSTOMER_DATA';
      state.nextAction = 'REQUEST_MISSING_CUSTOMER_DATA';
      const missing = validation.missing?.length ? `Faltan: ${validation.missing.join(', ')}. ` : '';
      const errors = validation.errors?.length ? `Errores: ${validation.errors.join('; ')}. ` : '';
      state.agentInstruction = `${missing}${errors}Pidele al cliente corregir esos datos.`;
      state.errors = [...(validation.missing || []), ...(validation.errors || [])];
      return;
    }

    state.customerData = mergedCustomerData;
    state.status = 'CUSTOMER_DATA_VALIDATED';
    state.nextAction = 'REQUEST_SLOTS';
    state.agentInstruction = 'Datos validados. Ahora pide a Temporal los horarios disponibles.';
    state.errors = [];
  });

  setHandler(requestSlots, async (payload) => {
    if (!state.selectedOffering) {
      state.status = 'FAILED_SERVICE_NOT_IN_CATALOG';
      state.nextAction = 'STOP';
      state.agentInstruction = 'No hay servicio seleccionado. Selecciona un servicio del catalogo antes de pedir horarios.';
      return;
    }

    state.availableSlots = await fetchAvailabilityActivity(businessSlug, state.selectedOffering._id, payload?.preferredDate);
    state.selectedTeamId = state.availableSlots[0]?.teamId || state.selectedOffering.fulfillmentPolicy?.suggestedTeamId;
    state.durationMinutes = state.availableSlots[0]?.durationMinutes || state.selectedOffering.fulfillmentPolicy?.estimatedDurationMinutes;
    state.status = 'WAITING_FOR_SLOT_SELECTION';
    state.nextAction = 'SELECT_SLOT';
    state.agentInstruction = state.availableSlots.length
      ? 'Muestra estos horarios al cliente y pregunta cual desea reservar.'
      : 'No hay horarios disponibles para ese filtro. Pregunta si desea probar otro dia.';
  });

  setHandler(selectSlot, async ({ slotId }) => {
    if (!state.selectedOffering || !state.customerData) {
      state.status = 'FAILED_INVALID_DATA';
      state.nextAction = 'STOP';
      state.agentInstruction = 'Falta servicio o datos del cliente. No se puede reservar.';
      return;
    }

    const selectedSlot = state.availableSlots.find((slot: any) => slot._id === slotId);
    if (!selectedSlot) {
      state.status = 'WAITING_FOR_SLOT_SELECTION';
      state.nextAction = 'SELECT_SLOT';
      state.agentInstruction = 'El horario elegido no esta en la lista visible. Pide al cliente elegir un horario disponible.';
      state.errors = [`Slot no visible: ${slotId}`];
      return;
    }

    state.selectedSlotId = slotId;
    state.status = 'SLOT_SELECTED';
    state.nextAction = 'RESERVE_APPOINTMENT';
    state.agentInstruction = 'Temporal esta revalidando el slot y reservando la cita.';

    try {
      const appointment: any = await reserveAppointmentActivity(
        businessSlug,
        state.selectedOffering._id,
        selectedSlot,
        state.customerData,
        info.workflowId
      );
      state.appointment = appointment;
      state.reservationId = appointment.reservation?._id || appointment.slot?.reservationId;
      state.reservationStartAt = appointment.reservation?.startAt || appointment.slot?.startAt;
      state.reservationEndAt = appointment.reservation?.endAt || appointment.slot?.endAt;
      state.selectedTeamId = appointment.reservation?.teamId || appointment.slot?.teamId || state.selectedTeamId;
      state.status = 'APPOINTMENT_BOOKED';
      state.nextAction = 'CONFIRM_TO_CUSTOMER';
      state.agentInstruction = 'Cita confirmada. Comunicale al cliente el horario reservado.';
      state.errors = [];
    } catch (error: any) {
      state.status = 'WAITING_FOR_SLOT_SELECTION';
      state.nextAction = 'REQUEST_SLOTS';
      state.agentInstruction = 'El horario ya no esta disponible. Muestra otros horarios al cliente.';
      state.errors = [error.message || 'SLOT_UNAVAILABLE'];
    }
  });

  setHandler(cancelWorkflow, (payload) => {
    state.status = 'CANCELLED';
    state.nextAction = 'STOP';
    state.agentInstruction = payload?.reason || 'Workflow cancelado por el agente manual.';
  });

  state.catalog = await fetchCatalogActivity(businessSlug);
  state.status = 'WAITING_FOR_SERVICE_SELECTION';
  state.nextAction = 'SELECT_SERVICE';
  state.agentInstruction = 'Muestra este catalogo al cliente y pidele que elija un servicio.';

  await condition(() => terminalStatuses.includes(state.status));
  return state;
}
