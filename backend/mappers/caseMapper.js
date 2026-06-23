import {
  fromLegacyCitaStatusValue,
  toLegacyCitaStatusValue
} from '../services/statusService.js';
import { getActiveVerticalConfig } from '../services/verticalConfigService.js';

const toPlainObject = (value) => {
  if (!value) return value;
  if (typeof value.toObject === 'function') {
    return value.toObject({ virtuals: true });
  }
  return value;
};

const idOf = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value._id) return String(value._id);
  if (value.id) return String(value.id);
  if (typeof value.toString === 'function') return String(value);
  return null;
};

const isoOrNull = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const populatedName = (value, field = 'nombre') => {
  if (!value || typeof value !== 'object') return null;
  return value[field] || null;
};

const normalizeObject = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value;
};

const stringifySummary = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value.trim() || null;
  if (typeof value !== 'object') return String(value);

  const entries = Object.entries(value)
    .filter(([, entryValue]) => entryValue !== undefined && entryValue !== null && entryValue !== '')
    .map(([key, entryValue]) => `${key}: ${entryValue}`);

  return entries.length ? entries.join(', ') : null;
};

const vehicleSummary = (vehiculo) => {
  const vehicle = normalizeObject(vehiculo);
  const parts = [
    vehicle.marca,
    vehicle.modelo,
    vehicle.anio,
    vehicle.patente || vehicle.placa
  ].filter(Boolean);

  return parts.length ? parts.join(' ') : null;
};

const evidenceType = (url) => {
  const cleanUrl = String(url || '').split('?')[0].toLowerCase();
  if (/\.(mp4|webm|mov|avi)$/.test(cleanUrl)) return 'video';
  if (/\.(jpg|jpeg|png|webp|gif|bmp|svg)$/.test(cleanUrl)) return 'image';
  return 'file';
};

export const mapLegacyStatusToPublicCaseStatus = (legacyStatus) => fromLegacyCitaStatusValue(legacyStatus);

export const mapPublicCaseStatusToLegacyStatus = (status) => toLegacyCitaStatusValue(status);

export const buildCaseCustomerFromCita = (cita) => {
  const source = toPlainObject(cita) || {};
  const cliente = source.cliente && typeof source.cliente === 'object'
    ? source.cliente
    : null;

  return {
    id: idOf(source.cliente),
    name: cliente?.nombre || source.nombre_cliente || null,
    phone: cliente?.numero_telefono || source.numero_telefono || null,
    dni: cliente?.dni || null,
    email: cliente?.email || null
  };
};

export const buildManagedEntityFromCita = (cita, verticalConfig = getActiveVerticalConfig()) => {
  const source = toPlainObject(cita) || {};
  const labels = verticalConfig.labels || {};
  const detallesReserva = normalizeObject(source.detalles_reserva);
  const vehiculo = normalizeObject(source.vehiculo);

  if (verticalConfig.vertical === 'custom_orders') {
    return {
      label: labels.managedEntity || 'Pedido personalizado',
      type: 'custom_order',
      data: {},
      summary: stringifySummary(detallesReserva) || source.descripcion_trabajo || null
    };
  }

  if (verticalConfig.vertical === 'technical_repair') {
    return {
      label: labels.managedEntity || 'Equipo',
      type: 'equipment',
      data: vehiculo,
      summary: vehicleSummary(vehiculo) || stringifySummary(detallesReserva) || source.descripcion_trabajo || null
    };
  }

  return {
    label: labels.managedEntity || 'Vehículo',
    type: 'vehicle',
    data: vehiculo,
    summary: vehicleSummary(vehiculo)
  };
};

const buildLegacyDetailsReserva = (caseInput = {}) => {
  const details = {};
  const description = typeof caseInput.description === 'string'
    ? caseInput.description.trim()
    : caseInput.description;
  const managedEntity = normalizeObject(caseInput.managedEntity);

  if (description) {
    details.description = description;
  }

  if (managedEntity.summary) {
    details.managedEntitySummary = managedEntity.summary;
  }

  if (managedEntity.type) {
    details.managedEntityType = managedEntity.type;
  }

  if (caseInput.source) {
    details.source = caseInput.source;
  }

  return details;
};

const legacyOriginFromSource = (source) => {
  const allowedOrigins = new Set(['whatsapp', 'dashboard', 'web']);
  return allowedOrigins.has(source) ? source : 'dashboard';
};

const fallbackServiceName = (verticalConfig) => (
  verticalConfig?.labels?.case ||
  verticalConfig?.labels?.service ||
  'Caso'
);

export const mapCaseInputToCitaPayload = (caseInput = {}, options = {}) => {
  const verticalConfig = options.verticalConfig || getActiveVerticalConfig();
  const customer = normalizeObject(caseInput.customer);
  const managedEntity = normalizeObject(caseInput.managedEntity);
  const cliente = options.cliente || null;
  const description = typeof caseInput.description === 'string'
    ? caseInput.description.trim()
    : caseInput.description;
  const scheduledDate = options.scheduledDate || new Date();
  const serviceName = options.serviceName || options.productName || fallbackServiceName(verticalConfig);
  const payload = {
    cliente: idOf(cliente || customer.id),
    numero_telefono: cliente?.numero_telefono || customer.phone,
    nombre_cliente: cliente?.nombre || customer.name || 'Cliente',
    detalles_reserva: buildLegacyDetailsReserva(caseInput),
    servicio: serviceName,
    descripcion_trabajo: description || managedEntity.summary || '',
    fecha_cita: scheduledDate,
    estado: options.legacyStatus,
    origen: legacyOriginFromSource(caseInput.source),
    tipo_cita: 'Evaluación Presencial',
    producto_id: options.productId || null,
    vehiculo: {}
  };

  if (verticalConfig.vertical === 'vehicle_service' || verticalConfig.vertical === 'technical_repair') {
    payload.vehiculo = normalizeObject(managedEntity.data);
  }

  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  );
};

export const mapCitaToCase = (cita, options = {}) => {
  const source = toPlainObject(cita) || {};
  const verticalConfig = options.verticalConfig || getActiveVerticalConfig();
  const legacyStatus = source.estado || null;
  const product = source.producto_id && typeof source.producto_id === 'object'
    ? source.producto_id
    : null;
  const expert = source.experto_asignado && typeof source.experto_asignado === 'object'
    ? source.experto_asignado
    : null;
  const team = source.team_asignado && typeof source.team_asignado === 'object'
    ? source.team_asignado
    : null;

  return {
    id: idOf(source),
    legacyId: idOf(source),
    legacyType: 'Cita',
    businessSlug: verticalConfig.businessSlug,
    vertical: verticalConfig.vertical,
    status: legacyStatus ? mapLegacyStatusToPublicCaseStatus(legacyStatus) : null,
    legacyStatus,
    customer: buildCaseCustomerFromCita(source),
    managedEntity: buildManagedEntityFromCita(source, verticalConfig),
    service: {
      id: null,
      name: source.servicio || null
    },
    product: {
      id: idOf(source.producto_id),
      name: populatedName(product)
    },
    description: stringifySummary(source.detalles_reserva) || source.descripcion_trabajo || null,
    scheduledDate: isoOrNull(source.fecha_cita),
    expert: {
      id: idOf(source.experto_asignado),
      label: populatedName(expert) || verticalConfig.labels?.expert || null
    },
    expertNotes: source.notas_mecanico || null,
    estimatedPrice: source.precio_estimado ?? 0,
    finalPrice: source.precio_final ?? 0,
    evidence: Array.isArray(source.imagenes)
      ? source.imagenes.filter(Boolean).map((url) => ({
        url,
        type: evidenceType(url),
        source: 'legacy'
      }))
      : [],
    team: {
      id: idOf(source.team_asignado),
      name: populatedName(team)
    },
    workStatus: source.estado_trabajo || null,
    source: 'legacy_cita',
    createdAt: isoOrNull(source.creado_en || source.createdAt),
    updatedAt: isoOrNull(source.actualizado_en || source.updatedAt)
  };
};
