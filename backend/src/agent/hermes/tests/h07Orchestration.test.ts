import { resolveHermesVisibleRuntime } from '../orchestration/hermesVisibleRuntime.service';
import { HermesSubAgentInput } from '../contracts/hermesSubAgent.contract';
import { buildHermesTriageResult } from '../orchestration/hermesTriage.service';
import { getHermesAgentRegistry, resolveHermesAgentManifest } from '../orchestration/hermesAgentRegistry';
import { runCatalogAgent } from '../subagents/catalogAgent';
import { runConversationAgent } from '../subagents/conversationAgent';
import { runRecoveryAgent } from '../subagents/recoveryAgent';
import { runSchedulingAgent } from '../subagents/schedulingAgent';
import { makeResult, printSummary, assert } from './h04TestUtils';

const businessSlug = 'demo_test';

const enableH07Flags = () => {
  process.env.HERMES_VISIBLE_RUNTIME_ENABLED = 'true';
  process.env.HERMES_VISIBLE_RUNTIME_CANARY_PERCENT = '100';
  process.env.HERMES_VISIBLE_RUNTIME_FAIL_OPEN = 'true';
  process.env.HERMES_VISIBLE_RUNTIME_POST_COMMIT_LEGACY_FALLBACK = 'false';
};

const triageFixture = (input: {
  conversationId: string;
  primaryIntent: string;
  decision: 'RESPOND_DIRECTLY' | 'ASK_FOR_INFORMATION' | 'DELEGATE_INFORMATIONAL' | 'PROPOSE_ACTION' | 'CONTINUE_ACTIVE_PROCESS' | 'ESCALATE';
  selectedSkill: 'customer-conversation' | 'catalog-advisor' | 'scheduling-specialist' | 'recovery-escalation';
  activeProcess: boolean;
  processStatus?: string;
  firstName?: string;
  offeringId?: string;
  sideQuestionType?: 'duration';
  missingData?: string[];
  runtimeState?: any;
  toolResults?: Array<{ capability: string; result: unknown }>;
}) => buildHermesTriageResult({
  assessment: {
    turnId: `${input.conversationId}-turn`,
    businessSlug,
    conversationId: input.conversationId,
    turnText: input.primaryIntent,
    activeProcess: input.activeProcess,
    processStatus: input.processStatus,
    primaryIntent: { type: input.primaryIntent, summary: input.primaryIntent, confidence: 'high' },
    secondaryIntents: input.sideQuestionType ? [{ type: input.sideQuestionType, summary: 'duration side question', confidence: 'high' }] : [],
    extractedData: {
      firstName: input.firstName,
      phonePresent: false,
      emailPresent: false,
      offeringId: input.offeringId,
    },
    knownData: {
      customerKnown: false,
      phoneKnown: false,
      emailKnown: false,
      managedEntityKnown: false,
      activeCaseKnown: false,
      selectedOfferingKnown: Boolean(input.offeringId),
    },
    corrections: [],
    questions: input.sideQuestionType ? [{ type: input.sideQuestionType, summary: 'duration side question' }] : [],
    missingData: input.missingData || [],
    recommendedDecision: input.decision,
    confidence: 'high',
  },
  plan: {
    turnId: `${input.conversationId}-turn`,
    businessSlug,
    conversationId: input.conversationId,
    workflowId: input.activeProcess ? `${input.conversationId}-wf` : undefined,
    correlationId: `${input.conversationId}-corr`,
    decision: input.decision,
    selectedSkill: input.selectedSkill,
    selectionReason: input.primaryIntent,
    confidence: 'high',
    activeProcessOwner: input.activeProcess ? 'scheduling-specialist' : undefined,
    dataMissing: input.missingData || [],
    actionAllowed: false,
    nextBehavior: input.activeProcess ? 'continue_existing_process' : 'respond_now',
    executionState: 'planned',
    assessment: {} as any,
    skillContext: {
      objective: input.primaryIntent,
      processStatus: input.processStatus,
      relevantFacts: {
        offeringId: input.offeringId,
        firstName: input.firstName,
      },
      missingData: input.missingData || [],
      temporalContext: {
        referenceTimestamp: new Date().toISOString(),
        businessTimezone: 'America/Lima',
        locale: 'es-PE',
      },
    },
    createdAt: new Date().toISOString(),
  },
  runtimeResult: {
    provider: 'default',
    message: 'visible message',
    state: input.runtimeState,
    toolResults: input.toolResults || [],
  },
});

const subAgentInput = (triage: ReturnType<typeof buildHermesTriageResult>): HermesSubAgentInput => ({
  triage,
  latestMessage: triage.intent,
  history: [{ role: 'user', content: triage.intent }],
  knownFacts: triage.facts,
  processContext: triage.process,
  businessContext: { businessSlug, timezone: 'America/Lima' },
  catalogContext: [{ id: 'off-basic', name: 'Consulta basica', durationMinutes: 60 }],
  customerContext: { knownFacts: { phoneKnown: false } },
  permissions: {
    readOnly: true,
    canProposeActions: true,
    canExecuteActions: false,
  },
});

const run = async () => {
  enableH07Flags();
  const results = [];

  results.push(await makeResult('multi-fact conserva hechos y enruta a scheduling-agent', async () => {
    const triage = triageFixture({
      conversationId: `hermes-h07-multi-fact-${Date.now()}`,
      primaryIntent: 'schedule_consultation',
      decision: 'CONTINUE_ACTIVE_PROCESS',
      selectedSkill: 'scheduling-specialist',
      activeProcess: true,
      processStatus: 'WAITING_FOR_CUSTOMER_DATA',
      firstName: 'Ricardo',
      offeringId: 'off-basic',
      missingData: ['phone'],
      runtimeState: { status: 'WAITING_FOR_CUSTOMER_DATA', awaiting: { nextRecommendedField: 'phone' } },
      toolResults: [{ capability: 'continue_schedule_consultation', result: { ok: true } }],
    });
    assert(triage.selectedAgent === 'scheduling-agent', 'triage did not select scheduling-agent');
    assert(triage.mode === 'respond_and_act', 'triage did not preserve respond_and_act');
    assert(triage.facts.firstName === 'Ricardo', 'triage lost firstName');
    assert(triage.facts.offeringId === 'off-basic', 'triage lost offering reference');
  }));

  results.push(await makeResult('catalog routing reutiliza catalog-agent y catalog-advisor', async () => {
    const triage = triageFixture({
      conversationId: `hermes-h07-catalog-${Date.now()}`,
      primaryIntent: 'catalog_detail',
      decision: 'DELEGATE_INFORMATIONAL',
      selectedSkill: 'catalog-advisor',
      activeProcess: false,
      offeringId: 'off-basic',
    });
    const manifest = resolveHermesAgentManifest(triage.selectedAgent);
    assert(manifest?.skill === 'catalog-advisor', 'catalog-agent did not map to catalog-advisor');
    const result = await runCatalogAgent(subAgentInput(triage));
    assert(result.agent === 'catalog-agent', 'catalog-agent runner returned wrong agent id');
    assert(result.outcome === 'respond', 'catalog-agent should respond directly');
    assert(!result.requiresAuthoritativeExecution, 'catalog-agent must stay read-only');
  }));

  results.push(await makeResult('scheduling-agent propone acciones sin ejecutar directamente', async () => {
    const triage = triageFixture({
      conversationId: `hermes-h07-scheduling-${Date.now()}`,
      primaryIntent: 'start_booking',
      decision: 'PROPOSE_ACTION',
      selectedSkill: 'scheduling-specialist',
      activeProcess: true,
      processStatus: 'WAITING_FOR_CUSTOMER_DATA',
      missingData: ['phone'],
    });
    const result = await runSchedulingAgent({
      ...subAgentInput(triage),
      specialistResult: {
        invocationId: 'inv-1',
        skillId: 'scheduling-specialist',
        skillVersion: '1.0.0',
        status: 'ACTION_PROPOSAL',
        ownerRetainedByHermes: true,
        actionExecutionAllowed: false,
        summary: 'Scheduling proposal',
        proposedAction: 'continue_schedule_consultation',
        missingData: ['phone'],
        fallbackUsed: false,
        durationMs: 1,
        producedAt: new Date().toISOString(),
      },
    });
    assert(result.agent === 'scheduling-agent', 'scheduling-agent runner returned wrong agent id');
    assert(result.outcome === 'action_proposed', 'scheduling-agent did not keep proposal outcome');
    assert(result.requiresAuthoritativeExecution === true, 'scheduling-agent must require authoritative execution');
  }));

  results.push(await makeResult('side question mantiene soporte de catalog-agent y no rompe el proceso', async () => {
    const triage = triageFixture({
      conversationId: `hermes-h07-side-${Date.now()}`,
      primaryIntent: 'side_question',
      decision: 'CONTINUE_ACTIVE_PROCESS',
      selectedSkill: 'scheduling-specialist',
      activeProcess: true,
      processStatus: 'WAITING_FOR_CUSTOMER_DATA',
      sideQuestionType: 'duration',
      missingData: ['phone'],
      runtimeState: { status: 'WAITING_FOR_CUSTOMER_DATA', awaiting: { nextRecommendedField: 'phone' } },
    });
    assert(triage.sideQuestion?.detected === true, 'triage did not detect side question');
    assert(triage.sideQuestion?.topic === 'offering_duration', `unexpected side question topic ${triage.sideQuestion?.topic}`);
    assert(Array.isArray(triage.supportingAgents) && triage.supportingAgents.includes('catalog-agent'), 'triage did not add catalog-agent as supporting agent');
    const result = await runSchedulingAgent({
      ...subAgentInput(triage),
      specialistResult: {
        invocationId: 'inv-2',
        skillId: 'scheduling-specialist',
        skillVersion: '1.0.0',
        status: 'NEEDS_INPUT',
        ownerRetainedByHermes: true,
        actionExecutionAllowed: false,
        summary: 'Duration answered; phone still pending.',
        missingData: ['phone'],
        fallbackUsed: false,
        durationMs: 1,
        producedAt: new Date().toISOString(),
      },
    });
    assert(result.pendingFacts.includes('phone'), 'side question lost the pending phone fact');
    assert(result.outcome === 'clarification_required', 'side question should stay in clarification flow');
  }));

  results.push(await makeResult('recovery-agent absorbe unknown agent recovery y una sola salida visible', async () => {
    const registry = getHermesAgentRegistry();
    assert(registry.length === 4, `expected four subagents, got ${registry.length}`);
    const unknown = resolveHermesAgentManifest('recovery-agent');
    assert(unknown?.skill === 'recovery-escalation', 'recovery-agent must reuse recovery-escalation');
    const recovery = await runRecoveryAgent(subAgentInput({
      intent: 'fallback',
      mode: 'recover',
      facts: {},
      catalogMatch: { status: 'none', confidence: 'low' },
      selectedAgent: 'recovery-agent',
      requiredContext: ['businessContext', 'processContext'],
      workflowAdvanceAllowed: false,
      proposals: [],
      responseGoal: {
        answerCurrentMessageFirst: true,
        discloseAuthoritativeResult: false,
        resumePendingProcess: true,
        pendingField: 'phone',
      },
      confidence: 'low',
      reasonCode: 'UNKNOWN_AGENT',
      process: { active: true, status: 'WAITING_FOR_CUSTOMER_DATA', awaiting: 'phone' },
    }));
    assert(recovery.outcome === 'recovered', 'recovery-agent did not return recovered outcome');

    const visibleDecision = await resolveHermesVisibleRuntime({
      businessSlug,
      conversationId: `hermes-h07-visible-${Date.now()}`,
      route: 'continuation',
      runtimeResult: { provider: 'default', message: 'Necesito revisar ese caso de forma segura.' },
      visibleFallbackMessage: 'Necesito revisar ese caso de forma segura.',
      context: {
        conversation: { conversationId: 'x', channel: 'web_agent', history: [] },
        permissions: { mode: 'qa_primary', readOnly: true, canExecuteActions: false },
      },
      candidate: {
        status: 'CANDIDATE_READY',
        candidateText: 'Necesito revisar ese caso de forma segura.',
        responsePurpose: 'direct_response',
        processContinuity: 'maintained',
        answeredSideQuestions: [],
        actionDisclosure: { executionOccurred: false, availabilityVerified: false, confirmationIssued: false },
        authorityDisclosure: { mentionsPendingValidation: false, mentionsPendingAvailability: false, mentionsHumanReview: true },
        requiresVisibilityGate: true,
        fallbackRecommendation: 'none',
        sanitizedMetadata: {},
      },
      selectedSkill: 'recovery-escalation',
    });
    assert(visibleDecision.runtime === 'hermes', 'recovery visible path should remain Hermes-owned');
    assert(String(visibleDecision.message || '').trim().length > 0, 'visible decision did not produce a single public message');
  }));

  printSummary('HERMES-07 Triage And Subagents', results, {});
};

run().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
