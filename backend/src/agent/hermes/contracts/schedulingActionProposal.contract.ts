export type SchedulingSemanticAction =
  | 'NO_ACTION'
  | 'START_SCHEDULE_CONSULTATION'
  | 'SUBMIT_OFFERING_SELECTION'
  | 'SUBMIT_CUSTOMER_INFORMATION'
  | 'SUBMIT_DATE_PREFERENCE'
  | 'REQUEST_AVAILABILITY'
  | 'SUBMIT_SLOT_SELECTION'
  | 'CANCEL_SCHEDULE_CONSULTATION'
  | 'REQUEST_CLARIFICATION';

export interface SchedulingActionProposal {
  action: SchedulingSemanticAction;
  businessSlug: string;
  conversationId: string;
  customerId?: string;
  caseId?: string;
  workflowId?: string;
  payload: Record<string, unknown>;
  evidence: {
    messageId: string;
    quotedFacts: string[];
  };
  execution: {
    correlationId: string;
    causationId?: string;
    idempotencyKey?: string;
  };
  mode: 'dry_run';
}
