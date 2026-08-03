import { HermesDecision, HermesSkillId } from './hermesTurnAssessment.contract';

export interface HermesSkillPermissions {
  readAuthority: boolean;
  proposeActions: boolean;
  executionAllowed: false;
}

export interface HermesSkillManifest {
  id: HermesSkillId;
  version: string;
  description: string;
  supportedIntents: string[];
  acceptedDecisions: HermesDecision[];
  requiredFields: string[];
  timeoutMs: number;
  fallbackStrategy: 'safe_cannot_handle' | 'safe_escalate' | 'safe_direct_owner';
  permissions: HermesSkillPermissions;
  aliases?: HermesSkillId[];
  ownerPriority: 'primary' | 'specialist' | 'recovery';
}

export interface HermesSkillInvocation {
  invocationId: string;
  dispatchPlanId: string;
  turnId: string;
  businessSlug: string;
  conversationId: string;
  workflowId?: string;
  skillId: HermesSkillId;
  skillVersion: string;
  objective: string;
  projectedContext: Record<string, unknown>;
  permissions: HermesSkillPermissions;
  correlationId: string;
  deadlineAt: string;
  createdAt: string;
}

export type HermesSkillResultStatus =
  | 'ANSWER_READY'
  | 'NEEDS_INPUT'
  | 'ACTION_PROPOSAL'
  | 'CANNOT_HANDLE'
  | 'ESCALATE'
  | 'FAILED'
  | 'TIMED_OUT';

export interface HermesSkillResult {
  invocationId: string;
  skillId: HermesSkillId;
  skillVersion: string;
  status: HermesSkillResultStatus;
  ownerRetainedByHermes: true;
  actionExecutionAllowed: false;
  summary: string;
  missingData?: string[];
  proposedAction?: string;
  details?: Record<string, unknown>;
  fallbackUsed: boolean;
  durationMs: number;
  producedAt: string;
  error?: {
    code: string;
    retryable: boolean;
    message: string;
  };
}
