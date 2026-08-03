import { HermesAgentId, HermesTriageResult } from './hermesTriage.contract';

export interface HermesSubAgentInput {
  triage: HermesTriageResult;
  latestMessage: string;
  history: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  knownFacts: Record<string, unknown>;
  processContext?: unknown;
  businessContext?: unknown;
  catalogContext?: unknown;
  customerContext?: unknown;
  caseContext?: unknown;
  permissions: {
    readOnly: boolean;
    canProposeActions: boolean;
    canExecuteActions: false;
  };
}

export interface HermesSubAgentActionProposal {
  type: string;
  payload: Record<string, unknown>;
}

export interface HermesSubAgentResult {
  agent: HermesAgentId;
  outcome:
    | 'respond'
    | 'action_proposed'
    | 'action_completed'
    | 'clarification_required'
    | 'recovered'
    | 'failed';
  replyDraft?: string;
  proposedActions?: HermesSubAgentActionProposal[];
  knownFacts: Record<string, unknown>;
  pendingFacts: string[];
  requiresAuthoritativeExecution: boolean;
  customerFacingFacts: string[];
  prohibitedClaims: string[];
}
