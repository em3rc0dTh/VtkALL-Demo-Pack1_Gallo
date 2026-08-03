import assert from 'assert';
import { agentCapabilityGateway } from '../../agent/capabilities/agentCapabilityGateway';
import { deterministicFallback } from '../../agent/fallback/deterministicFallback';
import { parseDecisionJson } from '../../agent/providers/jsonDecision';
import { preserveDeterministicProcessActions, removeProcessStartWhenActive, runAgentRuntime } from '../../agent/runtime/agentRuntime';
import { vtkallTemporalMcpServer } from '../../mcp/temporal/server/vtkallTemporalMcpServer';
import { toAgentProcessContext } from '../../mcp/temporal/temporalAgentBridge';

const assertRejects = async (fn: () => Promise<unknown>, message: string) => {
  let rejected = false;
  try {
    await fn();
  } catch {
    rejected = true;
  }
  assert(rejected, message);
};

const catalogContext: any = {
  conversation: {
    conversationId: 'web_test_agent_mcp',
    businessSlug: 'demo_test',
    channel: 'web_agent',
    customerIdentity: { identityStatus: 'anonymous' },
    recentMessages: [
      { role: 'assistant', content: 'Tenemos Basic Consultation.', createdAt: new Date().toISOString() },
    ],
  },
  business: {
    businessSlug: 'demo_test',
    business: {
      name: 'Demo Test Laboratory',
      timezone: 'America/Lima',
    },
    agent: {
      name: 'Iris',
      role: 'asistente de reservas',
    },
    capabilities: [],
    catalogSummary: [
      {
        id: 'off_basic_consultation',
        name: 'Basic Consultation',
        durationMinutes: 60,
      },
    ],
  },
};

const run = async () => {
  process.env.GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY';
  process.env.GCP_API_KEY = 'YOUR_GCP_API_KEY';
  process.env.OLLAMA_URL = '';

  assert.equal(parseDecisionJson('{}'), undefined);
  assert.equal(parseDecisionJson('{"actions":[]}'), undefined);
  assert(parseDecisionJson('{"reply":"Hola"}'));

  await assertRejects(
    () => (vtkallTemporalMcpServer as any).execute('temporal.start_workflow', {}),
    'MCP must reject unrestricted Temporal tools.'
  );

  await assertRejects(
    () => vtkallTemporalMcpServer.execute('continue_schedule_consultation', {
      workflowId: 'wf_test',
      action: 'raw_signal',
    }),
    'MCP must reject arbitrary process actions.'
  );

  const processContext = toAgentProcessContext({
    workflowId: 'schedule-consultation-test',
    status: 'WAITING_FOR_CUSTOMER_DATA',
    requiredFields: [
      { key: 'firstName', label: 'Nombre', required: true },
      { key: 'phone', label: 'Telefono', required: true },
    ],
    selectedOffering: { _id: 'off_basic_consultation', name: 'Basic Consultation' },
    availableSlots: [],
    errors: [],
  });

  assert.equal(processContext.process.workflowType, 'schedule_consultation');
  assert.equal(processContext.awaiting.type, 'customer_information');
  assert.equal(processContext.awaiting.nextRecommendedField, 'firstName');
  assert(processContext.allowedActions.includes('submit_customer_information'));

  const updatedProcessContext = toAgentProcessContext({
    workflowId: 'schedule-consultation-test',
    status: 'WAITING_FOR_CUSTOMER_DATA',
    requiredFields: [
      { key: 'firstName', label: 'Nombre', required: true },
      { key: 'lastName', label: 'Apellido', required: true },
      { key: 'phone', label: 'Telefono', required: true },
    ],
    customerData: {
      firstName: 'Ricardo',
    },
    selectedOffering: { _id: 'off_basic_consultation', name: 'Basic Consultation' },
    availableSlots: [],
    errors: [],
  });
  assert.equal((updatedProcessContext.knownFacts.customer as any).firstName, 'Ricardo');
  assert.equal(updatedProcessContext.awaiting.nextRecommendedField, 'lastName');

  const activeContext = {
    ...catalogContext,
    process: updatedProcessContext,
  };
  const activeDecision = await deterministicFallback(activeContext, 'Ricardo');
  assert.notEqual(activeDecision.intent?.name, 'general_business_conversation');
  assert(!/Te puedo ayudar con informacion y reservas/i.test(activeDecision.reply || ''));

  const offeringSelectionContext = {
    ...catalogContext,
    process: toAgentProcessContext({
      workflowId: 'schedule-consultation-offering-selection',
      status: 'WAITING_FOR_SERVICE_SELECTION',
      requiredFields: [],
      selectedOffering: undefined,
      availableSlots: [],
      errors: [],
    }),
  };
  const ambiguousOfferingSelectionDecision = await deterministicFallback(offeringSelectionContext, 'Sí');
  assert.equal(ambiguousOfferingSelectionDecision.intent?.name, 'ask_offering_selection');
  const offeringSelectionDecision = await deterministicFallback(offeringSelectionContext, '1');
  assert.equal(offeringSelectionDecision.intent?.name, 'offering_selection');
  assert(offeringSelectionDecision.actions?.some((action) =>
    action.capability === 'continue_schedule_consultation'
    && action.arguments.action === 'submit_offering_selection'
    && (action.arguments.data as any)?.catalogOfferingId === 'off_basic_consultation'
  ));
  const greetingDuringSelection = await deterministicFallback(offeringSelectionContext, 'Holaaaaaaaa');
  assert.equal(greetingDuringSelection.intent?.name, 'side_conversation');
  assert(/Basic Consultation/i.test(greetingDuringSelection.reply || ''));
  const catalogDuringSelection = await deterministicFallback(offeringSelectionContext, 'Que servicios tienes?');
  assert.equal(catalogDuringSelection.intent?.name, 'catalog_question');
  assert(/Basic Consultation/i.test(catalogDuringSelection.reply || ''));
  const outOfCatalogDuringSelection = await deterministicFallback(offeringSelectionContext, 'Quiero un chaufa');
  assert.equal(outOfCatalogDuringSelection.intent?.name, 'ask_offering_selection');
  assert(/No encuentro ese servicio/i.test(outOfCatalogDuringSelection.reply || ''));

  const datePreferenceContext = {
    ...catalogContext,
    process: toAgentProcessContext({
      workflowId: 'schedule-consultation-date-preference',
      status: 'CUSTOMER_DATA_VALIDATED',
      requiredFields: [],
      customerData: {
        firstName: 'Eduardo',
        lastName: 'Merino',
        phone: '933075200',
        managedEntityDisplayName: 'Renault Logan 2014',
      },
      selectedOffering: { _id: 'off_basic_consultation', name: 'Basic Consultation' },
      availableSlots: [],
      errors: [],
    }),
  };
  const datePreferenceDecision = await deterministicFallback(datePreferenceContext, '16/07/2026');
  assert.equal(datePreferenceDecision.intent?.name, 'date_preference');
  assert(datePreferenceDecision.actions?.some((action) =>
    action.capability === 'continue_schedule_consultation'
    && action.arguments.action === 'submit_date_preference'
    && (action.arguments.data as any)?.preferredDate === '2026-07-16'
  ));
  const casualDuringProcessDecision = await deterministicFallback(datePreferenceContext, 'Hola broer, como estas?');
  assert.equal(casualDuringProcessDecision.intent?.name, 'side_conversation');
  assert(!casualDuringProcessDecision.actions?.length);

  const slotSelectionContext = {
    ...catalogContext,
    process: toAgentProcessContext({
      workflowId: 'schedule-consultation-slot-selection',
      status: 'WAITING_FOR_SLOT_SELECTION',
      requiredFields: [],
      customerData: {
        firstName: 'Eduardo',
        lastName: 'Merino',
        phone: '933075200',
        managedEntityDisplayName: 'Renault Logan 2014',
      },
      selectedOffering: { _id: 'off_basic_consultation', name: 'Basic Consultation' },
      availableSlots: [
        { _id: 'slot_1', startAt: '2026-07-16T14:00:00.000Z', teamId: 'team_consultation', durationMinutes: 60 },
        { _id: 'slot_2', startAt: '2026-07-16T15:00:00.000Z', teamId: 'team_consultation', durationMinutes: 60 },
      ],
      errors: [],
    }),
  };
  const slotListDecision = await deterministicFallback(slotSelectionContext, 'Cuáles son?');
  assert.equal(slotListDecision.intent?.name, 'ask_slot_selection');
  assert(/1\./.test(slotListDecision.reply || ''));
  assert(/2\./.test(slotListDecision.reply || ''));
  const slotPickDecision = await deterministicFallback(slotSelectionContext, '2');
  assert.equal(slotPickDecision.intent?.name, 'slot_selection');
  assert(slotPickDecision.actions?.some((action) =>
    action.capability === 'continue_schedule_consultation'
    && action.arguments.action === 'submit_slot_selection'
    && (action.arguments.data as any)?.slotId === 'slot_2'
  ));
  const slotByIdDecision = await deterministicFallback(slotSelectionContext, 'slot_1');
  assert.equal(slotByIdDecision.intent?.name, 'slot_selection');
  assert(slotByIdDecision.actions?.some((action) => (action.arguments.data as any)?.slotId === 'slot_1'));
  const slotByTimeDecision = await deterministicFallback(slotSelectionContext, '09:00');
  assert.equal(slotByTimeDecision.intent?.name, 'slot_selection');
  assert(slotByTimeDecision.actions?.some((action) => (action.arguments.data as any)?.slotId === 'slot_1'));

  const strippedStartDecision = removeProcessStartWhenActive(datePreferenceContext, {
    actions: [
      { capability: 'start_schedule_consultation', arguments: { businessSlug: 'demo_test' } },
      {
        capability: 'continue_schedule_consultation',
        arguments: { action: 'submit_date_preference', data: { preferredDate: '2026-07-16' } },
      },
    ],
  });
  assert(!strippedStartDecision.actions?.some((action) => action.capability === 'start_schedule_consultation'));
  assert(strippedStartDecision.actions?.some((action) => action.capability === 'continue_schedule_consultation'));

  const catalogDecision = await deterministicFallback(catalogContext, 'What services do you offer?');
  assert.equal(catalogDecision.intent?.name, 'catalog_question');
  assert(!catalogDecision.actions?.some((action) => action.capability === 'start_schedule_consultation'));

  const reserveDecision = await deterministicFallback(catalogContext, 'Can I reserve one?');
  assert.equal(reserveDecision.intent?.name, 'start_booking');
  assert(reserveDecision.actions?.some((action) => action.capability === 'start_schedule_consultation'));
  assert(!/can't reserve|cannot reserve|no puedes reservar|no puedo reservar/i.test(reserveDecision.reply || ''));

  const richReserveDecision = await deterministicFallback(catalogContext, 'Hola, soy Ricardo. Quiero agendar Basic Consultation.');
  assert.equal(richReserveDecision.intent?.name, 'start_booking');
  assert(richReserveDecision.actions?.some((action) =>
    action.capability === 'start_schedule_consultation'
    && action.arguments.offeringId === 'off_basic_consultation'
  ));
  assert(richReserveDecision.actions?.some((action) =>
    action.capability === 'continue_schedule_consultation'
    && action.arguments.action === 'submit_customer_information'
    && (action.arguments.data as any)?.firstName === 'Ricardo'
  ));
  assert(/Ricardo/i.test(richReserveDecision.reply || ''));

  const outOfCatalogGeneralDecision = await deterministicFallback(catalogContext, 'Quiero un chaufa.');
  assert.equal(outOfCatalogGeneralDecision.intent?.name, 'unsupported_catalog_request');
  assert(/No ofrezco ese tipo de producto o servicio/i.test(outOfCatalogGeneralDecision.reply || ''));

  const providerOnlyTextDecision = preserveDeterministicProcessActions({
    reply: 'Perfecto, podemos avanzar con Basic Consultation. Para empezar, como te llamas?',
    intent: { name: 'start_booking', confidence: 0.6 },
  }, richReserveDecision);
  assert(providerOnlyTextDecision.actions?.some((action) => action.capability === 'start_schedule_consultation'));
  assert(providerOnlyTextDecision.actions?.some((action) =>
    action.capability === 'continue_schedule_consultation'
    && action.arguments.action === 'submit_customer_information'
    && (action.arguments.data as any)?.firstName === 'Ricardo'
  ));

  const yesDecision = await deterministicFallback(catalogContext, 'Yes.');
  assert.notEqual(yesDecision.intent?.name, 'customer_confirmation');

  const originalGateway = {
    getBusinessContext: agentCapabilityGateway.getBusinessContext,
    getConversationContext: agentCapabilityGateway.getConversationContext,
    getProcessContext: agentCapabilityGateway.getProcessContext,
    resolveActiveProcess: agentCapabilityGateway.resolveActiveProcess,
    startProcess: agentCapabilityGateway.startProcess,
    continueProcess: agentCapabilityGateway.continueProcess,
  };
  const transitionCalls: any[] = [];
  const startedProcess = toAgentProcessContext({
    workflowId: 'schedule-consultation-rich-turn',
    status: 'WAITING_FOR_CUSTOMER_DATA',
    requiredFields: [
      { key: 'firstName', label: 'Nombre', required: true },
      { key: 'phone', label: 'Telefono', required: true },
    ],
    selectedOffering: { _id: 'off_basic_consultation', name: 'Basic Consultation' },
    availableSlots: [],
    errors: [],
  });
  const continuedProcess = toAgentProcessContext({
    workflowId: 'schedule-consultation-rich-turn',
    status: 'WAITING_FOR_CUSTOMER_DATA',
    requiredFields: [
      { key: 'firstName', label: 'Nombre', required: true },
      { key: 'phone', label: 'Telefono', required: true },
    ],
    customerData: { firstName: 'Ricardo' },
    selectedOffering: { _id: 'off_basic_consultation', name: 'Basic Consultation' },
    availableSlots: [],
    errors: [],
  });

  try {
    (agentCapabilityGateway as any).getBusinessContext = async () => catalogContext.business;
    (agentCapabilityGateway as any).getConversationContext = async (input: any) => ({
      ...catalogContext.conversation,
      conversationId: input.conversationId,
    });
    (agentCapabilityGateway as any).resolveActiveProcess = async () => undefined;
    (agentCapabilityGateway as any).getProcessContext = async ({ workflowId }: { workflowId?: string }) => {
      transitionCalls.push({ type: 'getContext', workflowId });
      return workflowId ? continuedProcess : undefined;
    };
    (agentCapabilityGateway as any).startProcess = async (input: any) => {
      transitionCalls.push({ type: 'start', input });
      return startedProcess;
    };
    (agentCapabilityGateway as any).continueProcess = async (input: any) => {
      transitionCalls.push({ type: 'continue', input });
      return continuedProcess;
    };

    const result = await runAgentRuntime({
      businessSlug: 'demo_test',
      conversationId: 'web_rich_turn',
      message: 'Hola, soy Ricardo. Quiero agendar Basic Consultation.',
      channel: 'web_agent',
    });

    const startCalls = transitionCalls.filter((call) => call.type === 'start');
    const continueCalls = transitionCalls.filter((call) => call.type === 'continue');
    assert.equal(startCalls.length, 1);
    assert.equal(continueCalls.length, 1);
    assert.equal(startCalls[0].input.conversationId, 'web_rich_turn');
    assert.equal(startCalls[0].input.offeringId, 'off_basic_consultation');
    assert.equal(continueCalls[0].input.process.process.workflowId, 'schedule-consultation-rich-turn');
    assert.equal(continueCalls[0].input.action, 'submit_customer_information');
    assert.equal(continueCalls[0].input.data.firstName, 'Ricardo');
    assert.equal(result.workflowId, 'schedule-consultation-rich-turn');
    assert.equal((result.state as any)?.customerData?.firstName, 'Ricardo');
    assert(/Ricardo/i.test(result.message || ''));
  } finally {
    agentCapabilityGateway.getBusinessContext = originalGateway.getBusinessContext;
    agentCapabilityGateway.getConversationContext = originalGateway.getConversationContext;
    agentCapabilityGateway.getProcessContext = originalGateway.getProcessContext;
    agentCapabilityGateway.resolveActiveProcess = originalGateway.resolveActiveProcess;
    agentCapabilityGateway.startProcess = originalGateway.startProcess;
    agentCapabilityGateway.continueProcess = originalGateway.continueProcess;
  }

  console.log('agent-mcp-bridge: PASS');
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
