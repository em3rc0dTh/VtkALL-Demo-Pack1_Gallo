import { statusVariant } from './statusPresentation';

const activeReservationStatuses = new Set(['held', 'booked']);
const closedCaseStatuses = new Set(['closed', 'cancelled', 'completed']);
const concreteCaseStatusTokens = ['scheduled', 'booked', 'confirmed'];
const technicalArtifactTokens = [
  'idempotency',
  'idem_',
  'be tool',
  'be_tool_',
  'missing_key',
  'no_availability',
  'double_booking',
  'capacity_two',
  'capacity_three',
  'contract',
  'smoke',
  'verification',
];

export const indexById = (items = []) => new Map(items.map((item) => [item._id, item]));

export const displayText = (value) => {
  if (value === null || value === undefined) return value;
  return String(value)
    .replace(/ÃƒÂ­/g, 'í')
    .replace(/ÃƒÂ©/g, 'é')
    .replace(/ÃƒÂ¡/g, 'á')
    .replace(/ÃƒÂ³/g, 'ó')
    .replace(/ÃƒÂº/g, 'ú')
    .replace(/ÃƒÂ±/g, 'ñ')
    .replace(/Ã­/g, 'í')
    .replace(/Ã©/g, 'é')
    .replace(/Ã¡/g, 'á')
    .replace(/Ã³/g, 'ó')
    .replace(/Ãº/g, 'ú')
    .replace(/Ã±/g, 'ñ')
    .replace(/Â·/g, '·');
};

export const customerName = (customer) => {
  if (!customer) return 'Sin cliente';
  return displayText(customer.displayName
    || customer.name
    || customer.fullName
    || [customer.firstName, customer.lastName].filter(Boolean).join(' ')
    || customer.contact?.name
    || customer._id);
};

export const customerPhone = (customer) => {
  if (!customer) return 'Sin telefono';
  return customer.phone
    || customer.contact?.phone
    || customer.contact?.phones?.[0]?.display
    || customer.contact?.phones?.[0]?.normalized
    || 'Sin telefono';
};

export const managedEntityLabel = (entity) => {
  if (!entity) return 'Sin vehiculo';
  return displayText(entity.displayName
    || entity.name
    || entity.data?.displayName
    || entity.data?.name
    || entity.data?.plate
    || entity._id);
};

export const managedEntitySecondary = (entity) => {
  if (!entity) return 'Sin dato';
  return displayText(entity.secondaryLabel
    || entity.data?.secondaryLabel
    || entity.data?.plate
    || entity.type
    || 'Sin dato');
};

export const offeringName = (offering) => {
  if (!offering) return 'Sin servicio';
  return displayText(offering.name || offering.title || offering.displayName || offering._id);
};

export const formatDateTime = (value) => {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Fecha invalida';
  return date.toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const variantForStatus = (status = '') => {
  return statusVariant(status);
};

export const caseLabel = (caseItem) => caseItem?.caseNumber || caseItem?._id || 'Sin case';

export const appointmentForCase = (appointments = [], caseId) => (
  appointments.find((appointment) => appointment.caseId === caseId)
);

export const reservationForCase = (reservations = [], caseId, appointmentId) => (
  reservations.find((reservation) => reservation.caseId === caseId || (appointmentId && reservation.appointmentId === appointmentId))
);

export const isTechnicalArtifactText = (value = '') => {
  const normalized = String(value).toLowerCase();
  return technicalArtifactTokens.some((token) => normalized.includes(token));
};

const collectRecordValues = (value, output = []) => {
  if (value === null || value === undefined) return output;

  if (['string', 'number', 'boolean'].includes(typeof value)) {
    output.push(String(value));
    return output;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectRecordValues(item, output));
    return output;
  }

  if (typeof value === 'object') {
    Object.values(value).forEach((item) => collectRecordValues(item, output));
  }

  return output;
};

const recordText = (...records) => collectRecordValues(records).join(' ');

export const isTechnicalArtifactRecord = (...records) => isTechnicalArtifactText(recordText(...records));

export const isOpenCase = (caseItem) => !closedCaseStatuses.has(String(caseItem?.status || '').toLowerCase());

export const isOperationalCaseRecord = ({ caseItem, customer, entity, appointment, reservation } = {}) => {
  if (!caseItem || !isOpenCase(caseItem)) return false;
  if (isTechnicalArtifactRecord(caseItem, customer, entity, appointment, reservation)) return false;

  return Boolean(customer || entity || appointment || reservation);
};

export const isConcreteOperationalCaseRecord = (record = {}) => {
  if (!isOperationalCaseRecord(record)) return false;

  const status = String(record.caseItem?.status || record.appointment?.status || '').toLowerCase();
  return Boolean(
    record.appointment
    || record.reservation
    || concreteCaseStatusTokens.some((token) => status.includes(token))
  );
};

export const isOperationalReservationRecord = ({ reservation, caseItem, customer, entity, appointment } = {}) => {
  if (!reservation || !activeReservationStatuses.has(String(reservation.status || '').toLowerCase())) return false;
  if (!reservation.startAt) return false;
  if (isTechnicalArtifactRecord(reservation, caseItem, customer, entity, appointment)) return false;

  return Boolean(caseItem || appointment || customer || entity);
};

export const reservationsForTeam = (reservations = [], teamId) => (
  reservations.filter((reservation) => reservation.teamId === teamId && activeReservationStatuses.has(reservation.status))
);

export const currentReservationsForTeam = (reservations = [], teamId) => {
  const now = new Date();
  return reservationsForTeam(reservations, teamId).filter((reservation) => {
    const start = new Date(reservation.startAt);
    const end = new Date(reservation.endAt);
    return !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && start <= now && now < end;
  });
};

export const adminEmptyData = {
  customers: [],
  managedEntities: [],
  cases: [],
  appointments: [],
  catalogOfferings: [],
  customerInteractions: [],
  timelineEvents: [],
  notifications: [],
  workTeams: [],
  resourceReservations: [],
};
