import { HermesDecision, HermesSkillId, HermesTurnAssessment } from './hermesTurnAssessment.contract';

export interface HermesDispatchPlan {
  turnId: string;
  businessSlug: string;
  conversationId: string;
  workflowId?: string;
  correlationId: string;
  decision: HermesDecision;
  selectedSkill: HermesSkillId;
  selectionReason: string;
  confidence: 'high' | 'medium' | 'low';
  activeProcessOwner?: HermesSkillId;
  dataMissing: string[];
  actionAllowed: false;
  nextBehavior:
    | 'respond_now'
    | 'ask_next_question'
    | 'delegate_read_only'
    | 'prepare_dry_run_only'
    | 'continue_existing_process'
    | 'escalate_or_fallback'
    | 'decline';
  executionState: 'planned';
  assessment: HermesTurnAssessment;
  skillContext: {
    objective: string;
    processStatus?: string;
    relevantFacts: Record<string, unknown>;
    missingData: string[];
    temporalContext?: {
      referenceTimestamp: string;
      businessTimezone?: string;
      locale?: string;
    };
  };
  createdAt: string;
}
