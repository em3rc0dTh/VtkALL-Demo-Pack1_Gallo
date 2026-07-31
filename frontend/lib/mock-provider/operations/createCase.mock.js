import { getMockState } from '../mockDemoTestStore';
import { nextMockId } from '../mockDemoTestIds';
import { nowMockIso } from '../mockDemoTestClock';
import { ApiError } from '../../api/apiError';
import { assertCaseResponse } from '../../contracts/case.contract';

const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

export async function mockCreateCase(payload) {
  await delay();

  if (!payload.businessSlug || !payload.verticalType || !payload.customerId || !payload.managedEntityId || !payload.intent) {
    throw new ApiError({
      code: 'VALIDATION_ERROR',
      message: 'businessSlug, verticalType, customerId, managedEntityId, e intent son obligatorios',
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

  const managedEntity = state.managedEntities.find(me => me._id === payload.managedEntityId);
  if (!managedEntity) {
    throw new ApiError({
      code: 'MANAGED_ENTITY_NOT_FOUND',
      message: 'La entidad manejada no existe',
      status: 404,
    });
  }

  if (managedEntity.customerId !== payload.customerId) {
    throw new ApiError({
      code: 'VALIDATION_ERROR',
      message: 'La entidad manejada no pertenece al cliente',
      status: 400,
    });
  }

  if (customer.businessSlug !== payload.businessSlug || managedEntity.businessSlug !== payload.businessSlug) {
    throw new ApiError({
      code: 'VALIDATION_ERROR',
      message: 'El businessSlug no es consistente',
      status: 400,
    });
  }

  const newCase = {
    _id: nextMockId('case'),
    caseNumber: `TUR-2026-${nextMockId('num').split('_').pop()}`,
    businessSlug: payload.businessSlug,
    verticalType: payload.verticalType,
    customerId: payload.customerId,
    managedEntityId: payload.managedEntityId,
    source: payload.source,
    intent: payload.intent,
    status: 'intake',
    createdAt: nowMockIso()
  };

  state.cases.push(newCase);

  // Link earlier events to case visually or just add case.created
  state.timelineEvents.push({
    _id: nextMockId('evt'),
    eventType: 'customer.linked_to_case',
    timestamp: nowMockIso(),
    caseId: newCase._id,
    customerId: customer._id
  });

  state.timelineEvents.push({
    _id: nextMockId('evt'),
    eventType: 'managed_entity.linked_to_case',
    timestamp: nowMockIso(),
    caseId: newCase._id,
    managedEntityId: managedEntity._id
  });

  state.timelineEvents.push({
    _id: nextMockId('evt'),
    eventType: 'case.created',
    timestamp: nowMockIso(),
    caseId: newCase._id
  });

  return assertCaseResponse({
    ok: true,
    case: newCase
  });
}
