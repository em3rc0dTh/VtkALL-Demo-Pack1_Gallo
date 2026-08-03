import { createSystemExecutionContext, executeIdempotentCommand } from '../../../services/demoTest/core';
import { SchedulingExecutionResult } from './hermesSchedulingExecution.contract';

type ExecuteHermesSchedulingCommandInput = {
  businessSlug: string;
  conversationId: string;
  messageId: string;
  semanticAction: SchedulingExecutionResult['action'];
  payload: Record<string, unknown>;
  correlationId: string;
  causationId?: string;
  workflowId?: string;
  execute: () => Promise<Omit<SchedulingExecutionResult, 'execution'>>;
};

export const buildHermesSchedulingIdempotencyKey = (input: {
  businessSlug: string;
  conversationId: string;
  messageId: string;
  semanticAction: string;
}) =>
  `hermes-scheduling:${input.businessSlug}:${input.conversationId}:${input.messageId}:${input.semanticAction}`;

export const executeHermesSchedulingCommand = async (
  input: ExecuteHermesSchedulingCommandInput
): Promise<SchedulingExecutionResult> => {
  const idempotencyKey = buildHermesSchedulingIdempotencyKey({
    businessSlug: input.businessSlug,
    conversationId: input.conversationId,
    messageId: input.messageId,
    semanticAction: input.semanticAction,
  });

  const context = createSystemExecutionContext({
    businessSlug: input.businessSlug,
    workflowId: input.workflowId,
    channel: 'internal',
    correlationId: input.correlationId,
    causationId: input.causationId,
    idempotencyKey,
    actor: { type: 'system', name: 'hermes-scheduling-bridge' },
    metadata: {
      runtimeMode: 'scheduling_execution',
      conversationId: input.conversationId,
      semanticAction: input.semanticAction,
    },
  });

  const result = await executeIdempotentCommand<
    { businessSlug: string; conversationId: string; messageId: string; semanticAction: string; payload: Record<string, unknown> },
    Omit<SchedulingExecutionResult, 'execution'>
  >({
    scope: 'hermes_scheduling_bridge',
    operation: input.semanticAction,
    input: {
      businessSlug: input.businessSlug,
      conversationId: input.conversationId,
      messageId: input.messageId,
      semanticAction: input.semanticAction,
      payload: input.payload,
    },
    context,
    requireKey: true,
    execute: input.execute,
    buildReplayPayload: (value) => value,
  });

  return {
    ...result.result,
    outcome: result.replayed && result.result.outcome === 'EXECUTED' ? 'REPLAYED' : result.result.outcome,
    execution: {
      correlationId: input.correlationId,
      causationId: input.causationId,
      idempotencyKey,
    },
  };
};
