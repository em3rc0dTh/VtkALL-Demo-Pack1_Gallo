export type AgentProcessContext = {
  process: {
    workflowId: string;
    workflowType: 'schedule_consultation';
    status: string;
    caseId?: string;
  };
  knownFacts: {
    offering?: unknown;
    customer?: unknown;
    managedEntity?: unknown;
    selectedSlotId?: string;
  };
  awaiting: {
    type:
      | 'none'
      | 'offering_selection'
      | 'customer_information'
      | 'managed_entity_information'
      | 'date_preference'
      | 'slot_selection'
      | 'customer_confirmation'
      | 'human_review'
      | 'other';
    requiredFields?: string[];
    optionalFields?: string[];
    nextRecommendedField?: string;
  };
  allowedActions: string[];
  availableOptions?: unknown[];
  lastResult?: {
    code: string;
    success: boolean;
    data?: unknown;
  };
  rawState?: unknown;
};

export type StartScheduleConsultationInput = {
  businessSlug: string;
  conversationId: string;
  offeringId?: string;
  customerMessage?: string;
};

export type ContinueScheduleConsultationInput = {
  workflowId: string;
  conversationId?: string;
  action:
    | 'submit_offering_selection'
    | 'submit_customer_information'
    | 'submit_date_preference'
    | 'submit_slot_selection'
    | 'cancel_process';
  data?: Record<string, unknown>;
};

export type GetScheduleConsultationContextInput = {
  workflowId: string;
};
