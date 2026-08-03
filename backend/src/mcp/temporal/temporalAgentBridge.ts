import { getWorkflowProcessContext, getWorkflowState, signalWorkflow, startScheduleConsultation } from '../../services/agentSim.service';
import {
  AgentProcessContext,
  ContinueScheduleConsultationInput,
  GetScheduleConsultationContextInput,
  StartScheduleConsultationInput,
} from './schemas/agentProcessContext';

const REQUIRED_CUSTOMER_FIELDS = ['firstName', 'lastName', 'phone', 'managedEntityDisplayName'];

const nextMissingField = (state: any) => {
  const data = state?.customerData || {};
  const required = state?.requiredFields?.length
    ? state.requiredFields.map((field: any) => String(field.key))
    : REQUIRED_CUSTOMER_FIELDS;
  return required.find((field: string) => !String(data[field] || '').trim());
};

const awaitingForState = (state: any): AgentProcessContext['awaiting'] => {
  if (!state) return { type: 'none' };
  if (state.status === 'WAITING_FOR_SERVICE_SELECTION') {
    return {
      type: 'offering_selection',
      requiredFields: ['catalogOfferingId'],
      nextRecommendedField: 'catalogOfferingId',
    };
  }
  if (state.status === 'WAITING_FOR_CUSTOMER_DATA') {
    const requiredFields = (state.requiredFields || []).map((field: any) => String(field.key || field.label));
    const nextRecommendedField = nextMissingField(state);
    return {
      type: nextRecommendedField === 'managedEntityDisplayName' ? 'managed_entity_information' : 'customer_information',
      requiredFields,
      nextRecommendedField,
    };
  }
  if (state.status === 'CUSTOMER_DATA_VALIDATED') {
    return {
      type: 'date_preference',
      requiredFields: ['preferredDate'],
      nextRecommendedField: 'preferredDate',
    };
  }
  if (state.status === 'WAITING_FOR_SLOT_SELECTION') {
    return {
      type: 'slot_selection',
      requiredFields: ['slotId'],
      nextRecommendedField: 'slotId',
    };
  }
  return { type: 'none' };
};

const allowedActionsForState = (state: any) => {
  if (!state) return [];
  if (state.status === 'WAITING_FOR_SERVICE_SELECTION') return ['submit_offering_selection', 'cancel_process'];
  if (state.status === 'WAITING_FOR_CUSTOMER_DATA') return ['submit_customer_information', 'cancel_process'];
  if (state.status === 'CUSTOMER_DATA_VALIDATED') return ['submit_date_preference', 'cancel_process'];
  if (state.status === 'WAITING_FOR_SLOT_SELECTION') return ['submit_slot_selection', 'submit_date_preference', 'cancel_process'];
  return [];
};

const availableOptionsForState = (state: any) =>
  state?.status === 'WAITING_FOR_SLOT_SELECTION'
    ? state?.availableSlots || []
    : state?.catalog || [];

export const toAgentProcessContext = (state: any, lastResult?: AgentProcessContext['lastResult']): AgentProcessContext => ({
  process: {
    workflowId: String(state.workflowId || ''),
    workflowType: 'schedule_consultation',
    status: String(state.status || 'UNKNOWN'),
    caseId: state.appointment?.case?._id || state.appointment?.appointment?.caseId,
  },
  knownFacts: {
    offering: state.selectedOffering,
    customer: state.customerData,
    managedEntity: state.customerData?.managedEntityDisplayName
      ? {
        displayName: state.customerData.managedEntityDisplayName,
        summary: state.customerData.managedEntitySummary,
      }
      : undefined,
    selectedSlotId: state.selectedSlotId,
  },
  awaiting: awaitingForState(state),
  allowedActions: allowedActionsForState(state),
  availableOptions: availableOptionsForState(state),
  lastResult,
  rawState: state,
});

const payloadForAction = (input: ContinueScheduleConsultationInput) => {
  const data = input.data || {};
  if (input.action === 'submit_offering_selection') {
    if (!data.catalogOfferingId) throw new Error('catalogOfferingId is required.');
    return {
      signal: 'selectCatalogOffering',
      payload: { catalogOfferingId: String(data.catalogOfferingId) },
    };
  }
  if (input.action === 'submit_customer_information') {
    return {
      signal: 'submitCustomerData',
      payload: data,
    };
  }
  if (input.action === 'submit_date_preference') {
    return {
      signal: 'requestSlots',
      payload: data.preferredDate ? { preferredDate: String(data.preferredDate) } : {},
    };
  }
  if (input.action === 'submit_slot_selection') {
    if (!data.slotId) throw new Error('slotId is required.');
    return {
      signal: 'selectSlot',
      payload: { slotId: String(data.slotId) },
    };
  }
  if (input.action === 'cancel_process') {
    return {
      signal: 'cancelWorkflow',
      payload: { reason: String(data.reason || 'cancelled_by_customer') },
    };
  }
  throw new Error('Unsupported customer process action.');
};

export class TemporalAgentBridge {
  async startScheduleConsultation(input: StartScheduleConsultationInput): Promise<AgentProcessContext> {
    const state = await startScheduleConsultation(input.businessSlug);
    let context = toAgentProcessContext(state, { code: 'PROCESS_STARTED', success: true });

    if (input.offeringId) {
      context = await this.continueScheduleConsultation({
        workflowId: context.process.workflowId,
        conversationId: input.conversationId,
        action: 'submit_offering_selection',
        data: { catalogOfferingId: input.offeringId },
      });
    }

    return context;
  }

  async continueScheduleConsultation(input: ContinueScheduleConsultationInput): Promise<AgentProcessContext> {
    const { signal, payload } = payloadForAction(input);
    const state = await signalWorkflow(input.workflowId, signal, payload);
    return toAgentProcessContext(state, { code: String(input.action).toUpperCase(), success: true });
  }

  async getScheduleConsultationContext(input: GetScheduleConsultationContextInput): Promise<AgentProcessContext> {
    const processContext = await getWorkflowProcessContext(input.workflowId) as AgentProcessContext;
    const state = await getWorkflowState(input.workflowId);
    const fallbackContext = toAgentProcessContext(state, processContext?.lastResult);
    return {
      ...fallbackContext,
      ...processContext,
      availableOptions: Array.isArray(processContext?.availableOptions) && processContext.availableOptions.length
        ? processContext.availableOptions
        : fallbackContext.availableOptions,
      rawState: state,
    };
  }
}

export const temporalAgentBridge = new TemporalAgentBridge();
