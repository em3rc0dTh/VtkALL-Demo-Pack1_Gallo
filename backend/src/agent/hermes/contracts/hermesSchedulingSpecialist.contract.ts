export type HermesSchedulingSpecialistState =
  | 'INTENT_IDENTIFIED'
  | 'COLLECTING_REQUIRED_DATA'
  | 'READY_FOR_AVAILABILITY_CHECK'
  | 'READY_FOR_CONFIRMATION'
  | 'BLOCKED'
  | 'ESCALATION_REQUIRED';

export type HermesSchedulingSlotStatus =
  | 'known'
  | 'inferred'
  | 'declared'
  | 'corrected'
  | 'missing'
  | 'ambiguous'
  | 'not_applicable'
  | 'pending_authority_validation';

export interface HermesSchedulingSlot {
  slot: string;
  status: HermesSchedulingSlotStatus;
  source: 'context' | 'message' | 'inference' | 'correction' | 'process';
  value?: string;
}

export interface HermesSchedulingSpecialistProposal {
  actionType: 'CHECK_AVAILABILITY_REQUEST' | 'CONTINUE_COLLECTION' | 'REQUEST_AUTHORITY';
  semanticPayload: Record<string, unknown>;
  inferredData: string[];
  missingData: string[];
  requiresValidation: string[];
  temporalPreference: {
    preferredDate?: string;
    preferredTime?: string;
    preferredDayPart?: 'morning' | 'afternoon' | 'evening';
    notBeforeTime?: string;
    originalExpression?: string;
    resolvedDate?: string;
    timezone?: string;
    resolutionStatus?: 'RESOLVED';
    availabilityStatus: 'UNVERIFIED';
  };
  idempotencySeed: string;
  authorityRequired: 'availability_authority' | 'execution_authority';
  risks: string[];
  executionAllowed: false;
}
