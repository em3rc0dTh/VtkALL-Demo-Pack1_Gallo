import 'dotenv/config';
import { businessToVertical, defaultBusinessSlug, supportedVerticals, verticalConfigs } from './verticals/index.js';

const bool = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === '') return defaultValue;
  return ['true', '1', 'yes', 'y', 'on'].includes(String(value).toLowerCase());
};

const positiveNumber = (value, defaultValue, name) => {
  if (value === undefined || value === null || value === '') return defaultValue;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    console.warn(`[WARN] ${name} invalido; se usara ${defaultValue}.`);
    return defaultValue;
  }

  return parsed;
};

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const configuredJwtSecret = process.env.JWT_SECRET?.trim();
const vertikallConfigStrict = bool(process.env.VERTIKALL_CONFIG_STRICT, false);

const normalizeSlug = (value) => String(value || '').trim().toLowerCase();

const resolveBusinessSlug = () => {
  const configuredBusiness = normalizeSlug(process.env.VERTIKALL_BUSINESS);
  if (!configuredBusiness) return defaultBusinessSlug;

  if (verticalConfigs[configuredBusiness]) return configuredBusiness;

  const message = `VERTIKALL_BUSINESS invalido: "${configuredBusiness}". Valores soportados: ${Object.keys(verticalConfigs).join(', ')}.`;
  if (vertikallConfigStrict) {
    throw new Error(message);
  }

  console.warn(`[WARN] ${message} Se usara ${defaultBusinessSlug}.`);
  return defaultBusinessSlug;
};

const resolveVertical = (businessSlug) => {
  const expectedVertical = businessToVertical[businessSlug];
  const configuredVertical = normalizeSlug(process.env.VERTIKALL_VERTICAL);

  if (!configuredVertical) return expectedVertical;

  if (!supportedVerticals.includes(configuredVertical)) {
    const message = `VERTIKALL_VERTICAL invalido: "${configuredVertical}". Valores soportados: ${supportedVerticals.join(', ')}.`;
    if (vertikallConfigStrict) {
      throw new Error(message);
    }

    console.warn(`[WARN] ${message} Se usara ${expectedVertical}.`);
    return expectedVertical;
  }

  if (configuredVertical !== expectedVertical) {
    const message = `VERTIKALL_VERTICAL "${configuredVertical}" no coincide con VERTIKALL_BUSINESS "${businessSlug}" (${expectedVertical}).`;
    if (vertikallConfigStrict) {
      throw new Error(message);
    }

    console.warn(`[WARN] ${message} Se usara ${expectedVertical}.`);
    return expectedVertical;
  }

  return configuredVertical;
};

const vertikallBusiness = resolveBusinessSlug();
const vertikallVertical = resolveVertical(vertikallBusiness);

if (isProduction && !configuredJwtSecret) {
  throw new Error('JWT_SECRET es obligatorio cuando NODE_ENV=production.');
}

if (!isProduction && !configuredJwtSecret) {
  console.warn('[WARN] JWT_SECRET no esta configurado; se usara un secreto inseguro solo para desarrollo local.');
}

const defaultSameSite = isProduction ? 'none' : 'strict';
const configuredSameSite = process.env.JWT_COOKIE_SAMESITE?.trim().toLowerCase();
const validSameSiteValues = new Set(['strict', 'lax', 'none']);
const jwtCookieSameSite = validSameSiteValues.has(configuredSameSite)
  ? configuredSameSite
  : defaultSameSite;

if (configuredSameSite && !validSameSiteValues.has(configuredSameSite)) {
  console.warn(`[WARN] JWT_COOKIE_SAMESITE invalido; se usara ${defaultSameSite}.`);
}

const jwtCookieMaxAgeHours = positiveNumber(
  process.env.JWT_COOKIE_MAX_AGE_HOURS,
  24,
  'JWT_COOKIE_MAX_AGE_HOURS'
);

export const env = Object.freeze({
  nodeEnv,
  isProduction,
  port: positiveNumber(process.env.PORT, 4000, 'PORT'),
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  jwtSecret: configuredJwtSecret || 'development-only-insecure-jwt-secret',
  jwtCookieName: process.env.JWT_COOKIE_NAME || 'token',
  jwtCookieMaxAgeMs: jwtCookieMaxAgeHours * 60 * 60 * 1000,
  jwtCookieSameSite,
  enableTemporal: bool(process.env.ENABLE_TEMPORAL, false),
  temporalAddress: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
  enableAutoSeed: bool(process.env.ENABLE_AUTO_SEED, true),
  seedProfile: (process.env.SEED_PROFILE || 'legacy').trim().toLowerCase(),
  enableRecordatorios: bool(process.env.ENABLE_RECORDATORIOS, true),
  enablePublicUpload: bool(process.env.ENABLE_PUBLIC_UPLOAD, true),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/mecanica-pro',
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.GCP_API_KEY,
  ollamaUrl: process.env.OLLAMA_URL || 'http://172.17.0.1:11434',
  openwaApiUrl: process.env.OPENWA_API_URL,
  openwaApiKey: process.env.OPENWA_API_KEY,
  openwaSessionName: process.env.OPENWA_SESSION_NAME || 'mecanica-bot',
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || '+14155238886',
  vertikallBusiness,
  vertikallVertical,
  vertikallConfigStrict
});

export { bool, positiveNumber };
