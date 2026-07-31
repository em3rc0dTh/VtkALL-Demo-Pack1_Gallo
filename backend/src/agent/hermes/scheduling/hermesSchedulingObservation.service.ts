import { buildHermesReadOnlyContext } from '../context/hermesContextBuilder.service';
import { runHermesSchedulingDryRun, shouldRunHermesSchedulingDryRun } from './hermesSchedulingDryRun.service';

export interface HermesSchedulingObservationInput {
  businessSlug: string;
  conversationId: string;
  workflowId?: string;
  message: string;
  messageId?: string;
  correlationId: string;
  causationId?: string;
  processState?: any;
  customerId?: string;
  managedEntityId?: string;
  caseId?: string;
}

export const observeHermesSchedulingDryRun = async (input: HermesSchedulingObservationInput) => {
  if (!shouldRunHermesSchedulingDryRun()) return undefined;

  const built = await buildHermesReadOnlyContext({
    businessSlug: input.businessSlug,
    conversationId: input.conversationId,
    channel: 'web_agent',
    customerId: input.customerId,
    managedEntityId: input.managedEntityId,
    caseId: input.caseId,
    processState: input.processState,
  });

  return runHermesSchedulingDryRun({
    businessSlug: input.businessSlug,
    conversationId: input.conversationId,
    workflowId: input.workflowId,
    message: input.message,
    messageId: input.messageId,
    correlationId: input.correlationId,
    causationId: input.causationId,
    processState: input.processState,
    context: built.context,
    persist: true,
  });
};
