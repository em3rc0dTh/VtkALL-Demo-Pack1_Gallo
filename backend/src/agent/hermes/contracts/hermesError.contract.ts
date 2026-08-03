export type HermesErrorCode =
  | 'HERMES_UNAVAILABLE'
  | 'HERMES_TIMEOUT'
  | 'HERMES_UNAUTHORIZED'
  | 'HERMES_INVALID_RESPONSE'
  | 'HERMES_OVERLOADED'
  | 'HERMES_PROVIDER_ERROR'
  | 'HERMES_CONFIG_ERROR';

export class HermesGatewayError extends Error {
  readonly code: HermesErrorCode;
  readonly retryable: boolean;
  readonly status?: number;

  constructor(code: HermesErrorCode, message: string, options: { retryable?: boolean; status?: number } = {}) {
    super(message);
    this.name = 'HermesGatewayError';
    this.code = code;
    this.retryable = options.retryable ?? false;
    this.status = options.status;
  }
}

export const redactHermesSecret = (value: string, apiKey?: string) => {
  if (!apiKey) return value;
  return value.split(apiKey).join('[REDACTED]');
};
