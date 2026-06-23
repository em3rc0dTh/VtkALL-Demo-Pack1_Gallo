import Cita from '../models/Cita.js';
import Cliente from '../models/Cliente.js';
import Producto from '../models/Producto.js';
import Servicio from '../models/Servicio.js';
import mongoose from 'mongoose';
import {
  mapCaseInputToCitaPayload,
  mapCitaToCase,
  mapPublicCaseStatusToLegacyStatus
} from '../mappers/caseMapper.js';
import { isValidLegacyCitaStatus, isValidPublicCaseStatus } from './statusService.js';
import { getActiveVerticalConfig } from './verticalConfigService.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export class CaseServiceError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'CaseServiceError';
    this.statusCode = statusCode;
  }
}

const parsePositiveInteger = (value, defaultValue) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const populateCaseRefs = (query) => query
  .populate('cliente', 'nombre dni numero_telefono email')
  .populate('experto_asignado', 'nombre rol')
  .populate('producto_id', 'nombre precio')
  .populate('team_asignado', 'nombre');

const buildListQuery = (filters = {}) => {
  const query = {};

  if (filters.legacyStatus) {
    if (!isValidLegacyCitaStatus(filters.legacyStatus)) {
      throw new CaseServiceError('Invalid legacy case status', 400);
    }
    query.estado = filters.legacyStatus;
  } else if (filters.status) {
    if (!isValidPublicCaseStatus(filters.status)) {
      throw new CaseServiceError('Invalid case status', 400);
    }
    query.estado = mapPublicCaseStatusToLegacyStatus(filters.status);
  }

  if (filters.customerId) {
    query.cliente = filters.customerId;
  }

  if (filters.phone) {
    query.numero_telefono = String(filters.phone).trim();
  }

  if (filters.dateFrom || filters.dateTo) {
    query.fecha_cita = {};
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      if (Number.isNaN(from.getTime())) throw new CaseServiceError('Invalid dateFrom', 400);
      query.fecha_cita.$gte = from;
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      if (Number.isNaN(to.getTime())) throw new CaseServiceError('Invalid dateTo', 400);
      query.fecha_cita.$lte = to;
    }
  }

  if (filters.search) {
    const regex = new RegExp(escapeRegex(filters.search), 'i');
    query.$or = [
      { nombre_cliente: regex },
      { numero_telefono: regex },
      { servicio: regex },
      { descripcion_trabajo: regex },
      { 'vehiculo.marca': regex },
      { 'vehiculo.modelo': regex },
      { 'vehiculo.patente': regex },
      { 'vehiculo.placa': regex }
    ];
  }

  return query;
};

const buildSort = (sort) => {
  if (sort === 'oldest' || sort === 'asc') {
    return { fecha_cita: 1, _id: 1 };
  }

  return { fecha_cita: -1, _id: -1 };
};

const ensureValidId = (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new CaseServiceError('Invalid case id', 400);
  }
};

const safeString = (value) => (typeof value === 'string' ? value.trim() : value);

const validateOptionalObjectId = (id, label) => {
  if (id && !mongoose.isValidObjectId(id)) {
    throw new CaseServiceError(`Invalid ${label}`, 400);
  }
};

const fillMissingCustomerFields = (cliente, customer = {}) => {
  let changed = false;

  if (!cliente.nombre && customer.name) {
    cliente.nombre = customer.name;
    changed = true;
  }

  if (!cliente.dni && customer.dni) {
    cliente.dni = customer.dni;
    changed = true;
  }

  if (!cliente.email && customer.email) {
    cliente.email = customer.email;
    changed = true;
  }

  return changed;
};

const isDuplicateKeyError = (error) => error?.code === 11000;

const resolveOrCreateCliente = async (customer = {}) => {
  const customerId = safeString(customer.id);
  const phone = safeString(customer.phone);
  const customerName = safeString(customer.name);

  if (!customerId && !phone) {
    throw new CaseServiceError('Customer phone or customer id is required', 400);
  }

  if (!customerId && !customerName) {
    throw new CaseServiceError('Customer name is required when customer id is not provided', 400);
  }

  if (customerId) {
    ensureValidId(customerId);
    const cliente = await Cliente.findById(customerId);
    if (!cliente) {
      throw new CaseServiceError('Customer not found', 404);
    }

    if (fillMissingCustomerFields(cliente, customer)) {
      await cliente.save();
    }

    return cliente;
  }

  let cliente = await Cliente.findOne({ numero_telefono: phone });
  if (cliente) {
    if (fillMissingCustomerFields(cliente, customer)) {
      await cliente.save();
    }
    return cliente;
  }

  try {
    return await Cliente.create({
      nombre: customerName,
      numero_telefono: phone,
      dni: safeString(customer.dni) || '',
      email: safeString(customer.email) || ''
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      cliente = await Cliente.findOne({ numero_telefono: phone });
      if (cliente) return cliente;
      throw new CaseServiceError('Duplicate customer phone conflict', 409);
    }

    throw error;
  }
};

const validateCreateCaseInput = (caseInput = {}) => {
  const description = safeString(caseInput.description);

  if (!caseInput.customer || typeof caseInput.customer !== 'object') {
    throw new CaseServiceError('Customer is required', 400);
  }

  if (!description && !caseInput.serviceId && !caseInput.productId) {
    throw new CaseServiceError('Description, serviceId or productId is required', 400);
  }

  const status = safeString(caseInput.status) || 'intake';
  if (!isValidPublicCaseStatus(status)) {
    throw new CaseServiceError('Invalid case status', 400);
  }

  let scheduledDate = null;
  if (caseInput.scheduledDate) {
    scheduledDate = new Date(caseInput.scheduledDate);
    if (Number.isNaN(scheduledDate.getTime())) {
      throw new CaseServiceError('Invalid scheduledDate', 400);
    }
  }

  validateOptionalObjectId(caseInput.serviceId, 'serviceId');
  validateOptionalObjectId(caseInput.productId, 'productId');

  return {
    status,
    scheduledDate: scheduledDate || new Date()
  };
};

const resolveServiceAndProduct = async ({ serviceId, productId }) => {
  let service = null;
  let product = null;

  if (serviceId) {
    service = await Servicio.findById(serviceId);
    if (!service) {
      throw new CaseServiceError('Service not found', 404);
    }
  }

  if (productId) {
    product = await Producto.findById(productId);
    if (!product) {
      throw new CaseServiceError('Product not found', 404);
    }
  }

  return {
    service,
    product,
    serviceName: service?.nombre || null,
    productName: product?.nombre || null
  };
};

export const listCases = async (filters = {}) => {
  const page = parsePositiveInteger(filters.page, DEFAULT_PAGE);
  const requestedLimit = parsePositiveInteger(filters.limit, DEFAULT_LIMIT);
  const limit = Math.min(requestedLimit, MAX_LIMIT);
  const skip = (page - 1) * limit;
  const query = buildListQuery(filters);

  const [total, citas] = await Promise.all([
    Cita.countDocuments(query),
    populateCaseRefs(Cita.find(query))
      .sort(buildSort(filters.sort))
      .skip(skip)
      .limit(limit)
  ]);

  return {
    items: citas.map((cita) => mapCitaToCase(cita)),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

export const getCaseById = async (id) => {
  ensureValidId(id);
  const cita = await populateCaseRefs(Cita.findById(id));

  if (!cita) {
    throw new CaseServiceError('Case not found', 404);
  }

  return mapCitaToCase(cita);
};

export const updateCaseStatus = async (id, status) => {
  if (!isValidPublicCaseStatus(status)) {
    throw new CaseServiceError('Invalid case status', 400);
  }

  ensureValidId(id);
  const cita = await Cita.findById(id);
  if (!cita) {
    throw new CaseServiceError('Case not found', 404);
  }

  cita.estado = mapPublicCaseStatusToLegacyStatus(status);
  await cita.save();

  return getCaseById(cita._id);
};

export const createCase = async (caseInput = {}) => {
  const verticalConfig = getActiveVerticalConfig();
  const { status, scheduledDate } = validateCreateCaseInput(caseInput);
  const legacyStatus = mapPublicCaseStatusToLegacyStatus(status);
  const cliente = await resolveOrCreateCliente(caseInput.customer);
  const { serviceName, productName } = await resolveServiceAndProduct({
    serviceId: caseInput.serviceId,
    productId: caseInput.productId
  });
  const citaPayload = mapCaseInputToCitaPayload(caseInput, {
    verticalConfig,
    cliente,
    legacyStatus,
    serviceName,
    productName,
    productId: caseInput.productId || null,
    scheduledDate
  });

  const cita = await Cita.create(citaPayload);

  try {
    await Cliente.findByIdAndUpdate(cliente._id, { $inc: { total_citas: 1 } });
  } catch (error) {
    console.warn('[WARN] Case created but Cliente.total_citas could not be incremented:', error.message);
  }

  return getCaseById(cita._id);
};
