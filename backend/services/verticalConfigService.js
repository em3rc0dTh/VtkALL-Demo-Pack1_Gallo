import { env } from '../config/env.js';
import { defaultBusinessSlug, verticalConfigs } from '../config/verticals/index.js';

const requiredTopLevelKeys = [
  'businessSlug',
  'businessName',
  'vertical',
  'labels',
  'legacy',
  'statuses',
  'copy',
  'features',
  'promptKey'
];

export const validateVerticalConfig = (config) => {
  if (!config || typeof config !== 'object') {
    return { ok: false, error: 'Vertical config must be an object.' };
  }

  const missingKeys = requiredTopLevelKeys.filter((key) => config[key] === undefined);
  if (missingKeys.length > 0) {
    return { ok: false, error: `Vertical config is missing keys: ${missingKeys.join(', ')}.` };
  }

  if (!config.statuses?.canonical || !config.statuses?.toLegacyCita || !config.statuses?.fromLegacyCita) {
    return { ok: false, error: 'Vertical config statuses must include canonical, toLegacyCita, and fromLegacyCita.' };
  }

  return { ok: true };
};

export const getVerticalConfigByBusinessSlug = (businessSlug) => {
  const normalizedBusinessSlug = String(businessSlug || '').trim().toLowerCase();
  const config = verticalConfigs[normalizedBusinessSlug];

  if (config) return config;

  const message = `Unsupported business slug "${normalizedBusinessSlug}".`;
  if (env.vertikallConfigStrict) {
    throw new Error(message);
  }

  console.warn(`⚠️ ${message} Falling back to ${defaultBusinessSlug}.`);
  return verticalConfigs[defaultBusinessSlug];
};

export const getActiveVerticalConfig = () => {
  const config = getVerticalConfigByBusinessSlug(env.vertikallBusiness);
  const validation = validateVerticalConfig(config);

  if (!validation.ok) {
    if (env.vertikallConfigStrict) {
      throw new Error(validation.error);
    }

    console.warn(`⚠️ ${validation.error} Falling back to ${defaultBusinessSlug}.`);
    return verticalConfigs[defaultBusinessSlug];
  }

  return config;
};

export const getSupportedBusinesses = () => Object.keys(verticalConfigs);

export const getSafePublicVerticalConfig = () => {
  const config = getActiveVerticalConfig();

  return {
    businessSlug: config.businessSlug,
    businessName: config.businessName,
    vertical: config.vertical,
    labels: config.labels,
    statuses: {
      canonical: config.statuses.canonical
    },
    copy: config.copy,
    features: config.features
  };
};
