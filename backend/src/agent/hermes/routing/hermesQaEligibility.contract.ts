import { HermesReadOnlyContext } from '../context/hermesContext.contract';

export type HermesQaCategory =
  | 'greeting'
  | 'agent_identity'
  | 'business_information'
  | 'automotive_qa'
  | 'automotive_symptom'
  | 'active_process_question'
  | 'catalog_list'
  | 'catalog_detail'
  | 'catalog_comparison'
  | 'general_faq';

export type HermesQaIneligibleReason =
  | 'FEATURE_DISABLED'
  | 'NOT_IN_CANARY'
  | 'ACTIVE_PROCESS'
  | 'ACTIVE_OPERATIONAL_CASE'
  | 'TRANSACTIONAL_INTENT'
  | 'AVAILABILITY_REQUEST'
  | 'PERSONAL_DATA_WRITE'
  | 'BOOKING_REQUEST'
  | 'CANCELLATION_REQUEST'
  | 'RESCHEDULE_REQUEST'
  | 'CONFIRMATION_REQUEST'
  | 'ATTACHMENT_PRESENT'
  | 'UNSUPPORTED_CATEGORY'
  | 'INSUFFICIENT_CONTEXT'
  | 'AMBIGUOUS_MESSAGE'
  | 'SECURITY_RISK';

export interface HermesQaEligibilityDecision {
  eligible: boolean;
  runtime: 'hermes' | 'legacy';
  category?: HermesQaCategory;
  reason: HermesQaIneligibleReason | `ALLOWLIST_${Uppercase<HermesQaCategory>}`;
  confidence: 'high' | 'not_applicable';
  readOnly: true;
  canaryBucket?: number;
}

export interface HermesQaEligibilityInput {
  businessSlug: string;
  conversationId: string;
  message: string;
  attachmentIds?: string[];
  context?: HermesReadOnlyContext;
}
