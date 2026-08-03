import { HermesReadOnlyContext } from '../context/hermesContext.contract';
import { HermesSchedulingIntent } from '../contracts/hermesSchedulingIntent.contract';
import { SchedulingActionProposal, SchedulingSemanticAction } from '../contracts/schedulingActionProposal.contract';

type ProposalInput = {
  intent: HermesSchedulingIntent;
  context: HermesReadOnlyContext;
  processState?: any;
  correlationId: string;
  causationId?: string;
  workflowId?: string;
};

const knownCustomerFields = (intent: HermesSchedulingIntent) => {
  const payload: Record<string, unknown> = {};
  for (const field of ['firstName', 'lastName', 'phone', 'email'] as const) {
    if (intent.extracted[field]) payload[field] = intent.extracted[field];
  }
  return payload;
};

const actionForIntent = (intent: HermesSchedulingIntent, processState?: any): SchedulingSemanticAction => {
  switch (intent.type) {
    case 'start_booking':
      return 'START_SCHEDULE_CONSULTATION';
    case 'select_offering':
      return 'SUBMIT_OFFERING_SELECTION';
    case 'provide_customer_data':
      return 'SUBMIT_CUSTOMER_INFORMATION';
    case 'request_availability':
    case 'continue_booking':
      return intent.extracted.requestedDate ? 'SUBMIT_DATE_PREFERENCE' : 'REQUEST_CLARIFICATION';
    case 'select_slot':
      return 'SUBMIT_SLOT_SELECTION';
    case 'cancel_booking':
      return 'CANCEL_SCHEDULE_CONSULTATION';
    case 'side_question':
    case 'none':
      return 'NO_ACTION';
    case 'reschedule_booking':
    case 'ambiguous':
      return processState?.status ? 'REQUEST_CLARIFICATION' : 'NO_ACTION';
    default:
      return 'NO_ACTION';
  }
};

const payloadForIntent = (intent: HermesSchedulingIntent) => {
  switch (intent.type) {
    case 'start_booking':
      return {
        ...knownCustomerFields(intent),
        ...(intent.extracted.offeringId ? { offeringId: intent.extracted.offeringId } : {}),
      };
    case 'select_offering':
      return {
        offeringId: intent.extracted.offeringId,
        offeringReference: intent.extracted.offeringReference,
      };
    case 'provide_customer_data':
      return knownCustomerFields(intent);
    case 'request_availability':
      return {
        ...(intent.extracted.requestedDate ? { requestedDate: intent.extracted.requestedDate } : {}),
        ...(intent.extracted.requestedTime ? { requestedTime: intent.extracted.requestedTime } : {}),
        ...(intent.extracted.requestedDayPart ? { requestedDayPart: intent.extracted.requestedDayPart } : {}),
        ...(intent.extracted.notBeforeTime ? { notBeforeTime: intent.extracted.notBeforeTime } : {}),
      };
    case 'select_slot':
      return {
        slotId: intent.extracted.slotId,
      };
    case 'cancel_booking':
      return {
        ...(intent.extracted.cancellationReason ? { cancellationReason: intent.extracted.cancellationReason } : {}),
      };
    default:
      return {};
  }
};

const quotedFactsForIntent = (intent: HermesSchedulingIntent) => {
  const facts: string[] = [];
  if (intent.extracted.firstName) facts.push(`firstName:${intent.extracted.firstName}`);
  if (intent.extracted.lastName) facts.push(`lastName:${intent.extracted.lastName}`);
  if (intent.extracted.phone) facts.push('phonePresent:true');
  if (intent.extracted.email) facts.push('emailPresent:true');
  if (intent.extracted.offeringId) facts.push(`offeringId:${intent.extracted.offeringId}`);
  if (intent.extracted.requestedDate) facts.push(`requestedDate:${intent.extracted.requestedDate}`);
  if (intent.extracted.requestedTime) facts.push(`requestedTime:${intent.extracted.requestedTime}`);
  if (intent.extracted.requestedDayPart) facts.push(`requestedDayPart:${intent.extracted.requestedDayPart}`);
  if (intent.extracted.notBeforeTime) facts.push(`notBeforeTime:${intent.extracted.notBeforeTime}`);
  if (intent.extracted.slotId) facts.push(`slotId:${intent.extracted.slotId}`);
  return facts;
};

export const buildSchedulingActionProposal = (input: ProposalInput): SchedulingActionProposal => {
  const action = actionForIntent(input.intent, input.processState);
  const context = input.context;
  return {
    action,
    businessSlug: input.intent.source.businessSlug,
    conversationId: input.intent.source.conversationId,
    customerId: context.customer?.customerId,
    caseId: context.case?.caseId,
    workflowId: input.workflowId,
    payload: payloadForIntent(input.intent),
    evidence: {
      messageId: input.intent.source.messageId,
      quotedFacts: quotedFactsForIntent(input.intent),
    },
    execution: {
      correlationId: input.correlationId,
      causationId: input.causationId,
      idempotencyKey: `h06a:${input.intent.source.businessSlug}:${input.intent.source.conversationId}:${input.intent.source.messageId}`,
    },
    mode: 'dry_run',
  };
};
