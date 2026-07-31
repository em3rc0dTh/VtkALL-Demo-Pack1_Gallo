import { createExecutionId } from './idGenerator';

export type ExecutionActorType =
  | 'customer'
  | 'staff'
  | 'system'
  | 'ai_agent'
  | 'temporal_workflow'
  | 'anonymous';

export type ExecutionChannel =
  | 'http'
  | 'manual_console'
  | 'web'
  | 'whatsapp'
  | 'temporal'
  | 'seed'
  | 'test'
  | 'internal';

export interface ExecutionActor {
  type: ExecutionActorType;
  id?: string;
  name?: string;
}

export interface ExecutionContext {
  correlationId: string;
  causationId: string;
  idempotencyKey?: string;
  businessSlug?: string;
  caseId?: string;
  workflowId?: string;
  workflowRunId?: string;
  activityId?: string;
  channel: ExecutionChannel;
  actor: ExecutionActor;
  requestedAt: string;
  metadata?: Record<string, unknown>;
}

export const createSystemExecutionContext = (input: Partial<ExecutionContext> = {}): ExecutionContext => ({
  correlationId: input.correlationId || createExecutionId('corr'),
  causationId: input.causationId || createExecutionId('cause'),
  idempotencyKey: input.idempotencyKey,
  businessSlug: input.businessSlug,
  caseId: input.caseId,
  workflowId: input.workflowId,
  workflowRunId: input.workflowRunId,
  activityId: input.activityId,
  channel: input.channel || 'internal',
  actor: input.actor || { type: 'system', name: 'demo_test' },
  requestedAt: input.requestedAt || new Date().toISOString(),
  metadata: input.metadata,
});

export const withExecutionScope = (
  context: ExecutionContext | undefined,
  scope: Partial<Pick<ExecutionContext, 'businessSlug' | 'caseId' | 'workflowId' | 'workflowRunId' | 'activityId' | 'idempotencyKey'>>
): ExecutionContext => ({
  ...createSystemExecutionContext(context),
  ...scope,
  idempotencyKey: scope.idempotencyKey || context?.idempotencyKey,
});

export const contextResponse = (context: ExecutionContext) => ({
  correlationId: context.correlationId,
  causationId: context.causationId,
  ...(context.idempotencyKey ? { idempotencyKey: context.idempotencyKey } : {}),
  ...(context.metadata?.idempotentReplay ? {
    idempotentReplay: true,
    originalCorrelationId: context.metadata.originalCorrelationId,
  } : {}),
});
