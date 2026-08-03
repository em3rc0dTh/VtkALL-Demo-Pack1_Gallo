import { apiRequest } from './apiClient';
import { demoTestEndpoints } from './endpoints';
import { assertCustomerResponse } from '../contracts/customer.contract';
import { assertManagedEntityResponse } from '../contracts/managedEntity.contract';
import { assertCaseResponse } from '../contracts/case.contract';
import { assertAvailabilityResponse } from '../contracts/availability.contract';
import { assertAppointmentResponse } from '../contracts/appointment.contract';
import { assertTimelineResponse } from '../contracts/timeline.contract';

export const apiDemoTestRepository = {
  async createCustomer(payload) {
    const response = await apiRequest(demoTestEndpoints.customers, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return assertCustomerResponse(response);
  },

  async createManagedEntity(payload) {
    const response = await apiRequest(demoTestEndpoints.managedEntities, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return assertManagedEntityResponse(response);
  },

  async createCase(payload) {
    const response = await apiRequest(demoTestEndpoints.cases, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return assertCaseResponse(response);
  },

  async getAvailability(params) {
    const urlParams = new URLSearchParams(params);
    const url = `${demoTestEndpoints.availability}?${urlParams.toString()}`;
    const response = await apiRequest(url, { method: 'GET' });
    return assertAvailabilityResponse(response);
  },

  async scheduleConsultation(payload) {
    const { idempotencyKey, ...requestBody } = payload || {};
    const response = await apiRequest(demoTestEndpoints.scheduleConsultation, {
      method: 'POST',
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(requestBody)
    });
    return assertAppointmentResponse(response);
  },

  async getTimeline(caseId, params) {
    const urlParams = new URLSearchParams(params);
    const url = `${demoTestEndpoints.caseTimeline(caseId)}?${urlParams.toString()}`;
    const response = await apiRequest(url, { method: 'GET' });
    return assertTimelineResponse(response);
  }
};
