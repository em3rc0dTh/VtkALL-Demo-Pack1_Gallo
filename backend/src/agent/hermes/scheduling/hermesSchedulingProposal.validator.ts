import { HermesReadOnlyContext } from '../context/hermesContext.contract';
import { SchedulingActionProposal, SchedulingSemanticAction } from '../contracts/schedulingActionProposal.contract';
import { SchedulingDryRunValidationError } from '../contracts/schedulingDryRunResult.contract';

type SchedulingValidationContext = {
  context: HermesReadOnlyContext;
  processState?: any;
  message: string;
};

export interface SchedulingProposalValidation {
  accepted: boolean;
  status: 'VALID_DRY_RUN' | 'NO_ACTION' | 'CLARIFICATION_REQUIRED' | 'INVALID_PROPOSAL' | 'INCONSISTENT_WITH_CONTEXT' | 'UNSUPPORTED_IN_H06A';
  requiredFacts: string[];
  validationErrors: SchedulingDryRunValidationError[];
  nextRecommendedAction: SchedulingSemanticAction | null;
}

const allowedActions: SchedulingSemanticAction[] = [
  'NO_ACTION',
  'START_SCHEDULE_CONSULTATION',
  'SUBMIT_OFFERING_SELECTION',
  'SUBMIT_CUSTOMER_INFORMATION',
  'SUBMIT_DATE_PREFERENCE',
  'REQUEST_AVAILABILITY',
  'SUBMIT_SLOT_SELECTION',
  'CANCEL_SCHEDULE_CONSULTATION',
  'REQUEST_CLARIFICATION',
];

const forbiddenPattern = /\b(taskQueue|signalName|activityType|workflowType|startWorkflow|signalWorkflow|updateWorkflow|mongodb|mongoose|http:\/\/|https:\/\/|shell command)\b/i;
const injectionPattern = /\b(ignore|ignora|inicia|ejecuta|start|run)\b.*\b(workflow|temporal|signal|activity)\b/i;

const addError = (
  errors: SchedulingDryRunValidationError[],
  code: string,
  message: string,
  field?: string
) => errors.push({ code, field, message });

const activeProcessStatus = (processState?: any, context?: HermesReadOnlyContext) =>
  String(processState?.status || context?.process?.status || '');

const offeringExists = (proposal: SchedulingActionProposal, context: HermesReadOnlyContext) =>
  Boolean((context.catalog || []).find((offering) => offering.id === proposal.payload.offeringId));

const authoritativeSlotIds = (processState?: any) =>
  Array.isArray(processState?.availableSlots)
    ? processState.availableSlots.map((slot: any) => String(slot?._id || slot?.id || ''))
    : [];

export const validateSchedulingActionProposal = (
  proposal: SchedulingActionProposal,
  validationContext: SchedulingValidationContext
): SchedulingProposalValidation => {
  const errors: SchedulingDryRunValidationError[] = [];
  const requiredFacts: string[] = [];
  const serialized = JSON.stringify(proposal);
  const processStatus = activeProcessStatus(validationContext.processState, validationContext.context);
  const activeProcess = Boolean(processStatus) && processStatus !== 'APPOINTMENT_BOOKED' && processStatus !== 'CANCELLED';

  if (!allowedActions.includes(proposal.action)) addError(errors, 'ACTION_NOT_ALLOWED', 'Only allowlisted semantic actions are permitted.', 'action');
  if (!proposal.businessSlug) addError(errors, 'BUSINESS_SLUG_REQUIRED', 'businessSlug is required.', 'businessSlug');
  if (!proposal.conversationId) addError(errors, 'CONVERSATION_ID_REQUIRED', 'conversationId is required.', 'conversationId');
  if (!proposal.execution?.correlationId) addError(errors, 'CORRELATION_ID_REQUIRED', 'correlationId is required.', 'execution.correlationId');
  if (proposal.mode !== 'dry_run') addError(errors, 'DRY_RUN_ONLY', 'H06A only accepts mode=dry_run.', 'mode');
  if (
    forbiddenPattern.test(serialized)
    || forbiddenPattern.test(validationContext.message)
    || injectionPattern.test(validationContext.message)
  ) {
    addError(errors, 'SECURITY_RISK', 'Raw workflow primitives or operational instructions are forbidden.');
  }

  switch (proposal.action) {
    case 'NO_ACTION':
      return {
        accepted: errors.length === 0,
        status: errors.length === 0 ? 'NO_ACTION' : 'INVALID_PROPOSAL',
        requiredFacts,
        validationErrors: errors,
        nextRecommendedAction: null,
      };
    case 'REQUEST_CLARIFICATION':
      return {
        accepted: errors.length === 0,
        status: errors.length === 0 ? 'CLARIFICATION_REQUIRED' : 'INVALID_PROPOSAL',
        requiredFacts: ['clarifying_information'],
        validationErrors: errors,
        nextRecommendedAction: null,
      };
    case 'START_SCHEDULE_CONSULTATION':
      if (activeProcess) addError(errors, 'ACTIVE_PROCESS_EXISTS', 'Cannot start a new consultation while another process is active.');
      requiredFacts.push('explicit_booking_intent');
      return {
        accepted: errors.length === 0,
        status: errors.length === 0 ? 'VALID_DRY_RUN' : activeProcess ? 'INCONSISTENT_WITH_CONTEXT' : 'INVALID_PROPOSAL',
        requiredFacts,
        validationErrors: errors,
        nextRecommendedAction: errors.length === 0 ? 'SUBMIT_OFFERING_SELECTION' : 'REQUEST_CLARIFICATION',
      };
    case 'SUBMIT_OFFERING_SELECTION':
      requiredFacts.push('active_process', 'offeringId');
      if (!activeProcess) addError(errors, 'ACTIVE_PROCESS_REQUIRED', 'Offering selection requires an active scheduling process.');
      if (!proposal.payload.offeringId) addError(errors, 'OFFERING_ID_REQUIRED', 'offeringId is required.', 'payload.offeringId');
      if (proposal.payload.offeringId && !offeringExists(proposal, validationContext.context)) {
        addError(errors, 'CROSS_BUSINESS_OFFERING', 'offeringId must belong to the current business catalog.', 'payload.offeringId');
      }
      return {
        accepted: errors.length === 0,
        status: errors.length === 0 ? 'VALID_DRY_RUN' : activeProcess ? 'INVALID_PROPOSAL' : 'INCONSISTENT_WITH_CONTEXT',
        requiredFacts,
        validationErrors: errors,
        nextRecommendedAction: errors.length === 0 ? 'SUBMIT_CUSTOMER_INFORMATION' : 'REQUEST_CLARIFICATION',
      };
    case 'SUBMIT_CUSTOMER_INFORMATION': {
      requiredFacts.push('active_process', 'customer_fields');
      if (!activeProcess) addError(errors, 'ACTIVE_PROCESS_REQUIRED', 'Customer information requires an active scheduling process.');
      const allowedFields = ['firstName', 'lastName', 'phone', 'email'];
      for (const field of Object.keys(proposal.payload || {})) {
        if (!allowedFields.includes(field)) {
          addError(errors, 'FIELD_NOT_ALLOWED', `Field ${field} is not allowed in SUBMIT_CUSTOMER_INFORMATION.`, `payload.${field}`);
        }
      }
      if (!Object.keys(proposal.payload || {}).length) addError(errors, 'CUSTOMER_DATA_REQUIRED', 'At least one customer field is required.');
      return {
        accepted: errors.length === 0,
        status: errors.length === 0 ? 'VALID_DRY_RUN' : activeProcess ? 'INVALID_PROPOSAL' : 'INCONSISTENT_WITH_CONTEXT',
        requiredFacts,
        validationErrors: errors,
        nextRecommendedAction: errors.length === 0 ? 'SUBMIT_DATE_PREFERENCE' : 'REQUEST_CLARIFICATION',
      };
    }
    case 'SUBMIT_DATE_PREFERENCE':
    case 'REQUEST_AVAILABILITY':
      requiredFacts.push('active_process', 'requestedDate');
      if (!activeProcess) addError(errors, 'ACTIVE_PROCESS_REQUIRED', 'Date preference requires an active scheduling process.');
      if (!proposal.payload.requestedDate) addError(errors, 'REQUESTED_DATE_REQUIRED', 'requestedDate is required.', 'payload.requestedDate');
      return {
        accepted: errors.length === 0,
        status: errors.length === 0 ? 'VALID_DRY_RUN' : activeProcess ? 'INVALID_PROPOSAL' : 'INCONSISTENT_WITH_CONTEXT',
        requiredFacts,
        validationErrors: errors,
        nextRecommendedAction: errors.length === 0 ? 'SUBMIT_SLOT_SELECTION' : 'REQUEST_CLARIFICATION',
      };
    case 'SUBMIT_SLOT_SELECTION': {
      requiredFacts.push('active_process', 'slotId');
      if (!activeProcess) addError(errors, 'ACTIVE_PROCESS_REQUIRED', 'Slot selection requires an active scheduling process.');
      if (!proposal.payload.slotId) addError(errors, 'SLOT_ID_REQUIRED', 'slotId is required.', 'payload.slotId');
      const slotIds = authoritativeSlotIds(validationContext.processState);
      if (proposal.payload.slotId && !slotIds.includes(String(proposal.payload.slotId))) {
        addError(errors, 'AUTHORITATIVE_SLOT_REQUIRED', 'slotId must come from authoritative process context.', 'payload.slotId');
      }
      if (errors.length === 0) {
        addError(errors, 'BLOCKED_DRY_RUN', 'H06A cannot execute real slot selection.');
      }
      return {
        accepted: false,
        status: errors.some((error) => error.code === 'AUTHORITATIVE_SLOT_REQUIRED') ? 'INVALID_PROPOSAL' : 'UNSUPPORTED_IN_H06A',
        requiredFacts,
        validationErrors: errors,
        nextRecommendedAction: 'REQUEST_CLARIFICATION',
      };
    }
    case 'CANCEL_SCHEDULE_CONSULTATION':
      requiredFacts.push('active_process', 'explicit_cancellation_intent');
      if (!activeProcess) addError(errors, 'ACTIVE_PROCESS_REQUIRED', 'Cancellation requires an active scheduling process.');
      if (errors.length === 0) addError(errors, 'BLOCKED_DRY_RUN', 'H06A cannot execute real cancellation.');
      return {
        accepted: false,
        status: errors.some((error) => error.code === 'ACTIVE_PROCESS_REQUIRED') ? 'INCONSISTENT_WITH_CONTEXT' : 'UNSUPPORTED_IN_H06A',
        requiredFacts,
        validationErrors: errors,
        nextRecommendedAction: 'REQUEST_CLARIFICATION',
      };
    default:
      addError(errors, 'ACTION_NOT_SUPPORTED', 'Unsupported semantic action.');
      return {
        accepted: false,
        status: 'INVALID_PROPOSAL',
        requiredFacts,
        validationErrors: errors,
        nextRecommendedAction: null,
      };
  }
};
