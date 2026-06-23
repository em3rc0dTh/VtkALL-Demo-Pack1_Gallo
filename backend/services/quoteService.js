import mongoose from 'mongoose';
import Cita from '../models/Cita.js';
import { getCaseById, CaseServiceError } from './caseService.js';
import { toLegacyCitaStatusValue } from './statusService.js';
import { getActiveVerticalConfig } from './verticalConfigService.js';

const DEFAULT_CURRENCY = 'PEN';
const QUOTE_LIMITATIONS = [
  'No first-class Quote model yet',
  'Quote text, terms and validUntil are not persisted yet'
];
const DECISION_LIMITATION = 'Customer decision metadata is not persisted yet';

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value || {}, key);

const isObjectPayload = (value) => value && typeof value === 'object' && !Array.isArray(value);

const isoOrNull = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const requireValidCaseId = (caseId) => {
  if (!mongoose.isValidObjectId(caseId)) {
    throw new CaseServiceError('Invalid case id', 400);
  }
};

const requireObjectPayload = (payload, message) => {
  if (payload === undefined || payload === null) return {};

  if (!isObjectPayload(payload)) {
    throw new CaseServiceError(message, 400);
  }

  return payload;
};

const parseOptionalString = (payload, fieldName) => {
  if (!hasOwn(payload, fieldName)) {
    return { present: false, value: null };
  }

  if (typeof payload[fieldName] !== 'string') {
    throw new CaseServiceError(`${fieldName} must be a string`, 400);
  }

  const value = payload[fieldName].trim();
  return { present: true, value: value || null };
};

const parseOptionalRequiredString = (payload, fieldName) => {
  const parsed = parseOptionalString(payload, fieldName);
  if (parsed.present && !parsed.value) {
    throw new CaseServiceError(`${fieldName} must be a non-empty string`, 400);
  }

  return parsed;
};

const parseOptionalPrice = (payload, fieldName) => {
  if (!hasOwn(payload, fieldName)) {
    return { present: false, value: undefined };
  }

  const rawValue = payload[fieldName];
  if (rawValue === '' || rawValue === null || rawValue === undefined) {
    throw new CaseServiceError(`${fieldName} must be a non-negative number`, 400);
  }

  const value = Number(rawValue);
  if (!Number.isFinite(value) || value < 0) {
    throw new CaseServiceError(`${fieldName} must be a non-negative number`, 400);
  }

  return { present: true, value };
};

const parseOptionalDate = (payload, fieldName) => {
  if (!hasOwn(payload, fieldName)) {
    return { present: false, value: null };
  }

  const value = new Date(payload[fieldName]);
  if (Number.isNaN(value.getTime())) {
    throw new CaseServiceError(`${fieldName} must be a valid date`, 400);
  }

  return { present: true, value };
};

const validatePrepareQuoteInput = (quoteInput = {}) => {
  const payload = requireObjectPayload(quoteInput, 'Quote payload must be an object');
  const summary = parseOptionalString(payload, 'summary');
  const terms = parseOptionalString(payload, 'terms');
  const currency = parseOptionalRequiredString(payload, 'currency');
  const proposedPrice = parseOptionalPrice(payload, 'proposedPrice');
  const finalPrice = parseOptionalPrice(payload, 'finalPrice');
  const validUntil = parseOptionalDate(payload, 'validUntil');
  const estimatedDeliveryDate = parseOptionalDate(payload, 'estimatedDeliveryDate');
  const transitionTo = parseOptionalRequiredString(payload, 'transitionTo');

  if (transitionTo.present && transitionTo.value !== 'waiting_customer') {
    throw new CaseServiceError('Invalid quote transition', 400);
  }

  const hasQuoteField = (
    Boolean(summary.value) ||
    Boolean(terms.value) ||
    proposedPrice.present ||
    finalPrice.present ||
    validUntil.present ||
    estimatedDeliveryDate.present ||
    transitionTo.present
  );

  if (!hasQuoteField) {
    throw new CaseServiceError('At least one quote field is required', 400);
  }

  return {
    summary: summary.value,
    terms: terms.value,
    currency: currency.value || DEFAULT_CURRENCY,
    proposedPrice: proposedPrice.value,
    finalPrice: finalPrice.value,
    validUntil: validUntil.value,
    estimatedDeliveryDate: estimatedDeliveryDate.value,
    transitionTo: transitionTo.value
  };
};

const validateDecisionInput = (decisionInput = {}, dateFieldName, stringFieldNames = []) => {
  const payload = requireObjectPayload(decisionInput, 'Decision payload must be an object');
  const normalized = {};

  stringFieldNames.forEach((fieldName) => {
    normalized[fieldName] = parseOptionalString(payload, fieldName).value;
  });

  normalized[dateFieldName] = parseOptionalDate(payload, dateFieldName).value;

  return normalized;
};

const hasPersistedPrice = (cita) => cita?.precio_estimado !== undefined ||
  cita?.precio_final !== undefined;

const approvedAmountFor = (cita) => {
  if (cita?.precio_final !== undefined && cita?.precio_final !== null) return cita.precio_final;
  if (cita?.precio_estimado !== undefined && cita?.precio_estimado !== null) return cita.precio_estimado;
  return null;
};

const deriveQuoteStatus = (legacyStatus) => {
  if (legacyStatus === toLegacyCitaStatusValue('approved')) return 'approved';
  if (legacyStatus === toLegacyCitaStatusValue('cancelled')) return 'rejected';
  return 'prepared';
};

const buildQuoteDto = (cita, options = {}) => {
  const verticalConfig = options.verticalConfig || getActiveVerticalConfig();
  const supportsDeliveryDate = verticalConfig.features?.supportsDeliveryDate === true;
  const limitations = [...QUOTE_LIMITATIONS];

  if (options.includeDecisionLimitation) {
    limitations.push(DECISION_LIMITATION);
  }

  if (options.estimatedDeliveryDateIgnored) {
    limitations.push('estimatedDeliveryDate is not persisted for the active vertical');
  }

  return {
    caseId: String(cita._id),
    legacyType: 'Cita',
    source: 'legacy_cita',
    status: deriveQuoteStatus(cita.estado),
    proposedPrice: cita.precio_estimado ?? null,
    finalPrice: cita.precio_final ?? null,
    approvedAmount: cita.estado === toLegacyCitaStatusValue('approved')
      ? approvedAmountFor(cita)
      : null,
    currency: options.currency || DEFAULT_CURRENCY,
    summary: options.summary || 'Derived from legacy Cita price fields',
    terms: options.terms || null,
    validUntil: isoOrNull(options.validUntil),
    estimatedDeliveryDate: supportsDeliveryDate ? isoOrNull(cita.fecha_cita) : null,
    limitations,
    createdAt: isoOrNull(cita.creado_en || cita.createdAt),
    updatedAt: isoOrNull(cita.actualizado_en || cita.updatedAt)
  };
};

const findCitaById = async (caseId) => {
  requireValidCaseId(caseId);
  const cita = await Cita.findById(caseId);

  if (!cita) {
    throw new CaseServiceError('Case not found', 404);
  }

  return cita;
};

export const prepareCaseQuote = async (caseId, quoteInput = {}) => {
  const quote = validatePrepareQuoteInput(quoteInput);
  const cita = await findCitaById(caseId);
  const verticalConfig = getActiveVerticalConfig();

  if (quote.proposedPrice !== undefined) {
    cita.precio_estimado = quote.proposedPrice;
  }

  if (quote.finalPrice !== undefined) {
    cita.precio_final = quote.finalPrice;
  }

  if (quote.transitionTo) {
    cita.estado = toLegacyCitaStatusValue(quote.transitionTo);
  }

  const shouldPersistDeliveryDate = quote.estimatedDeliveryDate &&
    verticalConfig.features?.supportsDeliveryDate === true;

  if (shouldPersistDeliveryDate) {
    cita.fecha_cita = quote.estimatedDeliveryDate;
  }

  await cita.save();

  return {
    case: await getCaseById(cita._id),
    quote: buildQuoteDto(cita, {
      verticalConfig,
      currency: quote.currency,
      summary: quote.summary,
      terms: quote.terms,
      validUntil: quote.validUntil,
      estimatedDeliveryDateIgnored: Boolean(quote.estimatedDeliveryDate && !shouldPersistDeliveryDate)
    })
  };
};

export const getCaseQuote = async (caseId) => {
  const cita = await findCitaById(caseId);

  if (!hasPersistedPrice(cita)) {
    throw new CaseServiceError('Quote not found', 404);
  }

  return buildQuoteDto(cita);
};

export const approveCaseQuote = async (caseId, decisionInput = {}) => {
  validateDecisionInput(decisionInput, 'approvedAt', ['approvedBy', 'decisionNotes']);
  const cita = await findCitaById(caseId);

  if (!hasPersistedPrice(cita)) {
    throw new CaseServiceError('Quote not found', 404);
  }

  cita.estado = toLegacyCitaStatusValue('approved');
  await cita.save();

  return {
    case: await getCaseById(cita._id),
    quote: buildQuoteDto(cita, { includeDecisionLimitation: true })
  };
};

export const rejectCaseQuote = async (caseId, decisionInput = {}) => {
  validateDecisionInput(decisionInput, 'rejectedAt', ['rejectedBy', 'reason']);
  const cita = await findCitaById(caseId);
  const includeQuote = hasPersistedPrice(cita);

  cita.estado = toLegacyCitaStatusValue('cancelled');
  await cita.save();

  return {
    case: await getCaseById(cita._id),
    quote: includeQuote
      ? buildQuoteDto(cita, { includeDecisionLimitation: true })
      : null
  };
};
