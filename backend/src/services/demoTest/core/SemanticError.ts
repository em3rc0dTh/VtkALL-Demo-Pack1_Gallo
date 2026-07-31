import { registryFor, SemanticErrorCode } from './errorRegistry';

export class SemanticError extends Error {
  readonly code: SemanticErrorCode;
  readonly httpStatus: number;
  readonly details?: Record<string, unknown>;
  readonly retryable: boolean;
  readonly cause?: unknown;

  constructor(input: {
    code: SemanticErrorCode;
    message: string;
    httpStatus?: number;
    details?: Record<string, unknown>;
    retryable?: boolean;
    cause?: unknown;
  }) {
    super(input.message);
    this.name = 'SemanticError';
    const registry = registryFor(input.code);
    this.code = input.code;
    this.httpStatus = input.httpStatus ?? registry.httpStatus;
    this.details = input.details;
    this.retryable = input.retryable ?? registry.retryable;
    this.cause = input.cause;
  }
}

export const isSemanticError = (error: unknown): error is SemanticError => error instanceof SemanticError;
