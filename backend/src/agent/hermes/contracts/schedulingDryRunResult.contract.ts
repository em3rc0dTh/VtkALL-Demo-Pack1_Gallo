import { SchedulingSemanticAction } from './schedulingActionProposal.contract';

export interface SchedulingDryRunValidationError {
  code: string;
  field?: string;
  message: string;
}

export interface SchedulingDryRunResult {
  accepted: boolean;
  proposedAction: SchedulingSemanticAction;
  executionAllowed: false;
  temporalCalled: false;
  databaseWritten: false;
  status:
    | 'VALID_DRY_RUN'
    | 'NO_ACTION'
    | 'CLARIFICATION_REQUIRED'
    | 'INVALID_PROPOSAL'
    | 'INCONSISTENT_WITH_CONTEXT'
    | 'UNSUPPORTED_IN_H06A';
  requiredFacts: string[];
  knownFacts: Record<string, unknown>;
  validationErrors: SchedulingDryRunValidationError[];
  nextRecommendedAction: SchedulingSemanticAction | null;
}
