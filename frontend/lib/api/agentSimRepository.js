import { apiRequest } from './apiClient';
import { demoTestEndpoints } from './endpoints';

const postJson = (path, body) => apiRequest(path, {
  method: 'POST',
  body: JSON.stringify(body || {}),
});

const unwrapData = (response) => response?.data || response;

export const agentSimRepository = {
  async start({ businessSlug, userMessage, assistantMessage }) {
    return unwrapData(await postJson(demoTestEndpoints.agentStart, { businessSlug, userMessage, assistantMessage }));
  },

  async getState({ workflowId }) {
    return unwrapData(await apiRequest(demoTestEndpoints.agentState(workflowId)));
  },

  async selectService({ workflowId, catalogOfferingId, userMessage, assistantMessage }) {
    return unwrapData(await postJson(demoTestEndpoints.agentSelectService(workflowId), { catalogOfferingId, userMessage, assistantMessage }));
  },

  async submitCustomerData({ workflowId, customerData, userMessage, assistantMessage }) {
    return unwrapData(await postJson(demoTestEndpoints.agentCustomerData(workflowId), {
      ...customerData,
      userMessage,
      assistantMessage,
    }));
  },

  async requestSlots({ workflowId, preferredDate, userMessage, assistantMessage }) {
    return unwrapData(await postJson(demoTestEndpoints.agentRequestSlots(workflowId), {
      ...(preferredDate ? { preferredDate } : {}),
      userMessage,
      assistantMessage,
    }));
  },

  async selectSlot({ workflowId, slotId, userMessage, assistantMessage }) {
    return unwrapData(await postJson(demoTestEndpoints.agentSelectSlot(workflowId), { slotId, userMessage, assistantMessage }));
  },

  async openMessage({ businessSlug, conversationId, message }) {
    const { messageId, correlationId } = arguments[0] || {};
    return unwrapData(await postJson(demoTestEndpoints.agentOpenMessage, {
      businessSlug,
      conversationId,
      message,
      ...(messageId ? { messageId } : {}),
      ...(correlationId ? { correlationId } : {}),
    }));
  },

  async message({ workflowId, conversationId, message, messageId, correlationId }) {
    return unwrapData(await postJson(demoTestEndpoints.agentMessage(workflowId), {
      conversationId,
      message,
      ...(messageId ? { messageId } : {}),
      ...(correlationId ? { correlationId } : {}),
    }));
  },
};
