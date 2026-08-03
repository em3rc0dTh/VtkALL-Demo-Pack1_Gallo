export type HermesDecision =
  | 'RESPOND_DIRECTLY'
  | 'ASK_FOR_INFORMATION'
  | 'DELEGATE_INFORMATIONAL'
  | 'PROPOSE_ACTION'
  | 'CONTINUE_ACTIVE_PROCESS'
  | 'ESCALATE'
  | 'DECLINE_UNSAFE_REQUEST';

export type HermesSkillId =
  | 'customer-conversation'
  | 'catalog-advisor'
  | 'scheduling-specialist'
  | 'scheduling-companion'
  | 'recovery-escalation';

export interface HermesIntentSummary {
  type: string;
  summary: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface HermesCorrectionSummary {
  field: string;
  previousValue?: string;
  nextValue?: string;
  reason: 'explicit_correction' | 'superseded_value';
}

export interface HermesQuestionSummary {
  type: 'price' | 'duration' | 'compatibility' | 'business_information' | 'unknown';
  summary: string;
}

export interface HermesTurnArbitrationSummary {
  lane:
    | 'identity_recovery'
    | 'active_process_data'
    | 'active_process_side_question'
    | 'action_or_booking'
    | 'domain_conversation'
    | 'social'
    | 'clarification'
    | 'clearly_external';
  reasonCode: string;
}

export interface HermesTurnAssessment {
  turnId: string;
  businessSlug: string;
  conversationId: string;
  turnText?: string;
  activeProcess: boolean;
  processStatus?: string;
  awaiting?: {
    type?: string;
    nextRecommendedField?: string;
  };
  primaryIntent: HermesIntentSummary;
  secondaryIntents: HermesIntentSummary[];
  extractedData: {
    firstName?: string;
    lastName?: string;
    phonePresent: boolean;
    emailPresent: boolean;
    offeringId?: string;
    requestedDate?: string;
    requestedTime?: string;
    requestedDayPart?: 'morning' | 'afternoon' | 'evening';
    notBeforeTime?: string;
    slotId?: string;
    managedEntityHint?: string;
    managedEntityYear?: string;
  };
  knownData: {
    customerKnown: boolean;
    phoneKnown: boolean;
    emailKnown: boolean;
    managedEntityKnown: boolean;
    activeCaseKnown: boolean;
    selectedOfferingKnown: boolean;
  };
  corrections: HermesCorrectionSummary[];
  questions: HermesQuestionSummary[];
  missingData: string[];
  arbitration?: HermesTurnArbitrationSummary;
  recommendedDecision: HermesDecision;
  confidence: 'high' | 'medium' | 'low';
}
