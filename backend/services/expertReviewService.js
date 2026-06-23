import mongoose from 'mongoose';
import Cita from '../models/Cita.js';
import { getCaseById, CaseServiceError } from './caseService.js';
import {
  isValidPublicCaseStatus,
  toLegacyCitaStatusValue
} from './statusService.js';
import { getActiveVerticalConfig } from './verticalConfigService.js';

const ALLOWED_EXPERT_REVIEW_TRANSITIONS = new Set([
  'expert_review',
  'waiting_customer'
]);

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value || {}, key);

const parseOptionalPrice = (input, fieldName) => {
  if (!hasOwn(input, fieldName)) {
    return { present: false, value: undefined };
  }

  const rawValue = input[fieldName];
  if (rawValue === '' || rawValue === null || rawValue === undefined) {
    throw new CaseServiceError(`${fieldName} must be a non-negative number`, 400);
  }

  const value = Number(rawValue);
  if (!Number.isFinite(value) || value < 0) {
    throw new CaseServiceError(`${fieldName} must be a non-negative number`, 400);
  }

  return { present: true, value };
};

const parseOptionalDate = (input, fieldName) => {
  if (!hasOwn(input, fieldName)) {
    return { present: false, value: null };
  }

  const value = new Date(input[fieldName]);
  if (Number.isNaN(value.getTime())) {
    throw new CaseServiceError(`${fieldName} must be a valid date`, 400);
  }

  return { present: true, value };
};

const normalizeEvidenceUrls = (input = {}) => {
  if (!hasOwn(input, 'evidenceUrls')) {
    return { present: false, value: [] };
  }

  if (!Array.isArray(input.evidenceUrls)) {
    throw new CaseServiceError('evidenceUrls must be an array of strings', 400);
  }

  const value = input.evidenceUrls
    .map((url) => {
      if (typeof url !== 'string') {
        throw new CaseServiceError('evidenceUrls must be an array of strings', 400);
      }

      return url.trim();
    })
    .filter(Boolean);

  return { present: true, value };
};

const mergeEvidenceUrls = (existingUrls = [], incomingUrls = []) => {
  const merged = [];
  const seen = new Set();

  const append = (url) => {
    if (typeof url !== 'string') return;
    const cleanUrl = url.trim();
    if (!cleanUrl || seen.has(cleanUrl)) return;
    seen.add(cleanUrl);
    merged.push(cleanUrl);
  };

  existingUrls.forEach(append);
  incomingUrls.forEach(append);

  return merged;
};

const normalizeTransition = (input = {}) => {
  if (!hasOwn(input, 'transitionTo')) {
    return { present: false, value: 'waiting_customer' };
  }

  const transitionTo = typeof input.transitionTo === 'string'
    ? input.transitionTo.trim()
    : input.transitionTo;

  if (!isValidPublicCaseStatus(transitionTo) || !ALLOWED_EXPERT_REVIEW_TRANSITIONS.has(transitionTo)) {
    throw new CaseServiceError('Invalid expert review transition', 400);
  }

  return { present: true, value: transitionTo };
};

const validateExpertReviewInput = (reviewInput = {}) => {
  if (!reviewInput || typeof reviewInput !== 'object' || Array.isArray(reviewInput)) {
    throw new CaseServiceError('Expert review payload must be an object', 400);
  }

  if (hasOwn(reviewInput, 'expertNotes') && typeof reviewInput.expertNotes !== 'string') {
    throw new CaseServiceError('expertNotes must be a string', 400);
  }

  if (hasOwn(reviewInput, 'sendToCustomer') && typeof reviewInput.sendToCustomer !== 'boolean') {
    throw new CaseServiceError('sendToCustomer must be a boolean', 400);
  }

  const proposedPrice = parseOptionalPrice(reviewInput, 'proposedPrice');
  const finalPrice = parseOptionalPrice(reviewInput, 'finalPrice');
  const estimatedDeliveryDate = parseOptionalDate(reviewInput, 'estimatedDeliveryDate');
  const evidenceUrls = normalizeEvidenceUrls(reviewInput);
  const transition = normalizeTransition(reviewInput);
  const hasReviewField = (
    hasOwn(reviewInput, 'expertNotes') ||
    proposedPrice.present ||
    finalPrice.present ||
    estimatedDeliveryDate.present ||
    evidenceUrls.value.length > 0 ||
    transition.present ||
    reviewInput.sendToCustomer === true
  );

  if (!hasReviewField) {
    throw new CaseServiceError('At least one expert review field is required', 400);
  }

  return {
    expertNotes: hasOwn(reviewInput, 'expertNotes') ? reviewInput.expertNotes.trim() : undefined,
    proposedPrice: proposedPrice.value,
    finalPrice: finalPrice.value,
    estimatedDeliveryDate: estimatedDeliveryDate.value,
    evidenceUrls: evidenceUrls.value,
    transitionTo: transition.value,
    sendToCustomer: reviewInput.sendToCustomer === true
  };
};

export const applyExpertReview = async (caseId, reviewInput = {}) => {
  if (!mongoose.isValidObjectId(caseId)) {
    throw new CaseServiceError('Invalid case id', 400);
  }

  const review = validateExpertReviewInput(reviewInput);
  const cita = await Cita.findById(caseId);

  if (!cita) {
    throw new CaseServiceError('Case not found', 404);
  }

  if (review.expertNotes !== undefined) {
    cita.notas_mecanico = review.expertNotes;
  }

  if (review.proposedPrice !== undefined) {
    cita.precio_estimado = review.proposedPrice;
  }

  if (review.finalPrice !== undefined) {
    cita.precio_final = review.finalPrice;
  }

  if (review.evidenceUrls.length > 0) {
    cita.imagenes = mergeEvidenceUrls(cita.imagenes, review.evidenceUrls);
  }

  const verticalConfig = getActiveVerticalConfig();
  if (review.estimatedDeliveryDate && verticalConfig.features?.supportsDeliveryDate === true) {
    cita.fecha_cita = review.estimatedDeliveryDate;
  }

  cita.estado = toLegacyCitaStatusValue(review.transitionTo);

  await cita.save();

  return getCaseById(cita._id);
};
