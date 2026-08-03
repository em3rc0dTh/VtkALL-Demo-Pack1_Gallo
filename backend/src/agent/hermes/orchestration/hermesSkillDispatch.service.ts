import { recordAgentConversationMessage } from '../../../services/agentConversation.service';
import { HermesDispatchPlan } from '../contracts/hermesDispatchPlan.contract';
import {
  HermesSkillInvocation,
  HermesSkillManifest,
  HermesSkillResult,
  HermesSkillResultStatus,
} from '../contracts/hermesSkillRegistry.contract';
import { HermesSkillId } from '../contracts/hermesTurnAssessment.contract';
import { runHermesSchedulingSpecialist } from '../scheduling/hermesSchedulingSpecialist.service';

type HermesDispatchDeps = {
  now?: () => number;
  registry?: HermesSkillManifest[];
  executeSkill?: (input: {
    manifest: HermesSkillManifest;
    invocation: HermesSkillInvocation;
    plan: HermesDispatchPlan;
  }) => Promise<Omit<HermesSkillResult, 'durationMs' | 'producedAt' | 'invocationId' | 'skillId' | 'skillVersion'>>;
};

const DEFAULT_SKILL_REGISTRY: HermesSkillManifest[] = [
  {
    id: 'customer-conversation',
    version: '1.0.0',
    description: 'Handles direct conversational continuity under Hermes ownership.',
    supportedIntents: ['conversation', 'greeting', 'agent_identity', 'general_faq', 'business_information'],
    acceptedDecisions: ['RESPOND_DIRECTLY', 'ASK_FOR_INFORMATION'],
    requiredFields: [],
    timeoutMs: 500,
    fallbackStrategy: 'safe_direct_owner',
    permissions: {
      readAuthority: true,
      proposeActions: false,
      executionAllowed: false,
    },
    ownerPriority: 'primary',
  },
  {
    id: 'catalog-advisor',
    version: '1.0.0',
    description: 'Answers catalog and business information questions with read-only context.',
    supportedIntents: ['catalog_list', 'catalog_detail', 'catalog_compare', 'price', 'duration', 'compatibility'],
    acceptedDecisions: ['DELEGATE_INFORMATIONAL', 'ASK_FOR_INFORMATION'],
    requiredFields: [],
    timeoutMs: 700,
    fallbackStrategy: 'safe_cannot_handle',
    permissions: {
      readAuthority: true,
      proposeActions: false,
      executionAllowed: false,
    },
    ownerPriority: 'specialist',
  },
  {
    id: 'scheduling-specialist',
    version: '1.1.0',
    description: 'Evaluates scheduling turns and prepares non-executing action proposals.',
    supportedIntents: ['start_booking', 'request_availability', 'provide_customer_data', 'select_offering', 'select_slot', 'side_question', 'ambiguous'],
    acceptedDecisions: ['PROPOSE_ACTION', 'CONTINUE_ACTIVE_PROCESS', 'ASK_FOR_INFORMATION'],
    requiredFields: [],
    timeoutMs: 900,
    fallbackStrategy: 'safe_cannot_handle',
    permissions: {
      readAuthority: true,
      proposeActions: true,
      executionAllowed: false,
    },
    aliases: ['scheduling-companion'],
    ownerPriority: 'specialist',
  },
  {
    id: 'recovery-escalation',
    version: '1.0.0',
    description: 'Contains unsafe turns, contradictions, and escalation paths.',
    supportedIntents: ['security_risk', 'conversation', 'fallback'],
    acceptedDecisions: ['DECLINE_UNSAFE_REQUEST', 'ESCALATE'],
    requiredFields: [],
    timeoutMs: 500,
    fallbackStrategy: 'safe_escalate',
    permissions: {
      readAuthority: true,
      proposeActions: false,
      executionAllowed: false,
    },
    ownerPriority: 'recovery',
  },
];

const resolveManifest = (skillId: HermesSkillId, registry: HermesSkillManifest[]) =>
  registry.find((item) => item.id === skillId || item.aliases?.includes(skillId));

const projectedCatalog = (plan: HermesDispatchPlan) => {
  const offeringId = plan.assessment.extractedData.offeringId || plan.skillContext.relevantFacts.offeringId;
  return {
    offeringId,
    questionTypes: plan.assessment.questions.map((question) => question.type),
    selectedOfferingKnown: plan.assessment.knownData.selectedOfferingKnown,
    activeCaseKnown: plan.assessment.knownData.activeCaseKnown,
  };
};

const projectedScheduling = (plan: HermesDispatchPlan) => ({
  processStatus: plan.assessment.processStatus,
  activeProcess: plan.assessment.activeProcess,
  offeringId: plan.assessment.extractedData.offeringId || plan.skillContext.relevantFacts.offeringId,
  requestedDate: plan.assessment.extractedData.requestedDate,
  requestedTime: plan.assessment.extractedData.requestedTime,
  requestedDayPart: plan.assessment.extractedData.requestedDayPart,
  notBeforeTime: plan.assessment.extractedData.notBeforeTime,
  slotId: plan.assessment.extractedData.slotId,
  managedEntityHint: plan.assessment.extractedData.managedEntityHint,
  managedEntityYear: plan.assessment.extractedData.managedEntityYear,
  customerKnown: plan.assessment.knownData.customerKnown,
  phoneKnown: plan.assessment.knownData.phoneKnown,
  emailKnown: plan.assessment.knownData.emailKnown,
  missingData: plan.dataMissing,
  correlationId: plan.correlationId,
});

const projectedContextFor = (manifest: HermesSkillManifest, plan: HermesDispatchPlan) => {
  if (manifest.id === 'catalog-advisor') {
    return {
      objective: plan.skillContext.objective,
      processStatus: plan.assessment.processStatus,
      catalog: projectedCatalog(plan),
    };
  }
  if (manifest.id === 'scheduling-specialist') {
    return {
      objective: plan.skillContext.objective,
      scheduling: projectedScheduling(plan),
    };
  }
  if (manifest.id === 'recovery-escalation') {
    return {
      objective: plan.skillContext.objective,
      decision: plan.decision,
      processStatus: plan.assessment.processStatus,
      missingData: plan.dataMissing,
    };
  }
  return {
    objective: plan.skillContext.objective,
    processStatus: plan.assessment.processStatus,
    missingData: plan.dataMissing,
    primaryIntent: plan.assessment.primaryIntent.type,
  };
};

const defaultSkillExecutor: NonNullable<HermesDispatchDeps['executeSkill']> = async ({ manifest, invocation, plan }) => {
  if (manifest.id === 'customer-conversation') {
    return {
      status: plan.decision === 'ASK_FOR_INFORMATION' ? 'NEEDS_INPUT' : 'ANSWER_READY',
      summary: plan.decision === 'ASK_FOR_INFORMATION'
        ? 'Direct conversation remains with Hermes while more information is requested.'
        : 'Direct conversational continuity remains with Hermes without specialist escalation.',
      missingData: plan.dataMissing,
      fallbackUsed: false,
      ownerRetainedByHermes: true,
      actionExecutionAllowed: false,
    };
  }

  if (manifest.id === 'catalog-advisor') {
    const questionTypes = Array.isArray((invocation.projectedContext.catalog as any)?.questionTypes)
      ? (invocation.projectedContext.catalog as any).questionTypes
      : [];
    return {
      status: questionTypes.length ? 'ANSWER_READY' : 'NEEDS_INPUT',
      summary: questionTypes.length
        ? `Catalog advisor can answer ${questionTypes.join(', ')} from projected read-only context.`
        : 'Catalog advisor needs a more specific informational question.',
      missingData: questionTypes.length ? [] : ['informational_question'],
      fallbackUsed: false,
      ownerRetainedByHermes: true,
      actionExecutionAllowed: false,
    };
  }

  if (manifest.id === 'scheduling-specialist') {
    return runHermesSchedulingSpecialist({ plan, invocation });
  }

  return {
    status: plan.decision === 'DECLINE_UNSAFE_REQUEST' ? 'ESCALATE' : 'CANNOT_HANDLE',
    summary: plan.decision === 'DECLINE_UNSAFE_REQUEST'
      ? 'Recovery escalation contains the unsafe turn and keeps Hermes in control.'
      : 'Recovery escalation cannot safely handle the requested specialist dispatch.',
    missingData: plan.dataMissing,
    fallbackUsed: false,
    ownerRetainedByHermes: true,
    actionExecutionAllowed: false,
  };
};

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const handle = setTimeout(() => reject(new Error('SKILL_TIMEOUT')), timeoutMs);
    promise.then((value) => {
      clearTimeout(handle);
      resolve(value);
    }).catch((error) => {
      clearTimeout(handle);
      reject(error);
    });
  });

const sanitizedInvocationMetadata = (manifest: HermesSkillManifest, invocation: HermesSkillInvocation) => ({
  runtimeMode: 'skill_dispatch_registry',
  dispatchPlanId: invocation.dispatchPlanId,
  skillId: manifest.id,
  skillVersion: manifest.version,
  acceptedDecisionCount: manifest.acceptedDecisions.length,
  ownerPriority: manifest.ownerPriority,
  timeoutMs: manifest.timeoutMs,
  projectedContext: invocation.projectedContext,
  executionAllowed: false,
});

const sanitizedResultMetadata = (result: HermesSkillResult) => ({
  runtimeMode: 'skill_dispatch_registry',
  invocationId: result.invocationId,
  skillId: result.skillId,
  skillVersion: result.skillVersion,
  status: result.status,
  fallbackUsed: result.fallbackUsed,
  missingData: result.missingData || [],
  proposedAction: result.proposedAction,
  specialistState: result.details?.specialistState,
  prioritizedMissingField: result.details?.prioritizedMissingField,
  possibleDuplicate: result.details?.possibleDuplicate,
  durationMs: result.durationMs,
  ownerRetainedByHermes: true,
  executionAllowed: false,
  errorCode: result.error?.code,
  retryable: result.error?.retryable,
});

const fallbackStatusFor = (manifest: HermesSkillManifest): HermesSkillResultStatus => {
  if (manifest.fallbackStrategy === 'safe_escalate') return 'ESCALATE';
  if (manifest.fallbackStrategy === 'safe_direct_owner') return 'ANSWER_READY';
  return 'CANNOT_HANDLE';
};

const dispatchResultFromError = (input: {
  manifest: HermesSkillManifest;
  invocation: HermesSkillInvocation;
  durationMs: number;
  error: unknown;
}): HermesSkillResult => {
  const message = String((input.error as any)?.message || 'Skill dispatch failed.');
  const timedOut = message === 'SKILL_TIMEOUT';
  return {
    invocationId: input.invocation.invocationId,
    skillId: input.manifest.id,
    skillVersion: input.manifest.version,
    status: timedOut ? 'TIMED_OUT' : 'FAILED',
    ownerRetainedByHermes: true,
    actionExecutionAllowed: false,
    summary: timedOut
      ? 'The specialist did not answer before the internal deadline.'
      : 'The specialist failed during controlled dispatch and Hermes kept control.',
    missingData: [],
    fallbackUsed: true,
    durationMs: input.durationMs,
    producedAt: new Date().toISOString(),
    error: {
      code: timedOut ? 'SKILL_TIMEOUT' : 'SKILL_FAILED',
      retryable: timedOut,
      message,
    },
  };
};

export const getHermesSkillRegistry = (deps: HermesDispatchDeps = {}) => deps.registry || DEFAULT_SKILL_REGISTRY;

export const buildHermesSkillInvocation = (input: {
  plan: HermesDispatchPlan;
  manifest: HermesSkillManifest;
  nowMs?: number;
}): HermesSkillInvocation => {
  const createdAtMs = input.nowMs || Date.now();
  return {
    invocationId: `${input.plan.turnId}:skill-invocation`,
    dispatchPlanId: `${input.plan.turnId}:dispatch-plan`,
    turnId: input.plan.turnId,
    businessSlug: input.plan.businessSlug,
    conversationId: input.plan.conversationId,
    workflowId: input.plan.workflowId,
    skillId: input.manifest.id,
    skillVersion: input.manifest.version,
    objective: input.plan.skillContext.objective,
    projectedContext: projectedContextFor(input.manifest, input.plan),
    permissions: input.manifest.permissions,
    correlationId: input.plan.correlationId,
    deadlineAt: new Date(createdAtMs + input.manifest.timeoutMs).toISOString(),
    createdAt: new Date(createdAtMs).toISOString(),
  };
};

export const persistHermesSkillInvocation = async (input: {
  plan: HermesDispatchPlan;
  manifest: HermesSkillManifest;
  invocation: HermesSkillInvocation;
}) => recordAgentConversationMessage({
  workflowId: input.plan.workflowId || input.plan.conversationId,
  businessSlug: input.plan.businessSlug,
  conversationId: input.plan.conversationId,
  role: 'system',
  visibility: 'internal',
  interactionType: 'system_event',
  body: `Hermes skill invocation ${input.manifest.id}@${input.manifest.version}`,
  messageId: input.invocation.invocationId,
  correlationId: input.plan.correlationId,
  causationId: input.plan.turnId,
  metadata: sanitizedInvocationMetadata(input.manifest, input.invocation),
});

export const persistHermesSkillResult = async (input: {
  plan: HermesDispatchPlan;
  result: HermesSkillResult;
}) => recordAgentConversationMessage({
  workflowId: input.plan.workflowId || input.plan.conversationId,
  businessSlug: input.plan.businessSlug,
  conversationId: input.plan.conversationId,
  role: 'system',
  visibility: 'internal',
  interactionType: 'system_event',
  body: `Hermes skill result ${input.result.skillId} -> ${input.result.status}`,
  messageId: `${input.result.invocationId}:result`,
  correlationId: input.plan.correlationId,
  causationId: input.plan.turnId,
  metadata: sanitizedResultMetadata(input.result),
});

export const dispatchHermesSkillPlan = async (
  plan: HermesDispatchPlan,
  deps: HermesDispatchDeps = {}
) => {
  const registry = getHermesSkillRegistry(deps);
  const now = deps.now || (() => Date.now());
  const executeSkill = deps.executeSkill || defaultSkillExecutor;
  const manifest = resolveManifest(plan.selectedSkill, registry);

  if (!manifest) {
    const result: HermesSkillResult = {
      invocationId: `${plan.turnId}:skill-invocation`,
      skillId: plan.selectedSkill,
      skillVersion: 'unknown',
      status: 'CANNOT_HANDLE',
      ownerRetainedByHermes: true,
      actionExecutionAllowed: false,
      summary: 'The requested skill is not registered, so Hermes keeps the turn in safe fallback.',
      missingData: plan.dataMissing,
      fallbackUsed: true,
      durationMs: 0,
      producedAt: new Date(now()).toISOString(),
      error: {
        code: 'SKILL_NOT_REGISTERED',
        retryable: false,
        message: `Skill ${plan.selectedSkill} is not present in the registry.`,
      },
    };
    return {
      manifest: undefined,
      invocation: undefined,
      result,
    };
  }

  if (!manifest.acceptedDecisions.includes(plan.decision)) {
    const invocation = buildHermesSkillInvocation({ plan, manifest, nowMs: now() });
    await persistHermesSkillInvocation({ plan, manifest, invocation });
    const result: HermesSkillResult = {
      invocationId: invocation.invocationId,
      skillId: manifest.id,
      skillVersion: manifest.version,
      status: fallbackStatusFor(manifest),
      ownerRetainedByHermes: true,
      actionExecutionAllowed: false,
      summary: 'The selected skill does not accept this decision and Hermes retained control safely.',
      missingData: plan.dataMissing,
      fallbackUsed: true,
      durationMs: 0,
      producedAt: new Date(now()).toISOString(),
      error: {
        code: 'DECISION_NOT_ACCEPTED',
        retryable: false,
        message: `Skill ${manifest.id} cannot consume decision ${plan.decision}.`,
      },
    };
    await persistHermesSkillResult({ plan, result });
    return { manifest, invocation, result };
  }

  const startedAt = now();
  const invocation = buildHermesSkillInvocation({ plan, manifest, nowMs: startedAt });
  await persistHermesSkillInvocation({ plan, manifest, invocation });

  let result: HermesSkillResult;
  try {
    const raw = await withTimeout(executeSkill({ manifest, invocation, plan }), manifest.timeoutMs);
    result = {
      invocationId: invocation.invocationId,
      skillId: manifest.id,
      skillVersion: manifest.version,
      durationMs: Math.max(0, now() - startedAt),
      producedAt: new Date(now()).toISOString(),
      ...raw,
    };
  } catch (error) {
    result = dispatchResultFromError({
      manifest,
      invocation,
      durationMs: Math.max(0, now() - startedAt),
      error,
    });
  }

  await persistHermesSkillResult({ plan, result });
  return { manifest, invocation, result };
};
