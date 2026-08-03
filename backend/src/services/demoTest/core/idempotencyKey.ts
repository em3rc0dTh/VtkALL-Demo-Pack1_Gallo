import { SemanticError } from './SemanticError';

const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9_.:-]{1,128}$/;

export const normalizeIdempotencyKey = (value: unknown): string | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  const key = String(value).trim();
  if (!key) {
    throw new SemanticError({
      code: 'VALIDATION_ERROR',
      message: 'Idempotency-Key cannot be empty.',
      httpStatus: 400,
      details: { field: 'Idempotency-Key' },
    });
  }

  if (!IDEMPOTENCY_KEY_PATTERN.test(key)) {
    throw new SemanticError({
      code: 'VALIDATION_ERROR',
      message: 'Idempotency-Key contains unsupported characters or exceeds 128 characters.',
      httpStatus: 400,
      details: { field: 'Idempotency-Key' },
    });
  }

  return key;
};
