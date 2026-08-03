import { SemanticError, SemanticErrorCode, registryFor, toApiErrorEnvelope } from './core';

export type DemoTestErrorCode = SemanticErrorCode;

export type DemoTestErrorDetails = Record<string, unknown>;

export type DemoTestErrorResponse = {
  ok: false;
  error: {
    code: DemoTestErrorCode;
    message: string;
    details?: DemoTestErrorDetails;
  };
};

export class DemoTestDomainError extends SemanticError {
  constructor(code: DemoTestErrorCode, message: string, details?: DemoTestErrorDetails, statusCode?: number) {
    super({
      code,
      message,
      details,
      httpStatus: statusCode ?? registryFor(code).httpStatus,
    });
    this.name = 'DemoTestDomainError';
  }

  get statusCode() {
    return this.httpStatus;
  }
}

export const createDemoTestError = (
  code: DemoTestErrorCode,
  message: string,
  details?: DemoTestErrorDetails,
  statusCode = 400
) => new DemoTestDomainError(code, message, details, statusCode);

export const notImplemented = (operation: string) =>
  new DemoTestDomainError(
    'INTERNAL_ERROR',
    `${operation} is not implemented in the PR-002 service skeleton.`,
    { operation, phase: 'PR-002' },
    501
  );

export const assertRequired = (value: unknown, field: string) => {
  if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
    throw new DemoTestDomainError('VALIDATION_ERROR', `${field} is required.`, { field }, 400);
  }
};

export const toDemoTestErrorResponse = (error: unknown): DemoTestErrorResponse => {
  if (error instanceof DemoTestDomainError) {
    return {
      ok: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
    };
  }

  return {
    ok: false,
    error: toApiErrorEnvelope(error, {
      correlationId: 'legacy',
      causationId: 'legacy',
      channel: 'internal',
      actor: { type: 'system', name: 'demo_test' },
      requestedAt: new Date().toISOString(),
    }).body.error,
  };
};
