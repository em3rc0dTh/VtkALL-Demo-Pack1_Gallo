import { AgentProcessContext } from '../../../mcp/temporal/schemas/agentProcessContext';
import { SchedulingSemanticAction } from '../contracts/schedulingActionProposal.contract';
import { HermesAvailabilityPresentation } from './hermesSchedulingAvailabilityPresentation.service';

export interface SchedulingExecutionResult {
  accepted: boolean;
  committed: boolean;
  action:
    | 'START_SCHEDULE_CONSULTATION'
    | 'SUBMIT_OFFERING_SELECTION'
    | 'SUBMIT_CUSTOMER_INFORMATION'
    | 'SUBMIT_DATE_PREFERENCE'
    | 'SUBMIT_SLOT_SELECTION';
  outcome:
    | 'EXECUTED'
    | 'REPLAYED'
    | 'NO_CHANGE'
    | 'VALIDATION_REJECTED'
    | 'PROCESS_STATE_MISMATCH'
    | 'SEMANTIC_ERROR'
    | 'EXECUTION_UNKNOWN';
  workflow: {
    workflowId?: string;
    started: boolean;
    reused: boolean;
  };
  processContext?: AgentProcessContext;
  availabilityPresentation?: HermesAvailabilityPresentation;
  execution: {
    correlationId: string;
    causationId?: string;
    idempotencyKey: string;
  };
  error?: {
    code: string;
    retryable: boolean;
    message: string;
  };
}

export interface HermesSchedulingBridgeTurnResult {
  handled: boolean;
  committed: boolean;
  runtime: 'hermes';
  bridgeOutcome:
    | 'EXECUTED'
    | 'REPLAYED'
    | 'NO_CHANGE'
    | 'REQUEST_CLARIFICATION'
    | 'PROCESS_STATE_MISMATCH'
    | 'VALIDATION_REJECTED'
    | 'EXECUTION_UNKNOWN';
  semanticActions: SchedulingSemanticAction[];
  executionResults: SchedulingExecutionResult[];
  processContext?: AgentProcessContext;
  message: string;
  workflowId?: string;
  state?: unknown;
  availabilityPresentation?: HermesAvailabilityPresentation;
  canaryBucket: number;
  preCommitFallbackUsed: boolean;
  postCommitLegacyFallbackUsed: false;
  naturalizationFallbackUsed: boolean;
  internalEventPersisted: boolean;
}

export interface HermesSchedulingBridgeDecline {
  handled: false;
  reason:
    | 'FEATURE_DISABLED'
    | 'NOT_IN_CANARY'
    | 'ATTACHMENT_PRESENT'
    | 'SECURITY_RISK'
    | 'ACTION_OUT_OF_SCOPE'
    | 'PROCESS_STATE_OUT_OF_SCOPE'
    | 'INSUFFICIENT_CONTEXT'
    | 'LEGACY_REQUIRED';
  canaryBucket: number;
}
