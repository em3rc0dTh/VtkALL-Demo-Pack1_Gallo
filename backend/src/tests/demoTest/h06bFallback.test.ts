import assert from 'assert';
import { runHermesSchedulingBridgeTurn } from '../../agent/hermes/scheduling/hermesSchedulingBridge.service';
import { connectMongo, disconnectMongo } from '../../agent/hermes/tests/h04TestUtils';
import { assertBridgeHandled } from './h06bAssertions';
import { enableH06BTestFlags } from './h06bFixtures';

const noop = async () => null as any;

const activeProcess = {
  process: { workflowId: 'wf-fallback', workflowType: 'schedule_consultation', status: 'WAITING_FOR_CUSTOMER_DATA' },
  awaiting: { type: 'customer_information', nextRecommendedField: 'phone' },
  allowedActions: ['submit_customer_information', 'cancel_process'],
  knownFacts: { offering: { name: 'Consulta basica', durationMinutes: 60 } },
  rawState: { status: 'WAITING_FOR_CUSTOMER_DATA' },
};

const buildContext = async () => ({
  context: {
    business: { businessSlug: 'demo_test', timezone: 'America/Lima', features: { supportsAppointments: true } },
    conversation: { conversationId: 'hermes-h06b-fallback', channel: 'web_agent', history: [] },
    process: {
      active: true,
      processType: 'schedule_consultation',
      status: 'WAITING_FOR_CUSTOMER_DATA',
      awaiting: { type: 'customer_information', field: 'phone' },
      knownFacts: {},
      allowedActions: [],
      informationalOnly: true as const,
    },
    catalog: [{
      id: 'off-basic',
      name: 'Consulta basica',
      durationMinutes: 60,
      pricing: { type: 'not_published' as const },
      publicVisible: true,
      active: true,
    }],
    permissions: { mode: 'shadow' as const, readOnly: true as const, canExecuteActions: false as const },
  },
  history: [],
});

const run = async () => {
  enableH06BTestFlags();
  await connectMongo();
  const sideConversationId = `hermes-h06b-fallback-side-${Date.now()}`;
  const unknownConversationId = `hermes-h06b-fallback-unknown-${Date.now()}`;

  const sideQuestion = assertBridgeHandled(await runHermesSchedulingBridgeTurn({
    businessSlug: 'demo_test',
    conversationId: sideConversationId,
    message: 'Antes, cuanto dura la consulta?',
    messageId: 'fallback-side',
    correlationId: 'corr-side',
  }, {
    buildContext: buildContext as any,
    gateway: {
      resolveActiveProcess: async () => 'wf-fallback',
      getProcessContext: async () => activeProcess,
    } as any,
    recordInbound: noop as any,
    recordVisible: noop as any,
    recordInternal: noop as any,
  }), 'side question must be handled');
  assert.equal(sideQuestion.bridgeOutcome, 'NO_CHANGE');
  assert(/60 minutos/.test(sideQuestion.message));
  assert(/contacto/i.test(sideQuestion.message));

  const executionUnknown = assertBridgeHandled(await runHermesSchedulingBridgeTurn({
    businessSlug: 'demo_test',
    conversationId: unknownConversationId,
    message: 'Quiero reservar una consulta.',
    messageId: 'fallback-unknown',
    correlationId: 'corr-unknown',
  }, {
    buildContext: (async () => ({
      context: {
        business: { businessSlug: 'demo_test', timezone: 'America/Lima', features: { supportsAppointments: true } },
        conversation: { conversationId: unknownConversationId, channel: 'web_agent', history: [] },
        catalog: [],
        permissions: { mode: 'shadow' as const, readOnly: true as const, canExecuteActions: false as const },
      },
      history: [],
    })) as any,
    gateway: {
      resolveActiveProcess: async () => undefined,
      startProcess: async () => { throw new Error('connection reset'); },
    } as any,
    recordInbound: noop as any,
    recordVisible: noop as any,
    recordInternal: noop as any,
  }), 'unknown execution still belongs to bridge');
  assert.equal(executionUnknown.bridgeOutcome, 'EXECUTION_UNKNOWN');
  assert(/No pude verificar/i.test(executionUnknown.message));

  console.log('h06b-fallback: PASS');
  await disconnectMongo();
};

run().catch(async (error) => {
  console.error(error);
  await disconnectMongo().catch(() => undefined);
  process.exit(1);
});
