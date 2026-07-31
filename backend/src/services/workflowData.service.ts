import { randomUUID } from 'crypto';
import { Appointment } from '../models/Appointment.model';
import { Case } from '../models/Case.model';
import { CatalogOffering } from '../models/CatalogOffering.model';
import { Customer } from '../models/Customer.model';
import { ManagedEntity } from '../models/ManagedEntity.model';
import { ResourceReservation } from '../models/ResourceReservation.model';
import { TimelineEvent } from '../models/TimelineEvent.model';
import { listTeamAvailability, reserveTeamCapacity } from './teamAvailability.service';

export type CustomerDataInput = {
  firstName: string;
  lastName: string;
  phone: string;
  vehiclePlate: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleYear?: number;
};

export type ReserveAppointmentInput = {
  businessSlug: string;
  catalogOfferingId: string;
  slotId: string;
  customerData: CustomerDataInput;
  workflowId?: string;
};

const REQUIRED_FIELDS = [
  { key: 'firstName', label: 'Nombre', required: true },
  { key: 'lastName', label: 'Apellido', required: true },
  { key: 'phone', label: 'Telefono', required: true },
  { key: 'vehiclePlate', label: 'Placa del vehiculo', required: true },
  { key: 'vehicleBrand', label: 'Marca del vehiculo', required: false },
  { key: 'vehicleModel', label: 'Modelo del vehiculo', required: false },
  { key: 'vehicleYear', label: 'Anio del vehiculo', required: false },
];

const normalizePhone = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('51') ? digits : `51${digits}`;
};

export const validateCustomerData = (data: Partial<CustomerDataInput>) => {
  const missing = REQUIRED_FIELDS
    .filter((field) => field.required)
    .filter((field) => !String((data as any)[field.key] || '').trim())
    .map((field) => field.key);

  const errors: string[] = [];
  const phoneDigits = String(data.phone || '').replace(/\D/g, '');
  if (data.phone && phoneDigits.length < 7) {
    errors.push('phone must contain at least 7 digits');
  }
  if (data.vehiclePlate && String(data.vehiclePlate).replace(/[^a-zA-Z0-9]/g, '').length < 3) {
    errors.push('vehiclePlate must contain at least 3 letters or digits');
  }
  if (data.vehicleYear !== undefined) {
    const year = Number(data.vehicleYear);
    if (!Number.isInteger(year) || year < 1900 || year > 2035) {
      errors.push('vehicleYear must be a valid year between 1900 and 2035');
    }
  }

  return {
    valid: missing.length === 0 && errors.length === 0,
    missing,
    errors,
  };
};

export const listCatalog = async (businessSlug: string) => {
  return CatalogOffering.find({ businessSlug, active: true, publicVisible: true }).sort({ category: 1, name: 1 }).exec();
};

export const getCatalogOffering = async (businessSlug: string, catalogOfferingId: string) => {
  return CatalogOffering.findOne({ _id: catalogOfferingId, businessSlug, active: true, publicVisible: true }).exec();
};

export const getRequiredFields = async (businessSlug: string, catalogOfferingId: string) => {
  const offering = await getCatalogOffering(businessSlug, catalogOfferingId);
  if (!offering) {
    throw new Error('CATALOG_OFFERING_NOT_FOUND');
  }

  return {
    catalogOfferingId,
    requiredFields: REQUIRED_FIELDS,
  };
};

export const listAvailability = async (businessSlug: string, catalogOfferingId: string, preferredDate?: string) => {
  return listTeamAvailability(businessSlug, catalogOfferingId, preferredDate);
};

export const buildCustomerContextPreview = async (businessSlug: string, customerData: CustomerDataInput) => {
  const validation = validateCustomerData(customerData);
  if (!validation.valid) {
    return { valid: false, missing: validation.missing, errors: validation.errors };
  }

  const normalizedPhone = normalizePhone(customerData.phone);
  const customer = await Customer.findOne({ businessSlug, 'contact.phones.normalized': normalizedPhone }).exec();
  const vehicle = await (ManagedEntity as any).findOne({
    businessSlug,
    type: 'vehicle',
    'data.plate': customerData.vehiclePlate.toUpperCase(),
  }).exec();

  return {
    valid: true,
    missing: [],
    errors: [],
    existingCustomerId: customer?._id || null,
    existingManagedEntityId: vehicle?._id || null,
  };
};

export const reserveAppointment = async (input: ReserveAppointmentInput) => {
  const validation = validateCustomerData(input.customerData);
  if (!validation.valid) {
    const error = new Error('INVALID_CUSTOMER_DATA');
    (error as any).details = { missing: validation.missing, errors: validation.errors };
    throw error;
  }

  const offering = await getCatalogOffering(input.businessSlug, input.catalogOfferingId);
  if (!offering) {
    throw new Error('CATALOG_OFFERING_NOT_FOUND');
  }

  let reservation: any = null;

  try {
    const now = new Date();
    const normalizedPhone = normalizePhone(input.customerData.phone);
    const fullName = `${input.customerData.firstName.trim()} ${input.customerData.lastName.trim()}`;
    const existingCustomer = await Customer.findOne({ businessSlug: input.businessSlug, 'contact.phones.normalized': normalizedPhone }).exec();
    const existingVehicle = await (ManagedEntity as any).findOne({
      businessSlug: input.businessSlug,
      type: 'vehicle',
      'data.plate': input.customerData.vehiclePlate.toUpperCase(),
    }).exec();
    const customerId = existingCustomer?._id || `cus_manual_${randomUUID()}`;
    const managedEntityId = existingVehicle?._id || `me_vehicle_manual_${randomUUID()}`;
    const caseId = `case_manual_${randomUUID()}`;
    const appointmentId = `appt_manual_${randomUUID()}`;
    const timelineEventId = `evt_manual_${randomUUID()}`;
    const existingCases = await Case.countDocuments({ businessSlug: input.businessSlug }).exec();
    const caseNumber = `TUR-2026-${String(existingCases + 1).padStart(4, '0')}`;

    reservation = await reserveTeamCapacity({
      businessSlug: input.businessSlug,
      catalogOfferingId: input.catalogOfferingId,
      slotId: input.slotId,
      appointmentId,
      customerId,
      caseId,
      workflowId: input.workflowId,
    });

    const customer = existingCustomer || await (Customer as any).create({
        _id: customerId,
        businessSlug: input.businessSlug,
        type: 'person',
        name: fullName,
        contact: {
          phones: [
            {
              label: 'principal',
              countryCode: '+51',
              number: input.customerData.phone,
              normalized: normalizedPhone,
              isWhatsapp: true,
              primary: true,
            },
          ],
        },
        status: 'active',
        createdAt: now,
        updatedAt: now,
      });

    const managedEntity = existingVehicle || await (ManagedEntity as any).create({
        _id: managedEntityId,
        businessSlug: input.businessSlug,
        customerId,
        type: 'vehicle',
        displayName: `${input.customerData.vehicleBrand || 'Vehiculo'} ${input.customerData.vehiclePlate.toUpperCase()}`,
        summary: `${input.customerData.vehicleBrand || 'Vehiculo'} ${input.customerData.vehicleModel || ''} ${input.customerData.vehicleYear || ''}, placa ${input.customerData.vehiclePlate.toUpperCase()}`.trim(),
        data: {
          brand: input.customerData.vehicleBrand || null,
          model: input.customerData.vehicleModel || null,
          year: input.customerData.vehicleYear || null,
          plate: input.customerData.vehiclePlate.toUpperCase(),
        },
        status: 'active',
        createdAt: now,
        updatedAt: now,
      });

    const operationalCase = await (Case as any).create({
      _id: caseId,
      businessSlug: input.businessSlug,
      verticalType: 'vehicle_service',
      caseNumber,
      customerId,
      managedEntityId,
      source: {
        channel: 'manual_agent_sim',
        agent: 'manual',
        origin: 'temporal_schedule_consultation_workflow',
      },
      intent: {
        type: 'appointment_request',
        summary: `Cliente solicita agendar ${String((offering as any).name || input.catalogOfferingId)}.`,
        selectedOfferingId: input.catalogOfferingId,
      },
      status: 'appointment_confirmed',
      statusGroup: 'appointment',
      priority: 'normal',
      assignedTeamId: reservation.teamId,
      importantDates: {
        createdAt: now,
        scheduledAt: reservation.startAt,
      },
      flags: {
        requiresHumanReview: true,
        hasOpenQuote: false,
        hasApprovedQuote: false,
        hasWorkOrder: false,
      },
      createdAt: now,
      updatedAt: now,
    });

    const appointment = await (Appointment as any).create({
      _id: appointmentId,
      businessSlug: input.businessSlug,
      caseId,
      customerId,
      managedEntityId,
      type: 'onsite_assessment',
      status: 'confirmed',
      scheduledStart: reservation.startAt,
      scheduledEnd: reservation.endAt,
      timezone: 'America/Lima',
      location: {
        type: 'workshop',
        label: 'Turagua Racing - Taller',
        address: 'Lima, Peru',
      },
      assignedTeamId: reservation.teamId,
      resourceReservationId: reservation._id,
      confirmation: {
        required: true,
        status: 'confirmed_by_customer',
        confirmedAt: now,
        channel: 'manual_agent_sim',
      },
      workflow: {
        provider: 'temporal',
        workflowId: input.workflowId || null,
      },
      createdAt: now,
      updatedAt: now,
    });

    await (TimelineEvent as any).create({
      _id: timelineEventId,
      businessSlug: input.businessSlug,
      caseId,
      customerId,
      managedEntityId,
      entity: {
        type: 'appointment',
        id: appointmentId,
      },
      eventType: 'appointment.booked_by_temporal',
      title: 'Cita reservada por Temporal',
      description: `Temporal reservo la cita para ${fullName} con el equipo ${reservation.teamId}.`,
      visibility: 'internal',
      actor: {
        type: 'workflow',
        id: input.workflowId || 'schedule_consultation',
        name: 'ScheduleConsultationWorkflow',
      },
      metadata: {
        useCase: 'agendar_cita_consulta',
        catalogOfferingId: input.catalogOfferingId,
        reservationId: reservation._id,
        teamId: reservation.teamId,
      },
      createdAt: now,
    });

    await ResourceReservation.findByIdAndUpdate(reservation._id, {
      $set: {
        appointmentId,
        customerId,
        caseId,
      },
    }).exec();

    return {
      customer,
      managedEntity,
      case: operationalCase,
      appointment,
      reservation: await ResourceReservation.findById(reservation._id).exec(),
      slot: {
        _id: input.slotId,
        businessSlug: input.businessSlug,
        catalogOfferingId: input.catalogOfferingId,
        teamId: reservation.teamId,
        startAt: reservation.startAt,
        endAt: reservation.endAt,
        status: reservation.status,
        reservationId: reservation._id,
      },
    };
  } catch (error) {
    if (reservation?._id) {
      await ResourceReservation.findByIdAndUpdate(reservation._id, { $set: { status: 'released' } }).exec();
    }
    throw error;
  }
};
