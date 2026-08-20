import { ApiError } from '../api/apiError';

const validModes = new Set(['api', 'mock']);
const defaultMode = process.env.NODE_ENV === 'development' ? 'mock' : 'api';

export function getDemoTestDataModeStatus() {
  const rawMode = process.env.NEXT_PUBLIC_DEMO_TEST_DATA_MODE
    ?? process.env.NEXT_PUBLIC_DEMO_TEST_DATA_SOURCE
    ?? defaultMode;
  const mode = rawMode.trim();
  const isStrictBuild = process.env.CI === 'true' || process.env.NEXT_PUBLIC_DEMO_TEST_STABLE_MODE === 'true';

  if (!validModes.has(mode)) {
    const reason = mode
      ? `Invalid NEXT_PUBLIC_DEMO_TEST_DATA_MODE "${mode}".`
      : 'NEXT_PUBLIC_DEMO_TEST_DATA_MODE is required.';

    if (isStrictBuild) {
      throw new Error(`${reason} Use "api" or "mock".`);
    }

    return {
      mode: null,
      valid: false,
      error: new ApiError({
        code: 'DEMO_TEST_DATA_MODE_REQUIRED',
        message: `${reason} Use "api" or "mock".`,
        status: 500,
        kind: 'configuration',
      }),
    };
  }

  return {
    mode,
    valid: true,
    error: null,
  };
}

export function requireDemoTestDataMode() {
  const status = getDemoTestDataModeStatus();
  if (!status.valid) {
    throw status.error;
  }
  return status.mode;
}
