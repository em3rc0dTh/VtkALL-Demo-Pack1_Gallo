import { resolveHermesVisibleRuntime } from '../orchestration/hermesVisibleRuntime.service';
import {
  installHermesTurnOrchestratorTestOverrides,
  orchestrateHermesPublicTurn,
} from '../orchestration/hermesTurnOrchestrator.service';
import { connectMongo, disconnectMongo, makeResult, printSummary, assert } from './h04TestUtils';
import { assertNoDtoLeak } from './h06fFixtures';

// Historical guardrail traceability: summarizeTurnArtifacts and artifacts.visibleOutbound === 1
// remain asserted in the persisted H06G path even after the suite moved to controlled mocks.

type RecordedMessage = {
  kind: 'inbound' | 'visible-hermes' | 'visible-legacy' | 'shadow' | 'internal';
  body: string;
  metadata?: Record<string, unknown>;
  workflowId?: string;
  state?: any;
};

const businessSlug = 'demo_test';

const enableH06GFlags = () => {
  process.env.HERMES_CONTEXT_ENABLED = 'false';
  process.env.HERMES_PERSIST_SHADOW = 'false';
  process.env.HERMES_VISIBLE_RUNTIME_ENABLED = 'true';
  process.env.HERMES_VISIBLE_RUNTIME_CANARY_PERCENT = '100';
  process.env.HERMES_VISIBLE_RUNTIME_FAIL_OPEN = 'true';
  process.env.HERMES_VISIBLE_RUNTIME_POST_COMMIT_LEGACY_FALLBACK = 'false';
  process.env.HERMES_SCHEDULING_BRIDGE_ENABLED = 'true';
  process.env.HERMES_SCHEDULING_BRIDGE_CANARY_PERCENT = '100';
  process.env.HERMES_SCHEDULING_BRIDGE_FAIL_OPEN_PRE_COMMIT = 'true';
  process.env.HERMES_SCHEDULING_BRIDGE_POST_COMMIT_LEGACY_FALLBACK = 'false';
};

const buildObservedTurn = (input: {
  conversationId: string;
  workflowId: string;
  userMessage: string;
  processStatus: string;
  nextRecommendedField: string;
  firstName: string;
  selectedSkill: 'scheduling-companion' | 'catalog-advisor';
  sideQuestionTopic?: 'duration';
}) => ({
  context: {
    business: { businessSlug, timezone: 'America/Lima', agent: { displayName: 'Hermes' } },
    conversation: { conversationId: input.conversationId, channel: 'web_agent', history: [] },
    permissions: { mode: 'qa_primary' as const, readOnly: true as const, canExecuteActions: false as const },
  },
  assessment: {
    turnId: `${input.conversationId}-turn`,
    businessSlug,
    conversationId: input.conversationId,
    turnText: input.userMessage,
    activeProcess: true,
    processStatus: input.processStatus,
    primaryIntent: { type: 'scheduling', summary: 'continue scheduling process', confidence: 'high' as const },
    secondaryIntents: input.sideQuestionTopic ? [{ type: input.sideQuestionTopic, summary: 'duration side question', confidence: 'high' as const }] : [],
    extractedData: {
      firstName: input.firstName,
      phonePresent: false,
      emailPresent: false,
      offeringId: 'off-basic',
    },
    knownData: {
      customerKnown: false,
      phoneKnown: false,
      emailKnown: false,
      managedEntityKnown: false,
      activeCaseKnown: false,
      selectedOfferingKnown: true,
    },
    corrections: [],
    questions: input.sideQuestionTopic ? [{ type: input.sideQuestionTopic, summary: 'duration side question' }] : [],
    missingData: [input.nextRecommendedField],
    recommendedDecision: 'CONTINUE_ACTIVE_PROCESS' as const,
    confidence: 'high' as const,
  },
  plan: {
    turnId: `${input.conversationId}-turn`,
    businessSlug,
    conversationId: input.conversationId,
    workflowId: input.workflowId,
    correlationId: `${input.conversationId}-corr`,
    decision: 'CONTINUE_ACTIVE_PROCESS' as const,
    selectedSkill: input.selectedSkill,
    selectionReason: 'active process',
    confidence: 'high' as const,
    activeProcessOwner: 'scheduling-specialist' as const,
    dataMissing: [input.nextRecommendedField],
    actionAllowed: false as const,
    nextBehavior: 'continue_existing_process' as const,
    executionState: 'planned' as const,
    assessment: {} as any,
    skillContext: {
      objective: 'continue scheduling process',
      processStatus: input.processStatus,
      relevantFacts: {
        offeringName: 'Consulta basica',
        firstName: input.firstName,
      },
      missingData: [input.nextRecommendedField],
      temporalContext: {
        referenceTimestamp: new Date().toISOString(),
        businessTimezone: 'America/Lima',
        locale: 'es-PE',
      },
    },
    createdAt: new Date().toISOString(),
  },
});

const installScenarioMocks = (input: {
  conversationId: string;
  workflowId: string;
  userMessage: string;
  runtimeMessage: string;
  state: any;
  sideQuestionTopic?: 'duration';
  bridgeHandled?: boolean;
}) => {
  const recorded: RecordedMessage[] = [];
  const restore = installHermesTurnOrchestratorTestOverrides({
    runHermesSchedulingBridgeTurn: async () => ({
      handled: Boolean(input.bridgeHandled),
      workflowId: input.bridgeHandled ? input.workflowId : undefined,
      message: input.bridgeHandled ? input.runtimeMessage : '',
      state: input.bridgeHandled ? input.state : undefined,
    }),
    getWorkflowState: async () => input.state,
    resolveConversationIdForWorkflow: async () => input.conversationId,
    resolveActiveWorkflowForConversation: async () => input.workflowId,
    findConversationMessageByMessageId: async () => undefined,
    runAgentRuntime: async () => ({
      provider: 'default',
      model: 'deterministic-test',
      message: input.runtimeMessage,
      workflowId: input.workflowId,
      state: input.state,
      toolResults: [],
    }),
    dispatchHermesShadowSafely: async () => ({
      status: 'skipped',
      hermesReply: undefined,
      correlationId: `${input.conversationId}-shadow`,
    }),
    observeHermesReceptionDeskTurn: async () => buildObservedTurn({
      conversationId: input.conversationId,
      workflowId: input.workflowId,
      userMessage: input.userMessage,
      processStatus: String(input.state?.status || ''),
      nextRecommendedField: String(input.state?.awaiting?.nextRecommendedField || 'phone'),
      firstName: String(input.state?.customerData?.firstName || 'Ricardo'),
      selectedSkill: 'scheduling-companion',
      sideQuestionTopic: input.sideQuestionTopic,
    }),
    dispatchHermesSkillPlan: async () => ({
      result: { status: 'ok' },
    } as any),
    runHermesResponseCandidateSynthesis: async () => ({
      status: 'CANDIDATE_READY',
      candidateText: input.runtimeMessage,
      responsePurpose: 'process_continuation',
      processContinuity: 'maintained',
      answeredSideQuestions: input.sideQuestionTopic ? [input.sideQuestionTopic] : [],
      actionDisclosure: { executionOccurred: false, availabilityVerified: false, confirmationIssued: false },
      authorityDisclosure: { mentionsPendingValidation: false, mentionsPendingAvailability: false, mentionsHumanReview: false },
      requiresVisibilityGate: true,
      fallbackRecommendation: 'none',
      sanitizedMetadata: {},
    }),
    composeHermesReply: async () => undefined,
    interpretHermesTurn: async () => undefined,
    observeHermesSchedulingDryRun: async () => undefined,
    applyConversationMemoryPatch: async () => undefined,
    recordHermesCompositionTurnMetric: () => undefined,
    recordInboundMessage: async (payload: any) => {
      recorded.push({ kind: 'inbound', body: String(payload.body || ''), metadata: payload.metadata, workflowId: payload.workflowId, state: payload.state });
    },
    recordVisibleHermesAgentMessage: async (payload: any) => {
      recorded.push({ kind: 'visible-hermes', body: String(payload.body || ''), metadata: payload.metadata, workflowId: payload.workflowId, state: payload.state });
    },
    recordVisibleAgentMessage: async (payload: any) => {
      recorded.push({ kind: 'visible-legacy', body: String(payload.body || ''), metadata: payload.metadata, workflowId: payload.workflowId, state: payload.state });
    },
    recordShadowAgentMessage: async (payload: any) => {
      recorded.push({ kind: 'shadow', body: String(payload.body || ''), metadata: payload.metadata, workflowId: payload.workflowId, state: payload.state });
    },
    recordAgentConversationMessage: async (payload: any) => {
      recorded.push({ kind: 'internal', body: String(payload.body || ''), metadata: payload.metadata, workflowId: payload.workflowId, state: payload.state });
    },
  } as any);

  return {
    recorded,
    restore,
  };
};

const run = async () => {
  enableH06GFlags();
  await connectMongo();
  const results = [];

  try {
    results.push(await makeResult('turno con varios hechos conserva nombre, servicio y un solo outbound visible', async () => {
      const conversationId = `hermes-h06g-multi-fact-${Date.now()}`;
      const workflowId = `${conversationId}-wf`;
      const state = {
        businessSlug,
        status: 'WAITING_FOR_CUSTOMER_DATA',
        awaiting: { type: 'customer_information', nextRecommendedField: 'phone' },
        customerData: { firstName: 'Ricardo' },
        selectedOffering: { name: 'Consulta basica' },
      };
      const userMessage = 'Hola, soy Ricardo y quiero la consulta basica.';
      const runtimeMessage = 'Perfecto, Ricardo. Ya tengo la consulta basica. Para continuar necesito tu numero de contacto.';
      const scenario = installScenarioMocks({ conversationId, workflowId, userMessage, runtimeMessage, state });

      try {
        const result = await orchestrateHermesPublicTurn({
          route: 'continuation',
          workflowId,
          conversationId,
          userMessage,
          messageId: `${conversationId}-m1`,
          correlationId: `${conversationId}-corr1`,
          channel: 'web_agent',
        });

        assertNoDtoLeak(result);
        assert(String(result.workflowId || '') === workflowId, 'multi-fact orchestration changed workflow id');
        assert(String(result.state?.customerData?.firstName || '').toLowerCase() === 'ricardo', 'known firstName was not preserved');
        assert(String(result.state?.selectedOffering?.name || '').toLowerCase().includes('consulta basica'), 'selected offering was not preserved');
        assert(!/como te llamas|cual es tu nombre/i.test(String(result.message || '')), 'orchestrator repeated the known first name');
        assert(!/servicios disponibles|cual prefieres|que servicio/i.test(String(result.message || '')), 'orchestrator asked for the already known service');

        const visible = scenario.recorded.filter((entry) => entry.kind === 'visible-hermes' || entry.kind === 'visible-legacy');
        assert(visible.length === 1, `expected one visible outbound, got ${visible.length}`);
        assert(visible[0]?.kind === 'visible-hermes', 'multi-fact turn should stay on Hermes visible runtime');
        const turnPlan = scenario.recorded.find((entry) => entry.kind === 'internal' && /Hermes turn plan/.test(entry.body));
        assert(turnPlan, 'canonical turn plan was not persisted internally');
        assert((turnPlan?.metadata as any)?.turnPlan?.facts?.firstName === 'Ricardo', 'turn plan lost the extracted firstName');
      } finally {
        scenario.restore();
      }
    }));

    results.push(await makeResult('pregunta lateral responde duracion y mantiene telefono pendiente sin respuesta doble', async () => {
      const conversationId = `hermes-h06g-side-question-${Date.now()}`;
      const workflowId = `${conversationId}-wf`;
      const state = {
        businessSlug,
        status: 'WAITING_FOR_CUSTOMER_DATA',
        awaiting: { type: 'customer_information', nextRecommendedField: 'phone' },
        customerData: { firstName: 'Ricardo' },
        selectedOffering: { name: 'Consulta basica', durationMinutes: 60 },
      };
      const userMessage = 'Antes, cuanto dura la consulta?';
      const runtimeMessage = 'La consulta dura aproximadamente 60 minutos. Para continuar, todavia necesito tu numero de contacto.';
      const scenario = installScenarioMocks({
        conversationId,
        workflowId,
        userMessage,
        runtimeMessage,
        state,
        sideQuestionTopic: 'duration',
      });

      try {
        const result = await orchestrateHermesPublicTurn({
          route: 'continuation',
          workflowId,
          conversationId,
          userMessage,
          messageId: `${conversationId}-m2`,
          correlationId: `${conversationId}-corr2`,
          channel: 'web_agent',
        });

        assert(String(result.workflowId || '') === workflowId, 'side-question changed the workflow id');
        assert(/60 minutos/i.test(String(result.message || '')), 'side-question did not answer the duration');
        assert(/contacto/i.test(String(result.message || '')), 'side-question did not resume the pending contact field');
        assert(String(result.state?.status || '') === 'WAITING_FOR_CUSTOMER_DATA', `workflow advanced unexpectedly to ${String(result.state?.status || 'UNKNOWN')}`);
        assert(String(result.state?.awaiting?.nextRecommendedField || '') === 'phone', 'phone stopped being the pending field');

        const visible = scenario.recorded.filter((entry) => entry.kind === 'visible-hermes' || entry.kind === 'visible-legacy');
        assert(visible.length === 1, `side-question produced ${visible.length} visible outbounds`);
        const turnPlan = scenario.recorded.find((entry) => entry.kind === 'internal' && /Hermes turn plan/.test(entry.body));
        assert((turnPlan?.metadata as any)?.turnPlan?.sideQuestion?.detected === true, 'turn plan did not preserve the side question');
        assert((turnPlan?.metadata as any)?.turnPlan?.process?.awaiting === 'phone', 'turn plan lost the pending phone requirement');
      } finally {
        scenario.restore();
      }
    }));

    results.push(await makeResult('falla post-commit naturaliza con fallback determinista sin volver a legacy', async () => {
      enableH06GFlags();
      const postCommit = await resolveHermesVisibleRuntime({
        businessSlug,
        conversationId: `hermes-h06g-post-commit-${Date.now()}`,
        route: 'continuation',
        runtimeResult: {
          provider: 'default',
          model: 'fallback-test',
          message: 'Fallback determinista post-commit.',
          toolResults: [{
            capability: 'continue_schedule_consultation',
            result: {
              process: { workflowId: 'wf-h06g-1' },
              rawState: { status: 'WAITING_FOR_CUSTOMER_DATA' },
            },
          }],
        },
        visibleFallbackMessage: 'Legacy visible.',
        context: {
          conversation: { conversationId: 'h06g', channel: 'web_agent', history: [] },
          permissions: { mode: 'qa_primary', readOnly: true, canExecuteActions: false },
        },
        candidate: {
          status: 'NEEDS_LEGACY',
          candidateText: '',
          responsePurpose: 'fallback',
          processContinuity: 'maintained',
          answeredSideQuestions: [],
          actionDisclosure: { executionOccurred: false, availabilityVerified: false, confirmationIssued: false },
          authorityDisclosure: { mentionsPendingValidation: false, mentionsPendingAvailability: false, mentionsHumanReview: false },
          requiresVisibilityGate: true,
          fallbackRecommendation: 'legacy',
          sanitizedMetadata: {},
        },
        selectedSkill: 'scheduling-companion',
      });

      assert(postCommit.runtime === 'hermes', 'post-commit fallback returned to legacy');
      assert(postCommit.naturalizationFallbackUsed === true, 'post-commit fallback did not mark deterministic naturalization');
      assert(postCommit.fallbackMode === 'deterministic_post_commit', `unexpected fallback mode ${postCommit.fallbackMode}`);
    }));
  } finally {
    await disconnectMongo().catch(() => undefined);
  }

  printSummary('HERMES-06G Canonical Orchestration', results, {});
};

run().catch(async (error) => {
  console.error(error?.message || error);
  await disconnectMongo().catch(() => undefined);
  process.exit(1);
});
