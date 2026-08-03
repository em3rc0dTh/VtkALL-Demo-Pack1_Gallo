export interface BusinessPublicContext {
  businessSlug: string;
  businessName?: string;
  verticalType?: string;
  timezone?: string;
  agent?: {
    name?: string;
    role?: string;
    personality?: string;
  };
  features?: {
    supportsAppointments?: boolean;
  };
}

export interface PublicOfferingSummary {
  id: string;
  name?: string;
  description?: string;
  durationMinutes?: number;
  pricing: {
    type: 'not_published' | 'published';
    currency?: string;
  };
  publicVisible: boolean;
  active: boolean;
}

export interface CustomerPublicSummary {
  identityStatus: 'anonymous' | 'identified';
  customerId?: string;
  displayName?: string;
  knownFacts: {
    phoneKnown: boolean;
    emailKnown: boolean;
  };
}

export interface ManagedEntityPublicSummary {
  managedEntityId: string;
  type?: string;
  displayName?: string;
  summary?: string;
}

export interface CasePublicSummary {
  caseId: string;
  caseNumber?: string;
  status?: string;
  statusGroup?: string;
  intent?: {
    type?: string;
    summary?: string;
    selectedOfferingId?: string;
  };
  flags: {
    hasAppointment: boolean;
  };
}

export interface ReadOnlyProcessSummary {
  active: boolean;
  processType?: string;
  status?: string;
  awaiting?: {
    type?: string;
    field?: string;
    nextRecommendedField?: string;
  };
  knownFacts?: Record<string, unknown>;
  availableOptions?: Array<{
    id?: string;
    label?: string;
    startAt?: string;
    endAt?: string;
  }>;
  allowedActions: string[];
  informationalOnly: true;
}

export interface HermesReadOnlyContext {
  business?: BusinessPublicContext;
  conversation: {
    conversationId: string;
    channel: string;
    history: Array<{
      role: 'user' | 'assistant';
      content: string;
    }>;
    memory?: {
      version: number;
      summary: string;
      activeTopic?: string;
      salientFacts: Array<{
        key: string;
        value: unknown;
        category: string;
        confidence: string;
      }>;
      unresolvedQuestions: Array<{
        topic: string;
        question: string;
      }>;
      lastAssistantQuestion?: {
        question: string;
        expectedField?: string;
        messageId: string;
      };
    };
  };
  customer?: CustomerPublicSummary;
  managedEntity?: ManagedEntityPublicSummary;
  case?: CasePublicSummary;
  process?: ReadOnlyProcessSummary;
  catalog?: PublicOfferingSummary[];
  permissions: {
    mode: 'shadow' | 'qa_primary';
    readOnly: true;
    canExecuteActions: false;
  };
}
