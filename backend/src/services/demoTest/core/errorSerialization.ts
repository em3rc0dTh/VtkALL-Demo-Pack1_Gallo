import { Error as MongooseError } from 'mongoose';
import { isBlockingReservationDuplicateKeyError } from '../resourceReservation.service';
import { contextResponse, ExecutionContext } from './ExecutionContext';
import { SemanticError, isSemanticError } from './SemanticError';

const sanitizeDetails = (details?: Record<string, unknown>) => {
  if (!details) return undefined;
  const blockedKeys = /stack|uri|password|token|secret|index|errmsg/i;
  return Object.fromEntries(Object.entries(details).filter(([key]) => !blockedKeys.test(key)));
};

export const toSemanticError = (error: unknown): SemanticError => {
  if (isSemanticError(error)) {
    return error;
  }

  if (isBlockingReservationDuplicateKeyError(error)) {
    return new SemanticError({
      code: 'DOUBLE_BOOKING_CONFLICT',
      message: 'The selected slot is no longer available.',
      details: {},
    });
  }

  if (error instanceof MongooseError.ValidationError) {
    return new SemanticError({
      code: 'VALIDATION_ERROR',
      message: 'Validation failed.',
      details: { fields: Object.keys(error.errors || {}) },
      cause: error,
    });
  }

  return new SemanticError({
    code: 'INTERNAL_ERROR',
    message: 'Internal error.',
    cause: error,
  });
};

export const toApiErrorEnvelope = (error: unknown, context: ExecutionContext) => {
  const semanticError = toSemanticError(error);
  return {
    statusCode: semanticError.httpStatus,
    body: {
      ok: false,
      error: {
        code: semanticError.code,
        message: semanticError.message,
        retryable: semanticError.retryable,
        ...(semanticError.details ? { details: sanitizeDetails(semanticError.details) } : {}),
      },
      context: contextResponse(context),
    },
  };
};
