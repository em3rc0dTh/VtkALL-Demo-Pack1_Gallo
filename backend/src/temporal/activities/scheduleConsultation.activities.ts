import { activityInfo } from '@temporalio/activity';
import { CatalogOffering } from '../../models/CatalogOffering.model';
import { ManagedEntity } from '../../models/ManagedEntity.model';
import { createSystemExecutionContext, ExecutionContext } from '../../services/demoTest/core';
import {
  createManagedEntity,
  createOperationalCase,
  createOrReuseCustomer,
  getAvailability,
  scheduleConsultation,
} from '../../services/demoTest';
import { CustomerDataInput, ScheduleConsultationState } from '../types';

const DEFAULT_TIMEZONE = 'America/Lima';

const temporalExecutionContext = (businessSlug: string, caseId?: string, workflowId?: string): ExecutionContext => {
  const info = activityInfo();
  const workflowExecution = info.workflowExecution;
  const resolvedWorkflowId = workflowId || workflowExecution?.workflowId || `activity_${info.activityId}`;
  return createSystemExecutionContext({
    businessSlug,
    caseId,
    workflowId: resolvedWorkflowId,
    workflowRunId: workflowExecution?.runId,
    activityId: info.activityId,
    channel: 'temporal',
    actor: { type: 'temporal_workflow', id: resolvedWorkflowId, name: 'temporal_workflow' },
    idempotencyKey: resolvedWorkflowId,
    metadata: {
      activityType: info.activityType,
      attempt: info.attempt,
    },
  });
};

const REQUIRED_FIELDS = [
  { key: 'firstName', label: 'Nombre', required: true },
  { key: 'lastName', label: 'Apellido', required: true },
  { key: 'phone', label: 'Telefono', required: true },
  { key: 'managedEntityDisplayName', label: 'Entidad gestionada', required: true },
];

const dateInTimezone = (date: Date, timezone = DEFAULT_TIMEZONE) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

const validateCustomerData = (data: Partial<CustomerDataInput>) => {
  const missing = REQUIRED_FIELDS
    .filter((field) => field.required)
    .filter((field) => !String((data as any)[field.key] || '').trim())
    .map((field) => field.key);

  const errors: string[] = [];
  const phoneDigits = String(data.phone || '').replace(/\D/g, '');
  if (data.phone && phoneDigits.length < 7) {
    errors.push('phone must contain at least 7 digits');
  }
  if (data.managedEntityDisplayName && String(data.managedEntityDisplayName).trim().length < 3) {
    errors.push('managedEntityDisplayName must contain at least 3 characters');
  }

  return {
    valid: missing.length === 0 && errors.length === 0,
    missing,
    errors,
  };
};

export const fetchCatalogActivity = async (businessSlug: string) =>
  CatalogOffering.find({ businessSlug, active: true, publicVisible: true }).sort({ category: 1, name: 1 }).lean().exec();

export const fetchRequiredFieldsActivity = async (businessSlug: string, catalogOfferingId: string) => {
  const offering = await CatalogOffering.findOne({ _id: catalogOfferingId, businessSlug, active: true }).lean().exec();
  if (!offering) {
    throw new Error('CATALOG_OFFERING_NOT_FOUND');
  }
  return REQUIRED_FIELDS;
};

export const fetchAvailabilityActivity = async (businessSlug: string, catalogOfferingId: string, preferredDate?: string) => {
  const offering: any = await CatalogOffering.findOne({ _id: catalogOfferingId, businessSlug, active: true }).lean().exec();
  if (!offering) {
    throw new Error('CATALOG_OFFERING_NOT_FOUND');
  }

  const date = preferredDate || dateInTimezone(new Date(), DEFAULT_TIMEZONE);
  const context = temporalExecutionContext(businessSlug);
  const availability = await getAvailability({
    businessSlug,
    catalogOfferingId,
    teamId: offering.fulfillmentPolicy?.suggestedTeamId,
    date,
    durationMinutes: offering.fulfillmentPolicy?.estimatedDurationMinutes,
    timezone: DEFAULT_TIMEZONE,
  }, context);

  return availability.slots;
};

export const validateCustomerDataActivity = async (_businessSlug: string, customerData: CustomerDataInput) =>
  validateCustomerData(customerData);

export const reserveAppointmentActivity = async (
  businessSlug: string,
  catalogOfferingId: string,
  selectedSlot: any,
  customerData: CustomerDataInput,
  workflowId?: string
) => {
  const validation = validateCustomerData(customerData);
  if (!validation.valid) {
    const error = new Error('INVALID_CUSTOMER_DATA');
    (error as any).details = { missing: validation.missing, errors: validation.errors };
    throw error;
  }

  const fullName = `${customerData.firstName.trim()} ${customerData.lastName.trim()}`.trim();
  const source = {
    channel: 'manual_agent_sim',
    agent: 'manual',
    origin: 'temporal_schedule_consultation_workflow',
  };
  const workflowMetadata = {
    workflowId,
    origin: 'temporal_schedule_consultation_workflow',
  };

  const context = temporalExecutionContext(businessSlug, undefined, workflowId);
  const customerResult = await createOrReuseCustomer({
    businessSlug,
    name: fullName,
    phone: customerData.phone,
    contact: {
      phone: customerData.phone,
      source,
    },
    metadata: workflowMetadata,
  }, context);
  const customer: any = customerResult.customer;

  const offering: any = await CatalogOffering.findOne({ _id: catalogOfferingId, businessSlug, active: true }).lean().exec();
  if (!offering) {
    throw new Error('CATALOG_OFFERING_NOT_FOUND');
  }

  const managedEntityType = customerData.managedEntityType || offering.managedEntityType || 'managed_entity';
  const managedEntityDisplayName = customerData.managedEntityDisplayName.trim();
  const existingManagedEntity = await (ManagedEntity as any).findOne({
    businessSlug,
    customerId: customer._id,
    type: managedEntityType,
    displayName: managedEntityDisplayName,
  }).exec();
  const managedEntity: any = existingManagedEntity || await createManagedEntity({
    businessSlug,
    customerId: customer._id,
    type: managedEntityType,
    displayName: managedEntityDisplayName,
    summary: customerData.managedEntitySummary || managedEntityDisplayName,
    data: customerData.managedEntityData || {},
    metadata: workflowMetadata,
  }, context);

  const operationalCase: any = await createOperationalCase({
    businessSlug,
    customerId: customer._id,
    managedEntityId: managedEntity._id,
    verticalType: customerData.verticalType || offering.verticalType || 'generic_service',
    source,
    intent: {
      type: 'appointment_request',
      summary: `Cliente solicita agendar ${catalogOfferingId}.`,
      selectedOfferingId: catalogOfferingId,
    },
    metadata: workflowMetadata,
  }, context);

  const appointmentType = selectedSlot.appointmentType || offering.fulfillmentPolicy?.appointmentType || 'consultation';
  const scheduleIdempotencyKey = [
    'schedule-consultation',
    businessSlug,
    operationalCase._id,
    catalogOfferingId,
    selectedSlot.teamId,
    new Date(selectedSlot.startAt).toISOString(),
    String(selectedSlot.durationMinutes),
    appointmentType,
  ].map((part) => encodeURIComponent(part)).join(':');
  const caseContext = {
    ...temporalExecutionContext(businessSlug, operationalCase._id, workflowId),
    idempotencyKey: scheduleIdempotencyKey,
  };
  const result = await scheduleConsultation({
    businessSlug,
    customerId: customer._id,
    managedEntityId: managedEntity._id,
    caseId: operationalCase._id,
    teamId: selectedSlot.teamId,
    catalogOfferingId,
    startAt: selectedSlot.startAt,
    durationMinutes: selectedSlot.durationMinutes,
    timezone: selectedSlot.timezone || DEFAULT_TIMEZONE,
    appointmentType,
    idempotencyKey: scheduleIdempotencyKey,
    workflowId,
  }, caseContext);

  return {
    customer,
    managedEntity,
    case: result.case,
    appointment: result.appointment,
    reservation: result.resourceReservation,
    slot: {
      _id: selectedSlot._id,
      businessSlug,
      catalogOfferingId,
      teamId: selectedSlot.teamId,
      startAt: selectedSlot.startAt,
      endAt: selectedSlot.endAt,
      status: (result.resourceReservation as any).status,
      reservationId: (result.resourceReservation as any)._id,
    },
  };
};

export const formatStateForAgentActivity = async (state: ScheduleConsultationState) => state;
