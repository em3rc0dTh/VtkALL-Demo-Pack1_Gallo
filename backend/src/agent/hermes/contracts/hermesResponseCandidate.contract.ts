import { HermesDispatchPlan } from './hermesDispatchPlan.contract';
import { HermesReadOnlyContext } from '../context/hermesContext.contract';
import { HermesSkillId, HermesTurnAssessment } from './hermesTurnAssessment.contract';
import { HermesSkillResult } from './hermesSkillRegistry.contract';

export interface ResponseSynthesisInput {
  turnId: string;
  conversationId: string;
  correlationId: string;
  businessSlug: string;
  agentPersona?: {
    name?: string;
    role?: string;
  };
  userMessage: string;
  turnAssessment: HermesTurnAssessment;
  dispatchPlan: HermesDispatchPlan;
  skillResult?: HermesSkillResult;
  readOnlyContext?: HermesReadOnlyContext;
  activeProcessSummary?: {
    active: boolean;
    status?: string;
    owner?: HermesSkillId;
  };
  knownFacts: Record<string, unknown>;
  sideQuestions: Array<{ type: string; summary: string }>;
  language: string;
  businessTimezone?: string;
  visibilityMode: 'candidate_only' | 'shadow' | 'visible_controlled';
}

export type HermesResponseCandidateStatus =
  | 'CANDIDATE_READY'
  | 'NEEDS_LEGACY'
  | 'NEEDS_CLARIFICATION'
  | 'ESCALATION_REQUIRED'
  | 'BLOCKED_UNSAFE'
  | 'NO_PUBLIC_RESPONSE';

export interface HermesResponseCandidate {
  status: HermesResponseCandidateStatus;
  candidateText: string;
  responsePurpose:
    | 'direct_response'
    | 'clarification'
    | 'process_continuation'
    | 'proposal_disclosure'
    | 'escalation'
    | 'fallback';
  processContinuity: 'none' | 'maintained' | 'released' | 'blocked';
  answeredSideQuestions: string[];
  pendingQuestion?: string;
  actionDisclosure: {
    executionOccurred: false;
    availabilityVerified: boolean;
    confirmationIssued: false;
  };
  authorityDisclosure: {
    mentionsPendingValidation: boolean;
    mentionsPendingAvailability: boolean;
    mentionsHumanReview: boolean;
  };
  sourceSkillId?: HermesSkillId;
  sourceSkillVersion?: string;
  requiresVisibilityGate: true;
  fallbackRecommendation: 'none' | 'legacy' | 'escalation' | 'safe_silence';
  sanitizedMetadata: Record<string, unknown>;
}
