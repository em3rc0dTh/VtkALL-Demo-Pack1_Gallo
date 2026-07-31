import { randomUUID } from 'crypto';

export const createExecutionId = (prefix: 'corr' | 'cause' | 'ctx' = 'ctx') => `${prefix}_${randomUUID()}`;
