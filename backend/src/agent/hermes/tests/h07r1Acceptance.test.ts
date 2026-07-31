import { assert, makeResult, printSummary } from './h04TestUtils';

type RecordedMessage = {
  kind: 'inbound' | 'visible-hermes' | 'visible-legacy' | 'internal';
  body: string;
  messageId?: string;
  metadata?: Record<string, unknown>;
  state?: any;
  workflowId?: string;
};

type ScenarioConfig = {
  businessSlug: string;
  conversationId: string;
  route: 'initial' | 'continuation';
  workflowId?: string;
  initialState?: any;
  userMessage: string;
  messageId: string;
  correlationId: string;
  observed: any;
  skillResult: any;
  finalContext?: any;
  searchCatalogResult?: any[];
  offeringDetailsResult?: any;
  startProcessResult?: any;
  continueProcessResults?: any[];
};

const enableFlags = () => {
  process.env.HERMES_VISIBLE_RUNTIME_ENABLED = 'true';
  process.env.HERMES_VISIBLE_RUNTIME_CANARY_PERCENT = '100';
  process.env.HERMES_VISIBLE_RUNTIME_FAIL_OPEN = 'true';
  process.env.HERMES_VISIBLE_RUNTIME_POST_COMMIT_LEGACY_FALLBACK = 'false';
};

const baseCatalog = [
  {
    id: 'off-basic',
    name: 'Consulta basica',
    description: 'Revision inicial y orientacion.',
    durationMinutes: 60,
    pricing: { type: 'not_published' as const },
    publicVisible: true,
    active: true,
  },
];

const buildObservedTurn = (input: {
  businessSlug: string;
  conversationId: string;
  workflowId?: string;
  userMessage: string;
  selectedSkill: 'customer-conversation' | 'catalog-advisor' | 'scheduling-specialist';
  decision: 'RESPOND_DIRECTLY' | 'ASK_FOR_INFORMATION' | 'DELEGATE_INFORMATIONAL' | 'PROPOSE_ACTION' | 'CONTINUE_ACTIVE_PROCESS';
  primaryIntent: string;
  activeProcess: boolean;
  processStatus?: string;
  awaitingType?: string;
  nextRecommendedField?: string;
  firstName?: string;
  offeringId?: string;
  phonePresent?: boolean;
  sideQuestionType?: 'duration';
  catalog?: typeof baseCatalog;
}) => ({
  context: {
    business: {
      businessSlug: input.businessSlug,
      businessName: 'Demo Test',
      timezone: 'America/Lima',
      agent: { name: 'Iris', role: 'asistente de reservas' },
    },
    conversation: { conversationId: input.conversationId, channel: 'web_agent', history: [] },
    process: input.activeProcess ? {
      active: true,
      processType: 'schedule_consultation',
      status: input.processStatus,
      awaiting: {
        type: input.awaitingType,
        nextRecommendedField: input.nextRecommendedField,
      },
      knownFacts: input.offeringId ? { offering: { id: input.offeringId } } : {},
      allowedActions: [],
      informationalOnly: true as const,
    } : undefined,
    catalog: input.catalog || baseCatalog,
    permissions: { mode: 'qa_primary' as const, readOnly: true as const, canExecuteActions: false as const },
  },
  history: [],
  assessment: {
    turnId: `${input.conversationId}-turn`,
    businessSlug: input.businessSlug,
    conversationId: input.conversationId,
    turnText: input.userMessage,
    activeProcess: input.activeProcess,
    processStatus: input.processStatus,
    awaiting: {
      type: input.awaitingType,
      nextRecommendedField: input.nextRecommendedField,
    },
    primaryIntent: { type: input.primaryIntent, summary: input.primaryIntent, confidence: 'high' as const },
    secondaryIntents: input.sideQuestionType ? [{ type: input.sideQuestionType, summary: 'duration side question', confidence: 'high' as const }] : [],
    extractedData: {
      firstName: input.firstName,
      phonePresent: Boolean(input.phonePresent),
      emailPresent: false,
      offeringId: input.offeringId,
    },
    knownData: {
      customerKnown: false,
      phoneKnown: false,
      emailKnown: false,
      managedEntityKnown: false,
      activeCaseKnown: false,
      selectedOfferingKnown: Boolean(input.offeringId && input.activeProcess),
    },
    corrections: [],
    questions: input.sideQuestionType ? [{ type: input.sideQuestionType, summary: 'duration side question' }] : [],
    missingData: input.nextRecommendedField ? [input.nextRecommendedField] : [],
    recommendedDecision: input.decision,
    confidence: 'high' as const,
  },
  plan: {
    turnId: `${input.conversationId}-turn`,
    businessSlug: input.businessSlug,
    conversationId: input.conversationId,
    workflowId: input.workflowId,
    correlationId: `${input.conversationId}-corr`,
    decision: input.decision,
    selectedSkill: input.selectedSkill,
    selectionReason: input.primaryIntent,
    confidence: 'high' as const,
    activeProcessOwner: input.activeProcess ? 'scheduling-specialist' as const : undefined,
    dataMissing: input.nextRecommendedField ? [input.nextRecommendedField] : [],
    actionAllowed: false as const,
    nextBehavior: input.activeProcess ? 'continue_existing_process' as const : 'respond_now' as const,
    executionState: 'planned' as const,
    assessment: {} as any,
    skillContext: {
      objective: input.primaryIntent,
      processStatus: input.processStatus,
      relevantFacts: {
        offeringId: input.offeringId,
        firstName: input.firstName,
      },
      missingData: input.nextRecommendedField ? [input.nextRecommendedField] : [],
      temporalContext: {
        referenceTimestamp: new Date().toISOString(),
        businessTimezone: 'America/Lima',
        locale: 'es-PE',
      },
    },
    createdAt: new Date().toISOString(),
  },
});

const installScenario = (config: ScenarioConfig) => {
  const recorded: RecordedMessage[] = [];
  const visibleByMessageId = new Map<string, any>();
  const workflowStateById = new Map<string, any>();
  const counters = {
    searchCatalogCalls: 0,
    startProcessCalls: 0,
    continueProcessCalls: 0,
  };

  const receptionDeskPath = require.resolve('../orchestration/hermesReceptionDesk.service');
  const skillDispatchPath = require.resolve('../orchestration/hermesSkillDispatch.service');
  const conversationPath = require.resolve('../../../services/agentConversation.service');
  const workflowPath = require.resolve('../../../services/agentSim.service');
  const contextBuilderPath = require.resolve('../context/hermesContextBuilder.service');
  const schedulingObservationPath = require.resolve('../scheduling/hermesSchedulingObservation.service');
  const subAgentDispatcherPath = require.resolve('../orchestration/hermesAgentDispatcher');
  const capabilityGatewayPath = require.resolve('../../capabilities/agentCapabilityGateway');
  const orchestratorPath = require.resolve('../orchestration/hermesTurnOrchestrator.service');

  const overrides: Array<() => void> = [];

  if (config.workflowId && config.initialState) {
    workflowStateById.set(config.workflowId, config.initialState);
  }

  const patchModuleExports = (modulePath: string, patcher: (current: any) => any) => {
    const current = require(modulePath);
    const entry = require.cache[modulePath];
    const previousExports = entry?.exports;
    if (!entry) throw new Error(`Missing module cache entry for ${modulePath}`);
    entry.exports = patcher(current);
    overrides.push(() => {
      entry.exports = previousExports;
    });
  };

  patchModuleExports(receptionDeskPath, (current) => ({
    ...current,
    observeHermesReceptionDeskTurn: async () => config.observed,
  }));
  patchModuleExports(skillDispatchPath, (current) => ({
    ...current,
    dispatchHermesSkillPlan: async () => ({ result: config.skillResult }),
  }));
  patchModuleExports(schedulingObservationPath, (current) => ({
    ...current,
    observeHermesSchedulingDryRun: async () => undefined,
  }));
  patchModuleExports(subAgentDispatcherPath, (current) => ({
    ...current,
    dispatchHermesSubAgent: async () => undefined,
  }));
  patchModuleExports(contextBuilderPath, (current) => ({
    ...current,
    buildHermesReadOnlyContext: async () => config.finalContext || {
      context: config.observed.context,
      history: config.observed.history || [],
    },
  }));
  patchModuleExports(workflowPath, (current) => ({
    ...current,
    getWorkflowState: async (workflowId: string) => workflowStateById.get(workflowId),
  }));
  patchModuleExports(conversationPath, (current) => ({
    ...current,
    resolveActiveWorkflowForConversation: async () => config.workflowId,
    resolveConversationIdForWorkflow: async () => config.conversationId,
    findConversationMessageByMessageId: async ({ messageId }: any) => visibleByMessageId.get(String(messageId)),
    recordInboundMessage: async (payload: any) => {
      recorded.push({ kind: 'inbound', body: String(payload.body || ''), messageId: payload.messageId, metadata: payload.metadata, state: payload.state, workflowId: payload.workflowId });
    },
    recordVisibleHermesAgentMessage: async (payload: any) => {
      recorded.push({ kind: 'visible-hermes', body: String(payload.body || ''), messageId: payload.messageId, metadata: payload.metadata, state: payload.state, workflowId: payload.workflowId });
      visibleByMessageId.set(String(payload.messageId), {
        workflowId: payload.workflowId,
        provider: payload.provider,
        model: payload.model,
        body: payload.body,
        content: { text: payload.body },
      });
      if (payload.workflowId) workflowStateById.set(String(payload.workflowId), payload.state);
    },
    recordVisibleAgentMessage: async (payload: any) => {
      recorded.push({ kind: 'visible-legacy', body: String(payload.body || ''), messageId: payload.messageId, metadata: payload.metadata, state: payload.state, workflowId: payload.workflowId });
      visibleByMessageId.set(String(payload.messageId), {
        workflowId: payload.workflowId,
        provider: payload.provider,
        model: payload.model,
        body: payload.body,
        content: { text: payload.body },
      });
      if (payload.workflowId) workflowStateById.set(String(payload.workflowId), payload.state);
    },
    recordAgentConversationMessage: async (payload: any) => {
      recorded.push({ kind: 'internal', body: String(payload.body || ''), messageId: payload.messageId, metadata: payload.metadata, state: payload.state, workflowId: payload.workflowId });
    },
  }));
  patchModuleExports(capabilityGatewayPath, (current) => ({
    ...current,
      agentCapabilityGateway: {
        ...current.agentCapabilityGateway,
        searchCatalog: async () => {
        counters.searchCatalogCalls += 1;
        return config.searchCatalogResult || baseCatalog.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          durationMinutes: item.durationMinutes,
        }));
      },
      getOfferingDetails: async () => config.offeringDetailsResult,
      startProcess: async () => {
        counters.startProcessCalls += 1;
        const result = config.startProcessResult;
        if (result?.process?.workflowId) workflowStateById.set(String(result.process.workflowId), result.rawState);
        return result;
      },
      continueProcess: async () => {
        counters.continueProcessCalls += 1;
        const result = (config.continueProcessResults || []).shift();
        if (result?.process?.workflowId) workflowStateById.set(String(result.process.workflowId), result.rawState);
        return result;
      },
      getProcessContext: async ({ workflowId }: any) => {
        const pending = (config.continueProcessResults || [])[0];
        if (pending?.process?.workflowId === workflowId) return pending;
        if (config.startProcessResult?.process?.workflowId === workflowId) return config.startProcessResult;
        return undefined;
      },
    },
  }));

  delete require.cache[orchestratorPath];
  const { orchestrateHermesPublicTurn } = require('../orchestration/hermesTurnOrchestrator.service');

  return {
    recorded,
    counters,
    orchestrateHermesPublicTurn,
    restore: () => {
      delete require.cache[orchestratorPath];
      while (overrides.length) overrides.pop()?.();
    },
  };
};

const run = async () => {
  enableFlags();
  const results = [];
  const businessSlug = 'demo_test';

  results.push(await makeResult('caso 1 saludo: cero acciones y saludo natural', async () => {
    const conversationId = `h07r1-greeting-${Date.now()}`;
    const messageId = `${conversationId}-m1`;
    const observed = buildObservedTurn({
      businessSlug,
      conversationId,
      userMessage: 'Hola',
      selectedSkill: 'customer-conversation',
      decision: 'RESPOND_DIRECTLY',
      primaryIntent: 'conversation',
      activeProcess: false,
    });
    const scenario = installScenario({
      businessSlug,
      conversationId,
      route: 'initial',
      userMessage: 'Hola',
      messageId,
      correlationId: `${conversationId}-corr`,
      observed,
      skillResult: {
        invocationId: 'inv-1',
        skillId: 'customer-conversation',
        skillVersion: '1.0.0',
        status: 'ANSWER_READY',
        ownerRetainedByHermes: true,
        actionExecutionAllowed: false,
        summary: 'Greeting',
        fallbackUsed: false,
        durationMs: 1,
        producedAt: new Date().toISOString(),
      },
    });

    try {
      const result = await scenario.orchestrateHermesPublicTurn({
        route: 'initial',
        businessSlug,
        conversationId,
        userMessage: 'Hola',
        messageId,
        correlationId: `${conversationId}-corr`,
        channel: 'web_agent',
      });

      assert(scenario.counters.startProcessCalls === 0 && scenario.counters.continueProcessCalls === 0, 'greeting should not execute operational actions');
      assert(/hola, soy iris/i.test(String(result.message || '')), 'greeting should be natural and owned by Iris');
      assert(!/que servicio deseas/i.test(String(result.message || '')), 'greeting should not force booking question');
      assert(scenario.recorded.filter((item) => item.kind.startsWith('visible')).length === 1, 'expected one visible outbound');
    } finally {
      scenario.restore();
    }
  }));

  results.push(await makeResult('caso 2 catalogo: search_catalog permitido sin workflow', async () => {
    const conversationId = `h07r1-catalog-${Date.now()}`;
    const messageId = `${conversationId}-m1`;
    const observed = buildObservedTurn({
      businessSlug,
      conversationId,
      userMessage: 'Que servicios ofrecen?',
      selectedSkill: 'catalog-advisor',
      decision: 'DELEGATE_INFORMATIONAL',
      primaryIntent: 'catalog_list',
      activeProcess: false,
    });
    const scenario = installScenario({
      businessSlug,
      conversationId,
      route: 'initial',
      userMessage: 'Que servicios ofrecen?',
      messageId,
      correlationId: `${conversationId}-corr`,
      observed,
      skillResult: {
        invocationId: 'inv-2',
        skillId: 'catalog-advisor',
        skillVersion: '1.0.0',
        status: 'ANSWER_READY',
        ownerRetainedByHermes: true,
        actionExecutionAllowed: false,
        summary: 'Catalog response',
        fallbackUsed: false,
        durationMs: 1,
        producedAt: new Date().toISOString(),
      },
    });

    try {
      const result = await scenario.orchestrateHermesPublicTurn({
        route: 'initial',
        businessSlug,
        conversationId,
        userMessage: 'Que servicios ofrecen?',
        messageId,
        correlationId: `${conversationId}-corr`,
        channel: 'web_agent',
      });

      assert(scenario.counters.searchCatalogCalls === 1, 'catalog question should allow search_catalog once');
      assert(scenario.counters.startProcessCalls === 0, 'catalog question should not start workflow');
      assert(/consulta basica/i.test(String(result.message || '')), 'catalog response should mention real catalog');
    } finally {
      scenario.restore();
    }
  }));

  results.push(await makeResult('caso 3 solicitud no soportada: rechazo veraz sin seleccionar servicio unico', async () => {
    const conversationId = `h07r1-unsupported-${Date.now()}`;
    const messageId = `${conversationId}-m1`;
    const observed = buildObservedTurn({
      businessSlug,
      conversationId,
      userMessage: 'Quiero chaufa',
      selectedSkill: 'customer-conversation',
      decision: 'RESPOND_DIRECTLY',
      primaryIntent: 'conversation',
      activeProcess: false,
    });
    const scenario = installScenario({
      businessSlug,
      conversationId,
      route: 'initial',
      userMessage: 'Quiero chaufa',
      messageId,
      correlationId: `${conversationId}-corr`,
      observed,
      skillResult: {
        invocationId: 'inv-3',
        skillId: 'customer-conversation',
        skillVersion: '1.0.0',
        status: 'ANSWER_READY',
        ownerRetainedByHermes: true,
        actionExecutionAllowed: false,
        summary: 'Unsupported request',
        fallbackUsed: false,
        durationMs: 1,
        producedAt: new Date().toISOString(),
      },
    });

    try {
      const result = await scenario.orchestrateHermesPublicTurn({
        route: 'initial',
        businessSlug,
        conversationId,
        userMessage: 'Quiero chaufa',
        messageId,
        correlationId: `${conversationId}-corr`,
        channel: 'web_agent',
      });

      assert(scenario.counters.startProcessCalls === 0 && scenario.counters.continueProcessCalls === 0, 'unsupported request should not touch Temporal');
      assert(/no ofrecemos/i.test(String(result.message || '')), 'response should reject unsupported request truthfully');
      assert(/consulta basica/i.test(String(result.message || '')), 'response should ground user on real catalog');
    } finally {
      scenario.restore();
    }
  }));

  results.push(await makeResult('caso 4 multi-fact booking: start una vez, customer data una vez, sin repetir nombre o telefono', async () => {
    const conversationId = `h07r1-booking-${Date.now()}`;
    const messageId = `${conversationId}-m1`;
    const workflowId = `${conversationId}-wf`;
    const observed = buildObservedTurn({
      businessSlug,
      conversationId,
      userMessage: 'Quiero reservar la Consulta basica. Soy Ricardo y mi telefono es 955479450.',
      selectedSkill: 'scheduling-specialist',
      decision: 'PROPOSE_ACTION',
      primaryIntent: 'start_booking',
      activeProcess: false,
      firstName: 'Ricardo',
      offeringId: 'off-basic',
      phonePresent: true,
    });
    const startProcessResult = {
      process: { workflowId, workflowType: 'schedule_consultation', status: 'WAITING_FOR_CUSTOMER_DATA' },
      knownFacts: {
        offering: { id: 'off-basic', name: 'Consulta basica' },
        customer: { firstName: 'Ricardo', phone: '955479450' },
      },
      awaiting: { type: 'customer_information', nextRecommendedField: 'lastName' },
      allowedActions: ['submit_customer_information', 'cancel_process'],
      rawState: {
        status: 'WAITING_FOR_CUSTOMER_DATA',
        customerData: { firstName: 'Ricardo', phone: '955479450' },
        selectedOffering: { _id: 'off-basic', name: 'Consulta basica' },
      },
    };
    const continueProcessResult = {
      ...startProcessResult,
      rawState: {
        ...startProcessResult.rawState,
        customerData: { firstName: 'Ricardo', phone: '955479450' },
      },
    };
    const scenario = installScenario({
      businessSlug,
      conversationId,
      route: 'initial',
      userMessage: 'Quiero reservar la Consulta basica. Soy Ricardo y mi telefono es 955479450.',
      messageId,
      correlationId: `${conversationId}-corr`,
      observed,
      skillResult: {
        invocationId: 'inv-4',
        skillId: 'scheduling-specialist',
        skillVersion: '1.1.0',
        status: 'ACTION_PROPOSAL',
        ownerRetainedByHermes: true,
        actionExecutionAllowed: false,
        summary: 'Scheduling proposal',
        proposedAction: 'CHECK_AVAILABILITY_REQUEST',
        fallbackUsed: false,
        durationMs: 1,
        producedAt: new Date().toISOString(),
      },
      startProcessResult,
      continueProcessResults: [continueProcessResult],
      finalContext: {
        context: {
          ...observed.context,
          process: {
            active: true,
            processType: 'schedule_consultation',
            status: 'WAITING_FOR_CUSTOMER_DATA',
            awaiting: { type: 'customer_information', nextRecommendedField: 'lastName' },
            knownFacts: { offering: { id: 'off-basic' } },
            allowedActions: [],
            informationalOnly: true,
          },
        },
        history: [],
      },
    });

    try {
      const result = await scenario.orchestrateHermesPublicTurn({
        route: 'initial',
        businessSlug,
        conversationId,
        userMessage: 'Quiero reservar la Consulta basica. Soy Ricardo y mi telefono es 955479450.',
        messageId,
        correlationId: `${conversationId}-corr`,
        channel: 'web_agent',
      });

      assert(scenario.counters.startProcessCalls === 1, 'workflow should start exactly once');
      assert(scenario.counters.continueProcessCalls === 1, 'customer data should submit exactly once');
      assert(String(result.workflowId || '') === workflowId, 'workflow id should be preserved');
      assert(!/como te llamas|cual es tu nombre/i.test(String(result.message || '')), 'response should not ask for known name again');
      assert(!/numero de contacto|telefono/i.test(String(result.message || '')), 'response should not ask for known phone again');
      assert(/apellido/i.test(String(result.message || '')), 'response should ask only the actual missing field');
    } finally {
      scenario.restore();
    }
  }));

  results.push(await makeResult('caso 5 side question activa: responde duracion sin avanzar workflow', async () => {
    const conversationId = `h07r1-side-${Date.now()}`;
    const workflowId = `${conversationId}-wf`;
    const messageId = `${conversationId}-m1`;
    const observed = buildObservedTurn({
      businessSlug,
      conversationId,
      workflowId,
      userMessage: 'Antes de darte mi telefono, cuanto dura?',
      selectedSkill: 'scheduling-specialist',
      decision: 'CONTINUE_ACTIVE_PROCESS',
      primaryIntent: 'side_question',
      activeProcess: true,
      processStatus: 'WAITING_FOR_CUSTOMER_DATA',
      awaitingType: 'customer_information',
      nextRecommendedField: 'phone',
      offeringId: 'off-basic',
      sideQuestionType: 'duration',
    });
    const scenario = installScenario({
      businessSlug,
      conversationId,
      route: 'continuation',
      workflowId,
      initialState: {
        status: 'WAITING_FOR_CUSTOMER_DATA',
        selectedOffering: { _id: 'off-basic', name: 'Consulta basica', durationMinutes: 60 },
      },
      userMessage: 'Antes de darte mi telefono, cuanto dura?',
      messageId,
      correlationId: `${conversationId}-corr`,
      observed,
      skillResult: {
        invocationId: 'inv-5',
        skillId: 'scheduling-specialist',
        skillVersion: '1.1.0',
        status: 'ANSWER_READY',
        ownerRetainedByHermes: true,
        actionExecutionAllowed: false,
        summary: 'Duration answered',
        fallbackUsed: false,
        durationMs: 1,
        producedAt: new Date().toISOString(),
      },
      finalContext: {
        context: observed.context,
        history: [],
      },
    });

    try {
      const result = await scenario.orchestrateHermesPublicTurn({
        route: 'continuation',
        workflowId,
        conversationId,
        userMessage: 'Antes de darte mi telefono, cuanto dura?',
        messageId,
        correlationId: `${conversationId}-corr`,
        channel: 'web_agent',
      });

      assert(scenario.counters.startProcessCalls === 0 && scenario.counters.continueProcessCalls === 0, 'side question should not advance workflow');
      assert(/60 minutos/i.test(String(result.message || '')), 'duration should be answered');
      assert(/contacto|telefono/i.test(String(result.message || '')), 'pending phone should remain pending softly');
      assert(scenario.recorded.filter((item) => item.kind.startsWith('visible')).length === 1, 'side question should keep one visible outbound');
    } finally {
      scenario.restore();
    }
  }));

  results.push(await makeResult('caso 6 duplicate message: replay sin acciones duplicadas', async () => {
    const conversationId = `h07r1-duplicate-${Date.now()}`;
    const messageId = `${conversationId}-m1`;
    const workflowId = `${conversationId}-wf`;
    const observed = buildObservedTurn({
      businessSlug,
      conversationId,
      workflowId,
      userMessage: 'Que servicios ofrecen?',
      selectedSkill: 'catalog-advisor',
      decision: 'DELEGATE_INFORMATIONAL',
      primaryIntent: 'catalog_list',
      activeProcess: false,
    });
    const scenario = installScenario({
      businessSlug,
      conversationId,
      route: 'initial',
      workflowId,
      userMessage: 'Que servicios ofrecen?',
      messageId,
      correlationId: `${conversationId}-corr`,
      observed,
      skillResult: {
        invocationId: 'inv-6',
        skillId: 'catalog-advisor',
        skillVersion: '1.0.0',
        status: 'ANSWER_READY',
        ownerRetainedByHermes: true,
        actionExecutionAllowed: false,
        summary: 'Catalog response',
        fallbackUsed: false,
        durationMs: 1,
        producedAt: new Date().toISOString(),
      },
    });

    try {
      const first = await scenario.orchestrateHermesPublicTurn({
        route: 'initial',
        businessSlug,
        conversationId,
        userMessage: 'Que servicios ofrecen?',
        messageId,
        correlationId: `${conversationId}-corr`,
        channel: 'web_agent',
      });
      const second = await scenario.orchestrateHermesPublicTurn({
        route: 'initial',
        businessSlug,
        conversationId,
        userMessage: 'Que servicios ofrecen?',
        messageId,
        correlationId: `${conversationId}-corr`,
        channel: 'web_agent',
      });

      assert(String(first.message || '') === String(second.message || ''), 'duplicate message should replay same visible response');
      assert(scenario.counters.searchCatalogCalls === 1, 'duplicate replay should not execute read-only action twice');
      assert(scenario.recorded.filter((item) => item.kind.startsWith('visible')).length === 1, 'duplicate replay should not persist another visible outbound');
    } finally {
      scenario.restore();
    }
  }));

  printSummary('HERMES-07-R1 Acceptance', results, {});
};

run().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
