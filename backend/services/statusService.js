import { env } from '../config/env.js';
import { getActiveVerticalConfig } from './verticalConfigService.js';

const handleUnknownStatus = (status, context) => {
  const message = `Unknown ${context} status "${status}".`;
  if (env.vertikallConfigStrict) {
    throw new Error(message);
  }

  console.warn(`⚠️ ${message} Returning original value.`);
  return status;
};

export const getCanonicalStatuses = () => getActiveVerticalConfig().statuses.canonical;

const getCanonicalKeyByValue = (publicStatus) => {
  const canonicalStatuses = getCanonicalStatuses();
  return Object.entries(canonicalStatuses).find(([, value]) => value === publicStatus)?.[0];
};

const getPublicStatusValueByKey = (canonicalKeyOrValue) => {
  const canonicalStatuses = getCanonicalStatuses();
  return canonicalStatuses[canonicalKeyOrValue] || canonicalKeyOrValue;
};

export const toLegacyCitaStatus = (canonicalStatus) => {
  const { canonical, toLegacyCita } = getActiveVerticalConfig().statuses;
  const canonicalKey = toLegacyCita[canonicalStatus]
    ? canonicalStatus
    : Object.entries(canonical).find(([, value]) => value === canonicalStatus)?.[0];

  return toLegacyCita[canonicalKey] || handleUnknownStatus(canonicalStatus, 'canonical');
};

export const fromLegacyCitaStatus = (legacyStatus) => {
  const { fromLegacyCita } = getActiveVerticalConfig().statuses;
  return fromLegacyCita[legacyStatus] || handleUnknownStatus(legacyStatus, 'legacy Cita');
};

export const isValidCanonicalStatus = (status) => {
  const canonicalStatuses = getCanonicalStatuses();
  return Object.keys(canonicalStatuses).includes(status) || Object.values(canonicalStatuses).includes(status);
};

export const isValidLegacyCitaStatus = (status) => {
  const { fromLegacyCita } = getActiveVerticalConfig().statuses;
  return Object.keys(fromLegacyCita).includes(status);
};

export const getPublicCaseStatuses = () => Object.values(getCanonicalStatuses());

export const isValidPublicCaseStatus = (status) => getPublicCaseStatuses().includes(status);

export const toLegacyCitaStatusValue = (publicStatus) => {
  const canonicalKey = getCanonicalKeyByValue(publicStatus);
  if (!canonicalKey) {
    return handleUnknownStatus(publicStatus, 'public case');
  }

  return toLegacyCitaStatus(canonicalKey);
};

export const fromLegacyCitaStatusValue = (legacyStatus) => {
  const canonicalKey = fromLegacyCitaStatus(legacyStatus);
  return getPublicStatusValueByKey(canonicalKey);
};
