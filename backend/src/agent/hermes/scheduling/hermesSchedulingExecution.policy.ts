import { stableCanaryBucket } from '../routing/hermesQaCanary.service';
import { HermesReadOnlyContext } from '../context/hermesContext.contract';
import { HermesSchedulingIntent } from '../contracts/hermesSchedulingIntent.contract';
import { SchedulingActionProposal } from '../contracts/schedulingActionProposal.contract';

export const H06B_ALLOWED_ACTIONS = [
  'START_SCHEDULE_CONSULTATION',
  'SUBMIT_OFFERING_SELECTION',
  'SUBMIT_CUSTOMER_INFORMATION',
  'SUBMIT_DATE_PREFERENCE',
] as const;

export type H06BAllowedAction = typeof H06B_ALLOWED_ACTIONS[number];
export const H06D_ALLOWED_ACTIONS = [...H06B_ALLOWED_ACTIONS, 'SUBMIT_SLOT_SELECTION'] as const;
export type H06DAllowedAction = typeof H06D_ALLOWED_ACTIONS[number];

export type HermesSchedulingBridgeConfig = {
  enabled: boolean;
  canaryPercent: number;
  availabilityEnabled: boolean;
  availabilityCanaryPercent: number;
  availabilityMaxSlotsPresented: number;
  reuseValidAvailabilityResults: boolean;
  bookingEnabled: boolean;
  bookingCanaryPercent: number;
  bookingPostCommitLegacyFallback: false;
  bookingRecheckAvailability: boolean;
  failOpenPreCommit: boolean;
  postCommitLegacyFallback: false;
  maxActionsPerTurn: number;
};

export const getHermesSchedulingBridgeConfig = (): HermesSchedulingBridgeConfig => {
  const canary = Number(process.env.HERMES_SCHEDULING_BRIDGE_CANARY_PERCENT || '0');
  const maxActions = Number(process.env.HERMES_SCHEDULING_BRIDGE_MAX_ACTIONS_PER_TURN || '2');
  const availabilityCanary = Number(process.env.HERMES_AVAILABILITY_CANARY_PERCENT || '0');
  const maxSlots = Number(process.env.HERMES_AVAILABILITY_MAX_SLOTS_PRESENTED || '5');
  const bookingCanary = Number(process.env.HERMES_BOOKING_CANARY_PERCENT || '0');
  return {
    enabled: process.env.HERMES_SCHEDULING_BRIDGE_ENABLED === 'true',
    canaryPercent: Number.isFinite(canary) ? Math.max(0, Math.min(100, Math.trunc(canary))) : 0,
    availabilityEnabled: process.env.HERMES_AVAILABILITY_ENABLED === 'true',
    availabilityCanaryPercent: Number.isFinite(availabilityCanary) ? Math.max(0, Math.min(100, Math.trunc(availabilityCanary))) : 0,
    availabilityMaxSlotsPresented: Number.isFinite(maxSlots) ? Math.max(1, Math.min(10, Math.trunc(maxSlots))) : 5,
    reuseValidAvailabilityResults: process.env.HERMES_AVAILABILITY_REUSE_VALID_RESULTS !== 'false',
    bookingEnabled: process.env.HERMES_BOOKING_ENABLED === 'true',
    bookingCanaryPercent: Number.isFinite(bookingCanary) ? Math.max(0, Math.min(100, Math.trunc(bookingCanary))) : 0,
    bookingPostCommitLegacyFallback: false,
    bookingRecheckAvailability: process.env.HERMES_BOOKING_RECHECK_AVAILABILITY !== 'false',
    failOpenPreCommit: process.env.HERMES_SCHEDULING_BRIDGE_FAIL_OPEN_PRE_COMMIT !== 'false',
    postCommitLegacyFallback: false,
    maxActionsPerTurn: Number.isFinite(maxActions) ? Math.max(1, Math.min(2, Math.trunc(maxActions))) : 2,
  };
};

export const getHermesSchedulingBridgeBucket = (businessSlug: string, conversationId: string) =>
  stableCanaryBucket(businessSlug, conversationId);

export const isHermesSchedulingBridgeCanaryEnabled = (businessSlug: string, conversationId: string, percent: number) => {
  if (percent <= 0) return false;
  if (percent >= 100) return true;
  return getHermesSchedulingBridgeBucket(businessSlug, conversationId) < percent;
};

export const SUPPORTED_PROCESS_STATES = [
  'NO_ACTIVE_PROCESS',
  'WAITING_FOR_SERVICE_SELECTION',
  'WAITING_FOR_CUSTOMER_DATA',
  'CUSTOMER_DATA_VALIDATED',
  'WAITING_FOR_SLOT_SELECTION',
] as const;

export const OUT_OF_SCOPE_PROCESS_STATES = [
  'SLOT_SELECTED',
  'APPOINTMENT_BOOKED',
  'CANCELLED',
  'FAILED_SERVICE_NOT_IN_CATALOG',
  'FAILED_SLOT_UNAVAILABLE',
] as const;

export const normalizeProcessState = (processContext?: HermesReadOnlyContext['process'], processState?: any) => {
  const status = String(processState?.status || processContext?.status || '').trim();
  if (!status) return 'NO_ACTIVE_PROCESS';
  return status;
};

export const isSupportedProcessState = (status: string) =>
  status === 'NO_ACTIVE_PROCESS'
  || status === 'WAITING_FOR_SERVICE_SELECTION'
  || status === 'WAITING_FOR_CUSTOMER_DATA'
  || status === 'CUSTOMER_DATA_VALIDATED'
  || status === 'WAITING_FOR_SLOT_SELECTION';

export const isOutOfScopeSchedulingIntent = (intent: HermesSchedulingIntent) =>
  intent.type === 'cancel_booking'
  || intent.type === 'reschedule_booking';

export const isAllowedSchedulingBridgeAction = (action: string): action is H06DAllowedAction =>
  (H06D_ALLOWED_ACTIONS as readonly string[]).includes(action);

export const hasSchedulingSecurityRisk = (message: string) =>
  /\b(ignore|ignora|manda|ejecuta|run|start)\b.*\b(temporal|workflow|signal|activity|task queue)\b/i.test(message)
  || /\b(http:\/\/|https:\/\/|mongoose|mongodb|shell command)\b/i.test(message);

export const sanitizeProposalWorkflowAuthority = (
  proposal: SchedulingActionProposal,
  resolvedWorkflowId?: string
) => {
  if (!proposal.workflowId) return { accepted: true };
  if (!resolvedWorkflowId) {
    return { accepted: false, code: 'PROCESS_NOT_FOUND', message: 'workflowId cannot be authoritative without a backend-resolved active process.' };
  }
  if (String(proposal.workflowId) !== String(resolvedWorkflowId)) {
    return { accepted: false, code: 'PROCESS_STATE_MISMATCH', message: 'workflowId contradicts the backend-resolved active process.' };
  }
  return { accepted: true };
};
