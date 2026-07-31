import { getMockState } from '../mockDemoTestStore';
import { nextMockId } from '../mockDemoTestIds';
import { nowMockIso } from '../mockDemoTestClock';
import { getMockScenario } from '../mockScenarioController';
import { ApiError } from '../../api/apiError';
import { assertCustomerResponse } from '../../contracts/customer.contract';

// Helper to simulate network latency
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

export async function mockCreateCustomer(payload) {
  await delay();
  
  if (getMockScenario() === 'validation_error' || !payload.name || !payload.phone || !payload.businessSlug) {
    throw new ApiError({
      code: 'VALIDATION_ERROR',
      message: 'businessSlug, name y phone son obligatorios',
      status: 400,
    });
  }

  const state = getMockState();
  
  // Buscar reutilización por teléfono normalizado (ignorando espacios/signos para el match simplificado)
  const normalizedPhone = payload.phone.replace(/\D/g, '');
  const existingCustomer = state.customers.find(c => 
    c.businessSlug === payload.businessSlug && 
    c.phone.replace(/\D/g, '') === normalizedPhone
  );

  let customerToReturn;
  let reused = false;

  if (existingCustomer) {
    customerToReturn = existingCustomer;
    reused = true;
    
    state.timelineEvents.push({
      _id: nextMockId('evt'),
      eventType: 'customer.reused',
      timestamp: nowMockIso(),
      customerId: existingCustomer._id
    });
  } else {
    const newCustomer = {
      _id: nextMockId('cus'),
      businessSlug: payload.businessSlug,
      name: payload.name,
      phone: payload.phone,
      email: payload.email || null,
      dni: payload.dni || null,
      createdAt: nowMockIso()
    };
    
    state.customers.push(newCustomer);
    customerToReturn = newCustomer;
    
    state.timelineEvents.push({
      _id: nextMockId('evt'),
      eventType: 'customer.created',
      timestamp: nowMockIso(),
      customerId: newCustomer._id
    });
  }

  return assertCustomerResponse({
    ok: true,
    customer: customerToReturn,
    reused
  });
}
