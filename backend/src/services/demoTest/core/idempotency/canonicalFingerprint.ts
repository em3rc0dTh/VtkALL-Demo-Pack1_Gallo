import { createHash } from 'crypto';

const omittedKeys = new Set([
  'correlationId',
  'causationId',
  'workflowRunId',
  'workflowId',
  'activityId',
  'idempotencyKey',
  'attempt',
  'attempts',
  'requestedAt',
  'createdAt',
  'updatedAt',
]);

const normalizeValue = (value: unknown): unknown => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(normalizeValue);
  }

  if (value && typeof value === 'object') {
    const objectValue = value as Record<string, unknown>;
    return Object.keys(objectValue)
      .filter((key) => !omittedKeys.has(key))
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        const normalized = normalizeValue(objectValue[key]);
        if (normalized !== undefined) {
          acc[key] = normalized;
        }
        return acc;
      }, {});
  }

  return value;
};

export const canonicalizeCommandInput = (input: unknown) => JSON.stringify(normalizeValue(input));

export const fingerprintCommandInput = (input: unknown) =>
  createHash('sha256').update(canonicalizeCommandInput(input)).digest('hex');
