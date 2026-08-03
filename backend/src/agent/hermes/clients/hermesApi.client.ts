import { ExecutionContext } from '../contracts/executionContext.contract';
import { HermesCompletionInput } from '../contracts/hermesChatRequest.contract';
import { HermesCompletionResult, parseHermesCompletion } from '../contracts/hermesChatResponse.contract';
import { HermesGatewayError, redactHermesSecret } from '../contracts/hermesError.contract';
import { HermesHealthResult, parseHermesHealth } from '../contracts/hermesHealth.contract';
import { toHermesCompletionRequest } from '../mappers/hermesConversation.mapper';

export interface HermesApiClientConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  timeoutMs: number;
}

export interface HermesApiClient {
  getHealth(context: ExecutionContext): Promise<HermesHealthResult>;
  complete(input: HermesCompletionInput, context: ExecutionContext): Promise<HermesCompletionResult>;
}

const normalizeBaseUrl = (baseUrl: string) => {
  try {
    const url = new URL(baseUrl);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('invalid protocol');
    url.pathname = url.pathname.replace(/\/+$/, '');
    return url.toString().replace(/\/$/, '');
  } catch {
    throw new HermesGatewayError('HERMES_CONFIG_ERROR', 'Invalid Hermes base URL.');
  }
};

const mapStatusError = (status: number) => {
  if (status === 401 || status === 403) return new HermesGatewayError('HERMES_UNAUTHORIZED', 'Hermes rejected backend credentials.', { status });
  if (status === 429 || status === 503) return new HermesGatewayError('HERMES_OVERLOADED', 'Hermes is overloaded.', { retryable: true, status });
  if (status === 504) return new HermesGatewayError('HERMES_TIMEOUT', 'Hermes timed out.', { retryable: true, status });
  return new HermesGatewayError('HERMES_PROVIDER_ERROR', 'Hermes returned an unsuccessful response.', { retryable: status >= 500, status });
};

export class HttpHermesApiClient implements HermesApiClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(config: HermesApiClientConfig) {
    if (!config.apiKey) throw new HermesGatewayError('HERMES_CONFIG_ERROR', 'Hermes API key is required when Hermes is enabled.');
    this.baseUrl = normalizeBaseUrl(config.baseUrl);
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.timeoutMs = config.timeoutMs;
  }

  async getHealth(context: ExecutionContext): Promise<HermesHealthResult> {
    const json = await this.requestJson(`${this.baseUrl}/healthz`, {
      method: 'GET',
      correlationId: context.correlationId,
      authorize: false,
    });
    const parsed = parseHermesHealth(json);
    if (!parsed) throw new HermesGatewayError('HERMES_INVALID_RESPONSE', 'Hermes health response is invalid.', { retryable: true });
    return parsed;
  }

  async complete(input: HermesCompletionInput, context: ExecutionContext): Promise<HermesCompletionResult> {
    const body = toHermesCompletionRequest(input, this.model);
    const json = await this.requestJson(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      correlationId: context.correlationId,
      authorize: true,
      body,
    });
    const parsed = parseHermesCompletion(json);
    if (!parsed) throw new HermesGatewayError('HERMES_INVALID_RESPONSE', 'Hermes completion response is invalid.', { retryable: true });
    return parsed;
  }

  private async requestJson(url: string, options: {
    method: 'GET' | 'POST';
    correlationId: string;
    authorize: boolean;
    body?: unknown;
  }) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(url, {
        method: options.method,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-Id': options.correlationId,
          ...(options.authorize ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      const text = await response.text();
      let json: unknown;
      try {
        json = text ? JSON.parse(text) : undefined;
      } catch {
        throw new HermesGatewayError('HERMES_INVALID_RESPONSE', 'Hermes returned malformed JSON.', { retryable: true, status: response.status });
      }

      if (!response.ok) throw mapStatusError(response.status);
      return json;
    } catch (error: any) {
      if (error instanceof HermesGatewayError) throw error;
      if (error?.name === 'AbortError') throw new HermesGatewayError('HERMES_TIMEOUT', 'Hermes request timed out.', { retryable: true });
      const message = redactHermesSecret(String(error?.message || 'Hermes is unavailable.'), this.apiKey);
      throw new HermesGatewayError('HERMES_UNAVAILABLE', message, { retryable: true });
    } finally {
      clearTimeout(timer);
    }
  }
}
