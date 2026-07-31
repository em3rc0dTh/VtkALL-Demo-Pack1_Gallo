const STATUS_LABELS = {
  appointment_scheduled: 'Cita agendada',
  appointment_booked: 'Cita agendada',
  scheduled: 'Cita agendada',
  booked: 'Reservado',
  held: 'Reservado',
  sent: 'Enviada',
  pending: 'Pendiente',
  waiting: 'Pendiente',
  waiting_customer: 'Pendiente',
  in_progress: 'En proceso',
  active: 'En proceso',
  confirmed: 'Confirmada',
  completed: 'Completada',
  succeeded: 'Completada',
  cancelled: 'Cancelada',
  canceled: 'Cancelada',
  failed: 'Error',
  error: 'Error',
  expired: 'Expirada',
  released: 'Liberada',
  message_recorded: 'Mensaje registrado',
};

const normalizeStatus = (status = '') =>
  String(status || '')
    .trim()
    .replace(/^[A-Z]+[\s_-]+-\s*/i, '')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();

const titleFromStatus = (status = '') =>
  String(status || '')
    .trim()
    .replace(/^[A-Z]+[\s_-]+-\s*/i, '')
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const statusLabel = (status = '') => {
  const normalized = normalizeStatus(status);
  return STATUS_LABELS[normalized] || titleFromStatus(status) || 'Sin estado';
};

export const statusTitle = (status = '') => {
  const raw = String(status || '').trim();
  const label = statusLabel(status);
  return raw && raw !== label ? `${label} (${raw})` : label;
};

export const statusVariant = (status = '') => {
  const normalized = normalizeStatus(status);
  if (['failed', 'cancelled', 'canceled', 'blocked', 'expired', 'error'].some((key) => normalized.includes(key))) return 'danger';
  if (['pending', 'held', 'waiting', 'draft'].some((key) => normalized.includes(key))) return 'warning';
  if (['booked', 'scheduled', 'confirmed', 'completed', 'succeeded'].some((key) => normalized.includes(key))) return 'success';
  if (['in_progress', 'inquiry', 'consultation', 'sent', 'recorded', 'active'].some((key) => normalized.includes(key))) return 'info';
  return 'neutral';
};
