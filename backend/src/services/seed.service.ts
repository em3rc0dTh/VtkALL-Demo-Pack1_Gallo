import mockData from '../data/vtkall-demo-pack-1.mock.json';
import { BusinessProfile } from '../models/BusinessProfile.model';
import { CatalogOffering } from '../models/CatalogOffering.model';
import { Customer } from '../models/Customer.model';
import { ManagedEntity } from '../models/ManagedEntity.model';
import { Case } from '../models/Case.model';
import { CustomerInteraction } from '../models/CustomerInteraction.model';
import { Appointment } from '../models/Appointment.model';
import { DecisionRecord } from '../models/DecisionRecord.model';
import { Notification } from '../models/Notification.model';
import { TimelineEvent } from '../models/TimelineEvent.model';
import { Attachment } from '../models/Attachment.model';
import { AvailabilitySlot } from '../models/AvailabilitySlot.model';
import { WorkTeam } from '../models/WorkTeam.model';
import { WorkTeamScheduleRule } from '../models/WorkTeamScheduleRule.model';
import { WorkTeamScheduleOverride } from '../models/WorkTeamScheduleOverride.model';
import { ResourceReservation } from '../models/ResourceReservation.model';
import { landingSeeds } from './landing/landing.seed';
import { seedLandingPages } from './landing/landing.service';

const MODELS: { [key: string]: any } = {
  businessProfiles: BusinessProfile,
  catalogOfferings: CatalogOffering,
  customers: Customer,
  managedEntities: ManagedEntity,
  cases: Case,
  customerInteractions: CustomerInteraction,
  appointments: Appointment,
  decisionRecords: DecisionRecord,
  notifications: Notification,
  timelineEvents: TimelineEvent,
  attachments: Attachment,
  availabilitySlots: AvailabilitySlot,
  workTeams: WorkTeam,
  workTeamScheduleRules: WorkTeamScheduleRule,
  workTeamScheduleOverrides: WorkTeamScheduleOverride,
  resourceReservations: ResourceReservation,
};

const ORDER = [
  'businessProfiles',
  'catalogOfferings',
  'customers',
  'managedEntities',
  'cases',
  'customerInteractions',
  'appointments',
  'decisionRecords',
  'notifications',
  'timelineEvents',
  'attachments',
  'availabilitySlots',
  'workTeams',
  'workTeamScheduleRules',
  'workTeamScheduleOverrides',
  'resourceReservations'
];

type SeedNamespace = 'demo_test' | 'turagua' | 'all';

const DEMO_TEST_BUSINESS_PROFILE = {
  _id: 'bp_demo_test',
  businessSlug: 'demo_test',
  businessName: 'Demo Test Laboratory',
  verticalType: 'generic_service',
  brand: {
    displayName: 'Demo Test',
    country: 'PE',
    timezone: 'America/Lima',
  },
  agent: {
    name: 'Demo Agent',
    role: 'Asesora virtual de atencion',
    primaryChannel: 'manual_console',
  },
  labels: {
    customer: 'Customer',
    case: 'Case',
    managedEntity: 'Managed Entity',
    appointment: 'Consultation',
  },
  features: {
    supportsAppointments: true,
    supportsQuotes: false,
    supportsWorkOrders: false,
    supportsVehicleData: false,
  },
  active: true,
};

const DEMO_TEST_CATALOG_OFFERINGS = [
  {
    _id: 'off_basic_consultation',
    businessSlug: 'demo_test',
    verticalType: 'generic_service',
    offeringType: 'service',
    name: 'Basic Consultation',
    description: 'Neutral laboratory consultation used for contract and smoke verification.',
    publicVisible: true,
    active: true,
    pricingPolicy: {
      type: 'informational',
    },
    assessmentPolicy: {
      required: false,
    },
    fulfillmentPolicy: {
      requiresAppointment: true,
      requiresAssessment: false,
      requiresWorkOrder: false,
      suggestedTeamId: 'team_consultation',
      estimatedDurationMinutes: 60,
      slotGranularityMinutes: 15,
      defaultTaskTemplates: [],
    },
  },
];

const DEMO_TEST_WORK_TEAMS = [
  {
    _id: 'team_consultation',
    businessSlug: 'demo_test',
    name: 'Consultation Team',
    type: 'consultation',
    capacity: 1,
    slotGranularityMinutes: 15,
    active: true,
  },
];

const DEMO_TEST_WORK_TEAM_SCHEDULE_RULES = [
  { _id: 'rule_consultation_mon_0900_1700', businessSlug: 'demo_test', teamId: 'team_consultation', weekday: 1, startTime: '09:00', endTime: '17:00', capacity: 1, active: true },
  { _id: 'rule_consultation_tue_0900_1700', businessSlug: 'demo_test', teamId: 'team_consultation', weekday: 2, startTime: '09:00', endTime: '17:00', capacity: 1, active: true },
  { _id: 'rule_consultation_wed_0900_1700', businessSlug: 'demo_test', teamId: 'team_consultation', weekday: 3, startTime: '09:00', endTime: '17:00', capacity: 1, active: true },
  { _id: 'rule_consultation_thu_0900_1700', businessSlug: 'demo_test', teamId: 'team_consultation', weekday: 4, startTime: '09:00', endTime: '17:00', capacity: 1, active: true },
  { _id: 'rule_consultation_fri_0900_1700', businessSlug: 'demo_test', teamId: 'team_consultation', weekday: 5, startTime: '09:00', endTime: '17:00', capacity: 1, active: true },
];

const TURAGUA_BUSINESS_PROFILE = {
  _id: 'bp_turagua',
  businessSlug: 'turagua',
  businessName: 'Turagua Racing Peru',
  displayName: 'Turagua Racing Peru',
  verticalType: 'vehicle_service',
  brand: {
    displayName: 'Turagua Racing Peru',
    logoUrl: '/images/turagua.jpg',
    tagline: 'Proteccion & estetica automotriz',
    country: 'PE',
    timezone: 'America/Lima',
  },
  settings: {
    branding: {
      displayName: 'Turagua Racing Peru',
      logoUrl: '/images/turagua.jpg',
      tagline: 'Proteccion & estetica automotriz',
      timezone: 'America/Lima',
      language: 'es-PE',
    },
    contact: {
      primaryPhone: '+51 999 555 010',
      alternatePhones: [],
      email: '',
      whatsapp: '+51 999 555 010',
    },
    locations: [
      {
        id: 'turagua-main',
        name: 'Turagua Racing Peru',
        addressLine: 'Lima, Peru',
        reference: 'Visita previa coordinacion.',
        district: '',
        city: 'Lima',
        country: 'Peru',
        latitude: null,
        longitude: null,
        directionsUrl: '',
      },
    ],
    commercialHours: {
      weekdays: '',
      saturday: '9:00 a 18:00',
      sunday: '',
      summary: 'Lunes a sabado, 9:00 a 18:00',
    },
    socials: [],
  },
  settingsVersion: 0,
  agent: {
    name: 'Iris',
    enabled: true,
    role: 'Asesora virtual de atencion automotriz',
    primaryChannel: 'web_chat',
    avatarUrl: 'https://i.ibb.co/84r9sJc/imagen-2026-06-08-153923818.png',
    bannerUrl: '/images/turagua.jpg',
    welcomeMessage: '¡Hola! 👋 Soy Iris, del equipo de Turagua Racing Perú. ¿En qué te puedo ayudar hoy?',
    nameColor: '#0f172a',
    avatarAlignment: 'left',
  },
  labels: {
    customer: 'Cliente',
    case: 'Solicitud',
    managedEntity: 'Vehiculo',
    appointment: 'Cita',
  },
  features: {
    supportsAppointments: true,
    supportsQuotes: true,
    supportsWorkOrders: true,
    supportsVehicleData: true,
  },
  active: true,
};

export const TURAGUA_CATALOG_OFFERING_IDS = [
  'off_turagua_general_diagnostic',
  'off_turagua_preventive_maintenance',
  'off_turagua_brake_service',
  'off_turagua_lavado_premium',
  'off_turagua_prepurchase_inspection',
  'off_turagua_sandblasting_undercoating',
];

const TURAGUA_CATALOG_OFFERINGS = [
  {
    _id: 'off_turagua_general_diagnostic',
    businessSlug: 'turagua',
    verticalType: 'vehicle_service',
    offeringType: 'service',
    category: 'automotive',
    name: 'Diagnostico general',
    description: 'Revision tecnica inicial para identificar necesidades de mantenimiento, proteccion o restauracion del vehiculo.',
    publicVisible: true,
    active: true,
    displayOrder: 10,
    pricingPolicy: { type: 'informational' },
    fulfillmentPolicy: {
      requiresAppointment: true,
      requiresAssessment: true,
      requiresWorkOrder: false,
      suggestedTeamId: 'team_turagua_service',
      estimatedDurationMinutes: 60,
      slotGranularityMinutes: 15,
      defaultTaskTemplates: [],
    },
  },
  {
    _id: 'off_turagua_preventive_maintenance',
    businessSlug: 'turagua',
    verticalType: 'vehicle_service',
    offeringType: 'service',
    category: 'automotive',
    name: 'Mantenimiento preventivo',
    description: 'Servicio programado para conservar el rendimiento del vehiculo y prevenir fallas por desgaste.',
    publicVisible: true,
    active: true,
    displayOrder: 20,
    pricingPolicy: { type: 'informational' },
    fulfillmentPolicy: {
      requiresAppointment: true,
      requiresAssessment: true,
      requiresWorkOrder: true,
      suggestedTeamId: 'team_turagua_service',
      estimatedDurationMinutes: 90,
      slotGranularityMinutes: 15,
      defaultTaskTemplates: [],
    },
  },
  {
    _id: 'off_turagua_brake_service',
    businessSlug: 'turagua',
    verticalType: 'vehicle_service',
    offeringType: 'service',
    category: 'automotive',
    name: 'Servicio de frenos',
    description: 'Revision y mantenimiento del sistema de frenos con foco en seguridad y respuesta.',
    publicVisible: true,
    active: true,
    displayOrder: 30,
    pricingPolicy: { type: 'informational' },
    fulfillmentPolicy: {
      requiresAppointment: true,
      requiresAssessment: true,
      requiresWorkOrder: true,
      suggestedTeamId: 'team_turagua_service',
      estimatedDurationMinutes: 60,
      slotGranularityMinutes: 15,
      defaultTaskTemplates: [],
    },
  },
  {
    _id: 'off_turagua_lavado_premium',
    businessSlug: 'turagua',
    verticalType: 'vehicle_service',
    offeringType: 'service',
    category: 'automotive',
    name: 'Lavado premium',
    description: 'Limpieza profunda interior y exterior para recuperar presencia, detalle y cuidado visual.',
    publicVisible: true,
    active: true,
    displayOrder: 40,
    pricingPolicy: { type: 'informational' },
    fulfillmentPolicy: {
      requiresAppointment: true,
      requiresAssessment: false,
      requiresWorkOrder: false,
      suggestedTeamId: 'team_turagua_service',
      estimatedDurationMinutes: 120,
      slotGranularityMinutes: 15,
      defaultTaskTemplates: [],
    },
  },
  {
    _id: 'off_turagua_prepurchase_inspection',
    businessSlug: 'turagua',
    verticalType: 'vehicle_service',
    offeringType: 'service',
    category: 'automotive',
    name: 'Inspeccion pre-compra',
    description: 'Evaluacion tecnica para revisar el estado de un vehiculo antes de tomar una decision de compra.',
    publicVisible: true,
    active: true,
    displayOrder: 50,
    pricingPolicy: { type: 'informational' },
    fulfillmentPolicy: {
      requiresAppointment: true,
      requiresAssessment: true,
      requiresWorkOrder: false,
      suggestedTeamId: 'team_turagua_service',
      estimatedDurationMinutes: 90,
      slotGranularityMinutes: 15,
      defaultTaskTemplates: [],
    },
  },
  {
    _id: 'off_turagua_sandblasting_undercoating',
    businessSlug: 'turagua',
    verticalType: 'vehicle_service',
    offeringType: 'service',
    category: 'automotive',
    name: 'Arenado + Undercoating',
    description: 'Preparacion, arenado y proteccion inferior para resistir oxido, humedad, desgaste y uso exigente.',
    publicVisible: true,
    active: true,
    displayOrder: 60,
    pricingPolicy: { type: 'informational' },
    fulfillmentPolicy: {
      requiresAppointment: true,
      requiresAssessment: true,
      requiresWorkOrder: true,
      suggestedTeamId: 'team_turagua_service',
      estimatedDurationMinutes: 180,
      slotGranularityMinutes: 15,
      defaultTaskTemplates: [],
    },
  },
];

const TURAGUA_LEGACY_CATALOG_OFFERING_IDS = [
  'off_sandblasting_undercoating',
];

const TURAGUA_WORK_TEAMS = [
  {
    _id: 'team_turagua_service',
    businessSlug: 'turagua',
    name: 'Equipo de Servicio Turagua',
    type: 'mechanics',
    capacity: 1,
    slotGranularityMinutes: 15,
    active: true,
  },
];

const TURAGUA_WORK_TEAM_SCHEDULE_RULES = [
  { _id: 'rule_turagua_service_mon_0900_1700', businessSlug: 'turagua', teamId: 'team_turagua_service', weekday: 1, startTime: '09:00', endTime: '17:00', capacity: 1, active: true },
  { _id: 'rule_turagua_service_tue_0900_1700', businessSlug: 'turagua', teamId: 'team_turagua_service', weekday: 2, startTime: '09:00', endTime: '17:00', capacity: 1, active: true },
  { _id: 'rule_turagua_service_wed_0900_1700', businessSlug: 'turagua', teamId: 'team_turagua_service', weekday: 3, startTime: '09:00', endTime: '17:00', capacity: 1, active: true },
  { _id: 'rule_turagua_service_thu_0900_1700', businessSlug: 'turagua', teamId: 'team_turagua_service', weekday: 4, startTime: '09:00', endTime: '17:00', capacity: 1, active: true },
  { _id: 'rule_turagua_service_fri_0900_1700', businessSlug: 'turagua', teamId: 'team_turagua_service', weekday: 5, startTime: '09:00', endTime: '17:00', capacity: 1, active: true },
];

const MOCK_WORK_TEAMS = [
  {
    _id: 'team_frontdesk',
    businessSlug: 'turagua',
    name: 'Atencion al cliente',
    type: 'frontdesk',
    capacity: 1,
    slotGranularityMinutes: 15,
    active: true,
  },
  {
    _id: 'team_mechanics',
    businessSlug: 'turagua',
    name: 'Mecanicos',
    type: 'mechanics',
    capacity: 1,
    slotGranularityMinutes: 15,
    active: true,
  },
  {
    _id: 'team_detailing',
    businessSlug: 'turagua',
    name: 'Estetica y detailing',
    type: 'detailing',
    capacity: 1,
    slotGranularityMinutes: 15,
    active: true,
  },
  {
    _id: 'team_bodywork',
    businessSlug: 'turagua',
    name: 'Carroceria y proteccion',
    type: 'bodywork',
    capacity: 1,
    slotGranularityMinutes: 15,
    active: true,
  },
];

const MOCK_WORK_TEAM_SCHEDULE_RULES = [
  { _id: 'rule_frontdesk_mon_0900_1300', businessSlug: 'turagua', teamId: 'team_frontdesk', weekday: 1, startTime: '09:00', endTime: '13:00', capacity: 1, active: true },
  { _id: 'rule_frontdesk_tue_0900_1300', businessSlug: 'turagua', teamId: 'team_frontdesk', weekday: 2, startTime: '09:00', endTime: '13:00', capacity: 1, active: true },
  { _id: 'rule_frontdesk_wed_0900_1300', businessSlug: 'turagua', teamId: 'team_frontdesk', weekday: 3, startTime: '09:00', endTime: '13:00', capacity: 1, active: true },
  { _id: 'rule_frontdesk_thu_0900_1300', businessSlug: 'turagua', teamId: 'team_frontdesk', weekday: 4, startTime: '09:00', endTime: '13:00', capacity: 1, active: true },
  { _id: 'rule_frontdesk_fri_0900_1300', businessSlug: 'turagua', teamId: 'team_frontdesk', weekday: 5, startTime: '09:00', endTime: '13:00', capacity: 1, active: true },
  { _id: 'rule_frontdesk_sat_0900_1300', businessSlug: 'turagua', teamId: 'team_frontdesk', weekday: 6, startTime: '09:00', endTime: '13:00', capacity: 1, active: true },
  { _id: 'rule_mechanics_mon_0900_1800', businessSlug: 'turagua', teamId: 'team_mechanics', weekday: 1, startTime: '09:00', endTime: '18:00', capacity: 1, active: true },
  { _id: 'rule_mechanics_tue_0900_1800', businessSlug: 'turagua', teamId: 'team_mechanics', weekday: 2, startTime: '09:00', endTime: '18:00', capacity: 1, active: true },
  { _id: 'rule_mechanics_wed_0900_1800', businessSlug: 'turagua', teamId: 'team_mechanics', weekday: 3, startTime: '09:00', endTime: '18:00', capacity: 1, active: true },
  { _id: 'rule_mechanics_thu_0900_1800', businessSlug: 'turagua', teamId: 'team_mechanics', weekday: 4, startTime: '09:00', endTime: '18:00', capacity: 1, active: true },
  { _id: 'rule_mechanics_fri_0900_1800', businessSlug: 'turagua', teamId: 'team_mechanics', weekday: 5, startTime: '09:00', endTime: '18:00', capacity: 1, active: true },
  { _id: 'rule_mechanics_sat_0900_1400', businessSlug: 'turagua', teamId: 'team_mechanics', weekday: 6, startTime: '09:00', endTime: '14:00', capacity: 1, active: true },
  { _id: 'rule_detailing_mon_0800_1800', businessSlug: 'turagua', teamId: 'team_detailing', weekday: 1, startTime: '08:00', endTime: '18:00', capacity: 1, active: true },
  { _id: 'rule_detailing_tue_0800_1800', businessSlug: 'turagua', teamId: 'team_detailing', weekday: 2, startTime: '08:00', endTime: '18:00', capacity: 1, active: true },
  { _id: 'rule_detailing_wed_0800_1800', businessSlug: 'turagua', teamId: 'team_detailing', weekday: 3, startTime: '08:00', endTime: '18:00', capacity: 1, active: true },
  { _id: 'rule_detailing_thu_0800_1800', businessSlug: 'turagua', teamId: 'team_detailing', weekday: 4, startTime: '08:00', endTime: '18:00', capacity: 1, active: true },
  { _id: 'rule_detailing_fri_0800_1800', businessSlug: 'turagua', teamId: 'team_detailing', weekday: 5, startTime: '08:00', endTime: '18:00', capacity: 1, active: true },
  { _id: 'rule_detailing_sat_0800_1800', businessSlug: 'turagua', teamId: 'team_detailing', weekday: 6, startTime: '08:00', endTime: '18:00', capacity: 1, active: true },
  { _id: 'rule_bodywork_mon_0900_1800', businessSlug: 'turagua', teamId: 'team_bodywork', weekday: 1, startTime: '09:00', endTime: '18:00', capacity: 1, active: true },
  { _id: 'rule_bodywork_tue_0900_1800', businessSlug: 'turagua', teamId: 'team_bodywork', weekday: 2, startTime: '09:00', endTime: '18:00', capacity: 1, active: true },
  { _id: 'rule_bodywork_wed_0900_1800', businessSlug: 'turagua', teamId: 'team_bodywork', weekday: 3, startTime: '09:00', endTime: '18:00', capacity: 1, active: true },
  { _id: 'rule_bodywork_thu_0900_1800', businessSlug: 'turagua', teamId: 'team_bodywork', weekday: 4, startTime: '09:00', endTime: '18:00', capacity: 1, active: true },
  { _id: 'rule_bodywork_fri_0900_1800', businessSlug: 'turagua', teamId: 'team_bodywork', weekday: 5, startTime: '09:00', endTime: '18:00', capacity: 1, active: true },
  { _id: 'rule_bodywork_sat_0900_1400', businessSlug: 'turagua', teamId: 'team_bodywork', weekday: 6, startTime: '09:00', endTime: '14:00', capacity: 1, active: true },
];

const MOCK_WORK_TEAM_SCHEDULE_OVERRIDES = [
  {
    _id: 'ovr_frontdesk_20260704_reduced',
    businessSlug: 'turagua',
    teamId: 'team_frontdesk',
    date: '2026-07-04',
    mode: 'replace',
    windows: [{ startTime: '10:00', endTime: '11:00', capacity: 1 }],
    reason: 'Atencion al cliente con horario reducido para pruebas de agenda.',
    active: true,
  },
  {
    _id: 'ovr_detailing_20260704_blocked',
    businessSlug: 'turagua',
    teamId: 'team_detailing',
    date: '2026-07-04',
    mode: 'block',
    windows: [],
    reason: 'Equipo de lavado no disponible para pruebas de bloqueo.',
    active: true,
  },
];

const MOCK_AVAILABILITY_SLOTS = [
  {
    _id: 'slot_tur_20260703_0900_off_brake_service',
    businessSlug: 'turagua',
    catalogOfferingId: 'off_brake_service',
    startAt: '2026-07-03T09:00:00.000-05:00',
    endAt: '2026-07-03T10:00:00.000-05:00',
    status: 'available',
  },
  {
    _id: 'slot_tur_20260703_1000_off_engine_check',
    businessSlug: 'turagua',
    catalogOfferingId: 'off_engine_check',
    startAt: '2026-07-03T10:00:00.000-05:00',
    endAt: '2026-07-03T11:00:00.000-05:00',
    status: 'available',
  },
  {
    _id: 'slot_tur_20260703_1100_off_lavado_premium',
    businessSlug: 'turagua',
    catalogOfferingId: 'off_lavado_premium',
    startAt: '2026-07-03T11:00:00.000-05:00',
    endAt: '2026-07-03T12:00:00.000-05:00',
    status: 'available',
  },
  {
    _id: 'slot_tur_20260704_0900_off_brake_service',
    businessSlug: 'turagua',
    catalogOfferingId: 'off_brake_service',
    startAt: '2026-07-04T09:00:00.000-05:00',
    endAt: '2026-07-04T10:00:00.000-05:00',
    status: 'available',
  },
  {
    _id: 'slot_tur_20260704_1000_off_engine_check',
    businessSlug: 'turagua',
    catalogOfferingId: 'off_engine_check',
    startAt: '2026-07-04T10:00:00.000-05:00',
    endAt: '2026-07-04T11:00:00.000-05:00',
    status: 'available',
  },
  {
    _id: 'slot_tur_20260704_1100_off_lavado_premium',
    businessSlug: 'turagua',
    catalogOfferingId: 'off_lavado_premium',
    startAt: '2026-07-04T11:00:00.000-05:00',
    endAt: '2026-07-04T12:00:00.000-05:00',
    status: 'available',
  },
  {
    _id: 'slot_tur_20260704_1200_off_brake_service',
    businessSlug: 'turagua',
    catalogOfferingId: 'off_brake_service',
    startAt: '2026-07-04T12:00:00.000-05:00',
    endAt: '2026-07-04T13:00:00.000-05:00',
    status: 'available',
  },
];

const dataForNamespace = (collectionName: string, namespace: Exclude<SeedNamespace, 'all'>) => {
  if (namespace === 'demo_test') {
    if (collectionName === 'businessProfiles') return [DEMO_TEST_BUSINESS_PROFILE];
    if (collectionName === 'catalogOfferings') return DEMO_TEST_CATALOG_OFFERINGS;
    if (collectionName === 'workTeams') return DEMO_TEST_WORK_TEAMS;
    if (collectionName === 'workTeamScheduleRules') return DEMO_TEST_WORK_TEAM_SCHEDULE_RULES;
    if (collectionName === 'workTeamScheduleOverrides') return [];
    if (collectionName === 'resourceReservations') return [];
    return [];
  }

  if (collectionName === 'businessProfiles') return [TURAGUA_BUSINESS_PROFILE];
  if (collectionName === 'catalogOfferings') return TURAGUA_CATALOG_OFFERINGS;
  if (collectionName === 'workTeams') return TURAGUA_WORK_TEAMS;
  if (collectionName === 'workTeamScheduleRules') return TURAGUA_WORK_TEAM_SCHEDULE_RULES;
  if (collectionName === 'workTeamScheduleOverrides') return [];
  if (collectionName === 'resourceReservations') return [];
  if (collectionName === 'availabilitySlots') return [];
  return [];
};

const seedNamespace = async (namespace: Exclude<SeedNamespace, 'all'>, reset: boolean) => {
  if (mockData.datasetName !== 'VTKALL_DEMO_PACK_1_TURAGUA_USE_CASES_MOCK_DATA' || mockData.businessSlug !== 'turagua') {
    throw new Error('Invalid mock data set');
  }

  const results: Record<string, number> = {};

  for (const collectionName of ORDER) {
    const model = MODELS[collectionName];
    const data = dataForNamespace(collectionName, namespace);

    if (reset) {
      await model.deleteMany({ businessSlug: namespace });
    }

    if (data.length > 0) {
      if (reset) {
        await model.insertMany(data);
        results[collectionName] = data.length;
      } else {
        let count = 0;
        for (const item of data) {
          await model.updateOne({ _id: item._id }, { $setOnInsert: item }, { upsert: true });
          count++;
        }
        results[collectionName] = count;
      }
    } else {
      results[collectionName] = 0;
    }
  }

  if (namespace === 'turagua') {
    await CatalogOffering.updateMany(
      { _id: { $in: TURAGUA_LEGACY_CATALOG_OFFERING_IDS }, businessSlug: 'turagua' },
      {
        $set: {
          active: false,
          publicVisible: false,
          archivedAt: new Date().toISOString(),
          archivedReason: 'legacy_catalog_offering_replaced_by_canonical_seed',
        },
      }
    ).exec();
  }

  return results;
};

export const seedDatabase = async (reset: boolean = false, namespace: SeedNamespace = (process.env.SEED_BUSINESS_SLUG as SeedNamespace) || 'all') => {
  const namespaces: Exclude<SeedNamespace, 'all'>[] = namespace === 'all' ? ['demo_test', 'turagua'] : [namespace];
  const combinedResults: Record<string, number> = {};

  for (const selectedNamespace of namespaces) {
    if (selectedNamespace !== 'demo_test' && selectedNamespace !== 'turagua') {
      throw new Error(`Unsupported seed namespace: ${selectedNamespace}`);
    }

    const results = await seedNamespace(selectedNamespace, reset);
    console.log(`${selectedNamespace} seed completed.`);
    for (const [key, val] of Object.entries(results)) {
      combinedResults[`${selectedNamespace}.${key}`] = val;
    }
  }

  const landingSeedResults = await seedLandingPages(
    landingSeeds.filter((seed) => namespace === 'all' || seed.businessSlug === namespace),
    reset
  );
  combinedResults['landing.pages'] = landingSeedResults.pages;
  combinedResults['landing.versions'] = landingSeedResults.versions;

  console.log('Seed completed.');
  for (const [key, val] of Object.entries(combinedResults)) {
    console.log(`${key}: ${val}`);
  }
  return combinedResults;
};

export const getSeedStatus = async () => {
  const status: Record<string, number> = {};
  for (const collectionName of ORDER) {
    const model = MODELS[collectionName];
    status[collectionName] = await model.countDocuments({});
  }
  return status;
};
