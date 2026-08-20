import { ApiError } from './apiError';
import { withBasePath } from '@/lib/config/basePath';

const publicApiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_DEMO_TEST_API_BASE_URL || '').replace(/\/$/, '');
const serverApiBaseUrl = (process.env.NEXT_BACKEND_INTERNAL_URL || publicApiBaseUrl || 'http://localhost:4000').replace(/\/$/, '');

const isLoopbackUrl = (value) => {
  try {
    const parsed = new URL(value);
    return ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
  } catch (error) {
    return false;
  }
};

const browserIsLoopback = () => {
  if (typeof window === 'undefined') return false;
  return ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
};

const primaryUrl = (path) => {
  if (/^https?:\/\//i.test(path)) return path;

  // Browser traffic must stay inside the deployed Next.js basePath so its rewrite
  // can proxy /api/* to the Docker-internal backend service.
  if (typeof window !== 'undefined') return withBasePath(path);

  return `${serverApiBaseUrl}${path}`;
};

const fallbackBrowserUrl = (path) => {
  if (typeof window === 'undefined' || !publicApiBaseUrl || /^https?:\/\//i.test(path)) return null;

  // A localhost API URL embedded at build time is valid only when the browser itself
  // is local. Never make a remote VPS visitor retry against their own machine.
  if (isLoopbackUrl(publicApiBaseUrl) && !browserIsLoopback()) return null;

  const currentOrigin = window.location.origin.replace(/\/$/, '');
  if (publicApiBaseUrl === currentOrigin) return null;
  return `${publicApiBaseUrl}${path}`;
};

const responseContext = (response) => ({
  correlationId: response.headers.get('X-Correlation-Id') || undefined,
  causationId: response.headers.get('X-Causation-Id') || undefined,
  idempotencyKey: response.headers.get('Idempotency-Key') || undefined,
});

export async function apiRequest(path, options = {}) {
  const request = async (url) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const executionContext = responseContext(response);

    if (response.status === 204) {
      return { ok: true, executionContext };
    }

    let payload = null;
    let rawText = '';
    try {
      rawText = await response.text();
      payload = rawText ? JSON.parse(rawText) : null;
    } catch (e) {
      if (!response.ok) {
        const snippet = rawText ? `: ${rawText.replace(/\s+/g, ' ').slice(0, 180)}` : '';
        throw new ApiError({
          code: 'INVALID_API_RESPONSE',
          message: `La respuesta del servidor no es JSON valido (${response.status})${snippet}`,
          status: response.status,
          kind: 'invalid_response',
          cause: e
        });
      }
      return { ok: response.ok, executionContext };
    }

    if (!response.ok || payload?.ok === false) {
      throw ApiError.fromResponse(response, payload);
    }

    return {
      ...payload,
      executionContext,
    };
  };

  try {
    return await request(primaryUrl(path));
  } catch (error) {
    const fallbackUrl = fallbackBrowserUrl(path);
    const canRetryDirectly = error instanceof ApiError
      ? error.code === 'INVALID_API_RESPONSE' || error.status === 404
      : true;

    if (fallbackUrl && canRetryDirectly) {
      try {
        return await request(fallbackUrl);
      } catch (fallbackError) {
        if (fallbackError instanceof ApiError) {
          throw fallbackError;
        }
        throw ApiError.fromNetworkError(fallbackError);
      }
    }

    if (error instanceof ApiError) {
      throw error;
    }
    throw ApiError.fromNetworkError(error);
  }
}
