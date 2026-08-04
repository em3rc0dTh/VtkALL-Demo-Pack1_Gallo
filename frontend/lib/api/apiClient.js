import { ApiError } from './apiError';

const publicApiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_DEMO_TEST_API_BASE_URL || '').replace(/\/$/, '');
const serverApiBaseUrl = (process.env.NEXT_BACKEND_INTERNAL_URL || publicApiBaseUrl || 'http://localhost:4000').replace(/\/$/, '');
const apiBaseUrl = typeof window !== 'undefined' ? publicApiBaseUrl : serverApiBaseUrl;

const absoluteUrl = (path) => {
  if (/^https?:\/\//i.test(path)) return path;
  return `${apiBaseUrl}${path}`;
};

const fallbackBrowserUrl = (path) => {
  if (typeof window === 'undefined' || !publicApiBaseUrl || /^https?:\/\//i.test(path)) return null;
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
    return await request(absoluteUrl(path));
  } catch (error) {
    const fallbackUrl = fallbackBrowserUrl(path);
    const canRetryDirectly = error instanceof ApiError
      ? error.code === 'INVALID_API_RESPONSE'
      : true;
    if (fallbackUrl && canRetryDirectly) {
      return request(fallbackUrl);
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw ApiError.fromNetworkError(error);
  }
}
