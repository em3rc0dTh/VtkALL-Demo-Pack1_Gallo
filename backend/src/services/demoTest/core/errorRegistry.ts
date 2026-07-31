export type SemanticErrorCode =
  | 'VALIDATION_ERROR'
  | 'CUSTOMER_NOT_FOUND'
  | 'MANAGED_ENTITY_NOT_FOUND'
  | 'CASE_NOT_FOUND'
  | 'WORK_TEAM_NOT_FOUND'
  | 'CATALOG_OFFERING_NOT_FOUND'
  | 'NO_AVAILABILITY'
  | 'DOUBLE_BOOKING_CONFLICT'
  | 'RESERVATION_FAILED'
  | 'APPOINTMENT_CREATION_FAILED'
  | 'TIMELINE_WRITE_FAILED'
  | 'IDEMPOTENCY_KEY_REQUIRED'
  | 'IDEMPOTENCY_CONFLICT'
  | 'COMMAND_IN_PROGRESS'
  | 'IDEMPOTENCY_RECORD_FAILED'
  | 'INVALID_STATE_TRANSITION'
  | 'CONFIGURATION_ERROR'
  | 'INTERNAL_ERROR';

export type ErrorRegistryEntry = {
  httpStatus: number;
  retryable: boolean;
};

export const semanticErrorRegistry: Record<SemanticErrorCode, ErrorRegistryEntry> = {
  VALIDATION_ERROR: { httpStatus: 400, retryable: false },
  CUSTOMER_NOT_FOUND: { httpStatus: 404, retryable: false },
  MANAGED_ENTITY_NOT_FOUND: { httpStatus: 404, retryable: false },
  CASE_NOT_FOUND: { httpStatus: 404, retryable: false },
  WORK_TEAM_NOT_FOUND: { httpStatus: 404, retryable: false },
  CATALOG_OFFERING_NOT_FOUND: { httpStatus: 404, retryable: false },
  NO_AVAILABILITY: { httpStatus: 409, retryable: false },
  DOUBLE_BOOKING_CONFLICT: { httpStatus: 409, retryable: true },
  RESERVATION_FAILED: { httpStatus: 500, retryable: true },
  APPOINTMENT_CREATION_FAILED: { httpStatus: 500, retryable: true },
  TIMELINE_WRITE_FAILED: { httpStatus: 500, retryable: true },
  IDEMPOTENCY_KEY_REQUIRED: { httpStatus: 400, retryable: false },
  IDEMPOTENCY_CONFLICT: { httpStatus: 409, retryable: false },
  COMMAND_IN_PROGRESS: { httpStatus: 409, retryable: true },
  IDEMPOTENCY_RECORD_FAILED: { httpStatus: 500, retryable: true },
  INVALID_STATE_TRANSITION: { httpStatus: 409, retryable: false },
  CONFIGURATION_ERROR: { httpStatus: 500, retryable: false },
  INTERNAL_ERROR: { httpStatus: 500, retryable: false },
};

export const registryFor = (code: SemanticErrorCode) => semanticErrorRegistry[code] || semanticErrorRegistry.INTERNAL_ERROR;
