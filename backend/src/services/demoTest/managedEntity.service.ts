import { randomUUID } from 'crypto';
import { Customer } from '../../models/Customer.model';
import { ManagedEntity } from '../../models/ManagedEntity.model';
import { DemoTestDomainError, assertRequired } from './errors';
import { ExecutionContext, executeIdempotentCommand } from './core';
import { CreateManagedEntityInput, GetManagedEntityByIdInput } from './types';

// Policy: ManagedEntity belongs to Customer and must not be embedded into Customer for the canonical demo_test flow.
const createManagedEntityOnce = async (input: CreateManagedEntityInput, context?: ExecutionContext): Promise<unknown> => {
  assertRequired(input.businessSlug, 'businessSlug');
  assertRequired(input.customerId, 'customerId');
  assertRequired(input.type, 'type');

  const customer = await Customer.findOne({ _id: input.customerId, businessSlug: input.businessSlug }).exec();
  if (!customer) {
    throw new DemoTestDomainError('CUSTOMER_NOT_FOUND', 'Customer was not found.', {
      customerId: input.customerId,
      businessSlug: input.businessSlug,
    }, 404);
  }

  return (ManagedEntity as any).create({
    _id: `me_${input.type}_${randomUUID()}`,
    businessSlug: input.businessSlug,
    customerId: input.customerId,
    type: input.type,
    ...(input.displayName ? { displayName: input.displayName } : {}),
    ...(input.summary ? { summary: input.summary } : {}),
    ...(input.data ? { data: input.data } : {}),
    metadata: {
      ...(input.metadata || {}),
      ...(context?.idempotencyKey ? { idempotencyKey: context.idempotencyKey } : {}),
      ...(context?.correlationId ? { correlationId: context.correlationId } : {}),
    },
    status: input.status || 'active',
  });
};

export const createManagedEntity = async (input: CreateManagedEntityInput, context?: ExecutionContext): Promise<unknown> => {
  if (!context?.idempotencyKey) return createManagedEntityOnce(input, context);

  const idempotent = await executeIdempotentCommand<CreateManagedEntityInput, unknown>({
    scope: 'managed_entity.create',
    operation: 'createManagedEntity',
    input,
    context,
    execute: () => createManagedEntityOnce(input, context),
    entityRefs: (managedEntity) => [{ type: 'ManagedEntity', id: String((managedEntity as any)._id) }],
  });

  return idempotent.result;
};

export const getManagedEntityById = async (input: GetManagedEntityByIdInput): Promise<unknown> => {
  assertRequired(input.businessSlug, 'businessSlug');
  assertRequired(input.managedEntityId, 'managedEntityId');

  const managedEntity = await ManagedEntity.findOne({ _id: input.managedEntityId, businessSlug: input.businessSlug }).exec();
  if (!managedEntity) {
    throw new DemoTestDomainError('MANAGED_ENTITY_NOT_FOUND', 'ManagedEntity was not found.', {
      managedEntityId: input.managedEntityId,
      businessSlug: input.businessSlug,
    }, 404);
  }

  return managedEntity;
};
