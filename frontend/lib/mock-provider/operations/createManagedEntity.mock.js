import { getMockState } from '../mockDemoTestStore';
import { nextMockId } from '../mockDemoTestIds';
import { nowMockIso } from '../mockDemoTestClock';
import { ApiError } from '../../api/apiError';
import { assertManagedEntityResponse } from '../../contracts/managedEntity.contract';

const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

export async function mockCreateManagedEntity(payload) {
  await delay();

  if (!payload.businessSlug || !payload.customerId || !payload.type || !payload.displayName) {
    throw new ApiError({
      code: 'VALIDATION_ERROR',
      message: 'businessSlug, customerId, type y displayName son obligatorios',
      status: 400,
    });
  }

  const state = getMockState();
  
  const customer = state.customers.find(c => c._id === payload.customerId);
  if (!customer) {
    throw new ApiError({
      code: 'CUSTOMER_NOT_FOUND',
      message: 'El cliente no existe',
      status: 404,
    });
  }

  if (customer.businessSlug !== payload.businessSlug) {
    throw new ApiError({
      code: 'VALIDATION_ERROR',
      message: 'El businessSlug no coincide con el del cliente',
      status: 400,
    });
  }

  const newEntity = {
    _id: nextMockId('me'),
    businessSlug: payload.businessSlug,
    customerId: payload.customerId,
    type: payload.type,
    displayName: payload.displayName,
    data: payload.data || null,
    createdAt: nowMockIso()
  };

  state.managedEntities.push(newEntity);

  state.timelineEvents.push({
    _id: nextMockId('evt'),
    eventType: 'managed_entity.created',
    timestamp: nowMockIso(),
    customerId: customer._id,
    managedEntityId: newEntity._id
  });

  return assertManagedEntityResponse({
    ok: true,
    managedEntity: newEntity
  });
}
