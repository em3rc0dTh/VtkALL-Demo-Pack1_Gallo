export type HermesAgentId =
  | 'conversation-agent'
  | 'catalog-agent'
  | 'scheduling-agent'
  | 'recovery-agent';

export type HermesTriageMode =
  | 'respond'
  | 'respond_only'
  | 'act'
  | 'respond_and_act'
  | 'clarify'
  | 'recover';

export type HermesCatalogMatchStatus =
  | 'exact'
  | 'alias'
  | 'recent_list_reference'
  | 'none'
  | 'ambiguous';

export type HermesProposedCapability =
  | 'search_catalog'
  | 'get_offering_details'
  | 'start_schedule_consultation'
  | 'continue_schedule_consultation'
  | 'get_current_process_state';

export interface HermesTriageResult {
  intent: string;
  mode: HermesTriageMode;
  facts: Record<string, unknown>;
  catalogMatch: {
    status: HermesCatalogMatchStatus;
    offeringId?: string;
    confidence: 'high' | 'medium' | 'low';
  };
  sideQuestion?: {
    detected: boolean;
    topic?: string;
  };
  selectedAgent: HermesAgentId;
  supportingAgents?: HermesAgentId[];
  requiredContext: string[];
  workflowAdvanceAllowed: boolean;
  proposals: Array<{
    capability: HermesProposedCapability;
    arguments: Record<string, unknown>;
    reasonCode: string;
  }>;
  responseGoal: {
    answerCurrentMessageFirst: boolean;
    discloseAuthoritativeResult: boolean;
    resumePendingProcess: boolean;
    pendingField?: string;
  };
  confidence: 'high' | 'medium' | 'low';
  reasonCode: string;
  process?: {
    active: boolean;
    status?: string;
    awaiting?: string;
  };
}
