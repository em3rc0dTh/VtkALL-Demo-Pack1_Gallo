import { randomUUID } from 'crypto';
import { TimelineEvent } from '../../models/TimelineEvent.model';
import { assertRequired } from './errors';
import { ExecutionContext, createSystemExecutionContext } from './core';
import { TIMELINE_POLICY } from './types';
import { ListTimelineByCaseInput, RecordTimelineEventInput } from './types';

const actorFromContext = (context?: ExecutionContext) => {
  if (!context) return undefined;
  const legacyType = context.actor.type === 'temporal_workflow'
    ? 'workflow'
    : context.actor.type === 'ai_agent'
      ? 'agent'
      : context.actor.type === 'anonymous'
        ? 'user'
        : context.actor.type;
  return {
    type: legacyType,
    id: context.actor.id,
    name: context.actor.name || context.actor.type,
  };
};

const executionMetadata = (context?: ExecutionContext) => {
  if (!context) return undefined;
  return {
    correlationId: context.correlationId,
    causationId: context.causationId,
    idempotencyKey: context.idempotencyKey,
    workflowId: context.workflowId,
    workflowRunId: context.workflowRunId,
    activityId: context.activityId,
    channel: context.channel,
  };
};

// Policy: timeline writes fail orchestration before appointment creation.
// After appointment + reservation are booked, timeline failure should be surfaced as a warning instead of rolling back into inconsistency.
export const recordTimelineEvent = async (input: RecordTimelineEventInput, context?: ExecutionContext): Promise<unknown> => {
  assertRequired(input.businessSlug, 'businessSlug');
  assertRequired(input.caseId, 'caseId');
  assertRequired(input.eventType, 'eventType');
  assertRequired(input.title, 'title');
  void TIMELINE_POLICY;

  return (TimelineEvent as any).create({
    _id: `evt_${randomUUID()}`,
    businessSlug: input.businessSlug,
    caseId: input.caseId,
    eventType: input.eventType,
    title: input.title,
    ...(input.description ? { description: input.description } : {}),
    visibility: input.visibility || 'internal',
    actor: input.actor || actorFromContext(context) || { type: 'system', name: 'demo_test' },
    execution: executionMetadata(context || createSystemExecutionContext({
      businessSlug: input.businessSlug,
      caseId: input.caseId,
      channel: 'internal',
    })),
    ...(input.metadata ? { metadata: input.metadata } : {}),
  });
};

export const listTimelineByCase = async (input: ListTimelineByCaseInput): Promise<unknown[]> => {
  assertRequired(input.businessSlug, 'businessSlug');
  assertRequired(input.caseId, 'caseId');

  return TimelineEvent.find({ businessSlug: input.businessSlug, caseId: input.caseId }).sort({ createdAt: -1 }).exec();
};
