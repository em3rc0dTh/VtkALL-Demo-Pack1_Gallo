import { env } from '../../../config/env';
import { HttpHermesApiClient } from '../clients/hermesApi.client';

export const getHermesConfig = () => {
  const sample = Number(process.env.HERMES_SHADOW_SAMPLE_PERCENT ?? '100');
  return {
    enabled: process.env.HERMES_ENABLED === 'true',
    shadowEnabled: process.env.HERMES_SHADOW_ENABLED === 'true',
    baseUrl: process.env.HERMES_API_BASE_URL || 'http://127.0.0.1:8642',
    apiKey: process.env.HERMES_API_KEY || '',
    model: process.env.HERMES_MODEL_NAME || 'demo-test-agent',
    timeoutMs: Number(process.env.HERMES_REQUEST_TIMEOUT_MS || '15000'),
    shadowFailOpen: process.env.HERMES_SHADOW_FAIL_OPEN !== 'false',
    shadowSamplePercent: Number.isInteger(sample) && sample >= 0 && sample <= 100 ? sample : 100,
    nodeEnv: env.nodeEnv,
  };
};

export const createHermesApiClient = () => {
  const config = getHermesConfig();
  if (!config.enabled) return undefined;
  return new HttpHermesApiClient({
    baseUrl: config.baseUrl,
    apiKey: config.apiKey,
    model: config.model,
    timeoutMs: config.timeoutMs,
  });
};
