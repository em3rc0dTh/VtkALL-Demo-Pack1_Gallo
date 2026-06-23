import Cita from '../models/Cita.js';
import mongoose from 'mongoose';
import { mapCitaToCase, mapPublicCaseStatusToLegacyStatus } from '../mappers/caseMapper.js';
import { isValidLegacyCitaStatus, isValidPublicCaseStatus } from './statusService.js';

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
