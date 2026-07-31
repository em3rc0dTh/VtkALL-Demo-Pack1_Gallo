import { apiRequest } from '../api/apiClient';

const adminHeaders = () => ({
  'X-Demo-Test-Admin-Token': process.env.NEXT_PUBLIC_DEMO_TEST_ADMIN_WRITE_TOKEN || 'local-dev-admin',
});

export const adminMutationRepository = {
  async updateCaseStatus({ caseId, status, statusGroup, reason }) {
    const response = await apiRequest(`/api/v1/cases/${encodeURIComponent(caseId)}`, {
      method: 'PATCH',
      headers: adminHeaders(),
      body: JSON.stringify({
        status,
        ...(statusGroup ? { statusGroup } : {}),
        ...(reason ? { reason } : {}),
      }),
    });

    return response?.data || response;
  },

  async createCustomerInteraction({
    businessSlug,
    caseId,
    customerId,
    conversationId,
    workflowId,
    body,
    direction = 'outbound',
    channel = 'admin_web',
  }) {
    const response = await apiRequest('/api/v1/customer-interactions', {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify({
        _id: `ci_${crypto.randomUUID()}`,
        businessSlug,
        caseId,
        customerId,
        conversationId,
        workflowId,
        channel,
        direction,
        actorType: 'admin',
        interactionType: 'manual_message',
        status: 'sent',
        body,
        message: body,
      }),
    });

    return response?.data || response;
  },

  async updateBusinessProfile({ profileId, patch }) {
    const response = await apiRequest(`/api/v1/business-profiles/${encodeURIComponent(profileId)}`, {
      method: 'PATCH',
      headers: adminHeaders(),
      body: JSON.stringify(patch),
    });

    return response?.data || response;
  },
};
