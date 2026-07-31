import { CustomerInteraction } from '../../../models/CustomerInteraction.model';
import { AgentRuntimeResult } from '../../runtime/agentDecision';
import { resolveHermesVisibleRuntime } from '../orchestration/hermesVisibleRuntime.service';
import { connectMongo, disconnectMongo, makeResult, printSummary, assert } from './h04TestUtils';
import {
  apiGet,
  assertNoDtoLeak,
  cleanupH06FConversation,
  collectTurnDocs,
  countVisibleOutbounds,
  enableH06FVisibleFlags,
  ensureAppointmentFree,
  extractOfferingName,
  h06fConversationId,
  restartMongo,
  startH06FServer,
  enableH06FShadowOnlyFlags,
} from './h06fFixtures';

const businessSlug = 'demo_test';
const alternateBusinessSlug = 'turagua';
const cleanupTargets: Array<{ businessSlug: string; conversationId: string }> = [];

const postJson = async (baseUrl: string, path: string, body: Record<string, unknown>, headers: Record<string, string> = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  return { ok: response.ok, status: response.status, body: text ? JSON.parse(text) : undefined };
};

const visibleRuntimeDoc = async (businessSlug: string, conversationId: string, runtime: 'hermes' | 'legacy') =>
  CustomerInteraction.findOne({
    businessSlug,
    conversationId,
    direction: 'outbound',
    visibility: 'customer',
    'participant.runtime': runtime,
  }).sort({ createdAt: -1 }).lean().exec();

const run = async () => {
  await connectMongo();
  const results = [];
  let server = await startH06FServer();

  try {
    results.push(await makeResult('canary 100 hace visible a Hermes con un outbound y DTO limpio', async () => {
      enableH06FVisibleFlags(100);
      const conversationId = h06fConversationId('visible-canary');
      cleanupTargets.push({ businessSlug, conversationId });
      const messageId = `${conversationId}-m1`;
      const response = await postJson(server.baseUrl, '/api/demo-test/agent/message', {
        businessSlug,
        conversationId,
        message: 'Gracias.',
        messageId,
      }, { 'X-Correlation-Id': `${conversationId}-corr1` });
      assert(response.ok, `canary 100 route failed with ${response.status}`);
      assertNoDtoLeak(response.body?.data);
      const outbounds = await countVisibleOutbounds(businessSlug, conversationId);
      assert(outbounds === 1, `expected one visible outbound, got ${outbounds}`);
      const visibleHermes: any = await visibleRuntimeDoc(businessSlug, conversationId, 'hermes');
      assert(visibleHermes, 'Hermes visible outbound was not persisted');
      assert(visibleHermes?.metadata?.runtimeMode === 'controlled_visible', 'controlled visible metadata missing');
      assert(visibleHermes?.metadata?.canaryBucket >= 0, 'canary bucket metadata missing');
      assert(visibleHermes?.metadata?.validationResult?.accepted === true, 'validation result should be accepted');
    }));

    results.push(await makeResult('canary 0 mantiene legacy visible y Hermes no aparece en público', async () => {
      enableH06FVisibleFlags(0);
      const conversationId = h06fConversationId('visible-legacy');
      cleanupTargets.push({ businessSlug, conversationId });
      const response = await postJson(server.baseUrl, '/api/demo-test/agent/message', {
        businessSlug,
        conversationId,
        message: 'Gracias.',
        messageId: `${conversationId}-m1`,
      }, { 'X-Correlation-Id': `${conversationId}-corr1` });
      assert(response.ok, `canary 0 route failed with ${response.status}`);
      const visibleLegacy: any = await visibleRuntimeDoc(businessSlug, conversationId, 'legacy');
      const visibleHermes: any = await visibleRuntimeDoc(businessSlug, conversationId, 'hermes');
      assert(visibleLegacy, 'Legacy visible outbound missing outside canary');
      assert(!visibleHermes, 'Hermes became visible outside canary');
      assert(visibleLegacy?.metadata?.runtimeMode === 'controlled_visible_legacy', 'legacy controlled runtime metadata missing');
    }));

    results.push(await makeResult('provider no disponible sigue por camino determinista sin respuesta doble', async () => {
      enableH06FVisibleFlags(100);
      const conversationId = h06fConversationId('provider-failure');
      cleanupTargets.push({ businessSlug, conversationId });
      const response = await postJson(server.baseUrl, '/api/demo-test/agent/message', {
        businessSlug,
        conversationId,
        message: 'Hola, quiero información.',
        messageId: `${conversationId}-m1`,
      }, { 'X-Correlation-Id': `${conversationId}-corr1` });
      assert(response.ok, `provider failure path failed with ${response.status}`);
      assert(String(response.body?.data?.message || '').trim().length > 0, 'deterministic visible reply is empty');
      const outbounds = await countVisibleOutbounds(businessSlug, conversationId);
      assert(outbounds === 1, `provider failure produced ${outbounds} visible outbounds`);
    }));

    results.push(await makeResult('ruta inicial conserva workflowId y la continuidad reutiliza el mismo workflow', async () => {
      enableH06FVisibleFlags(100);
      const conversationId = h06fConversationId('continuity');
      cleanupTargets.push({ businessSlug, conversationId });

      const start = await postJson(server.baseUrl, '/api/demo-test/agent/message', {
        businessSlug,
        conversationId,
        message: 'Quiero reservar una consulta.',
        messageId: `${conversationId}-m1`,
      }, { 'X-Correlation-Id': `${conversationId}-corr1` });
      assert(start.ok, `initial visible route failed with ${start.status}`);
      const workflowId = String(start.body?.data?.workflowId || '');
      assert(workflowId, 'initial visible route did not preserve workflowId');
      const stateResponse = await apiGet(server.baseUrl, `/api/demo-test/agent/workflows/${encodeURIComponent(workflowId)}/state`);
      assert(stateResponse.ok, 'workflow state endpoint failed');
      const offeringName = extractOfferingName(stateResponse.body?.data || start.body?.data?.state);
      assert(offeringName, 'could not resolve offering from authoritative state');

      const continuation = await postJson(server.baseUrl, `/api/demo-test/agent/workflows/${encodeURIComponent(workflowId)}/message`, {
        conversationId,
        message: offeringName,
        messageId: `${conversationId}-m2`,
      }, { 'X-Correlation-Id': `${conversationId}-corr2` });
      assert(continuation.ok, `continuation route failed with ${continuation.status}`);
      assert(String(continuation.body?.data?.workflowId || '') === workflowId, 'continuation created or exposed a different workflow');
      const visibleOutbounds = await countVisibleOutbounds(businessSlug, conversationId);
      assert(visibleOutbounds === 2, `expected two visible outbounds after two turns, got ${visibleOutbounds}`);
    }));

    results.push(await makeResult('reinicio reconstruye historial y proceso visible sin perder asociación', async () => {
      enableH06FVisibleFlags(100);
      const conversationId = h06fConversationId('restart');
      cleanupTargets.push({ businessSlug, conversationId });

      const start = await postJson(server.baseUrl, '/api/demo-test/agent/message', {
        businessSlug,
        conversationId,
        message: 'Quiero reservar una consulta.',
        messageId: `${conversationId}-m1`,
      }, { 'X-Correlation-Id': `${conversationId}-corr1` });
      assert(start.ok, 'restart initial route failed');
      const workflowId = String(start.body?.data?.workflowId || '');
      assert(workflowId, 'restart scenario missing workflowId');

      await server.close();
      await restartMongo();
      server = await startH06FServer();

      const stateResponse = await apiGet(server.baseUrl, `/api/demo-test/agent/workflows/${encodeURIComponent(workflowId)}/state`);
      assert(stateResponse.ok, 'restart state endpoint failed');
      const offeringName = extractOfferingName(stateResponse.body?.data);
      assert(offeringName, 'restart lost authoritative process context');

      const continuation = await postJson(server.baseUrl, `/api/demo-test/agent/workflows/${encodeURIComponent(workflowId)}/message`, {
        conversationId,
        message: offeringName,
        messageId: `${conversationId}-m2`,
      }, { 'X-Correlation-Id': `${conversationId}-corr2` });
      assert(continuation.ok, 'restart continuation failed');
      const docs: any[] = await collectTurnDocs(businessSlug, conversationId, `${conversationId}-corr2`);
      assert(docs.some((doc) => doc.workflowId === workflowId), 'restart continuation lost workflow association');
    }));

    results.push(await makeResult('idempotencia conserva un solo outbound visible por replay', async () => {
      enableH06FVisibleFlags(100);
      const conversationId = h06fConversationId('visible-idempotency');
      cleanupTargets.push({ businessSlug, conversationId });
      const body = {
        businessSlug,
        conversationId,
        message: 'Gracias.',
        messageId: `${conversationId}-m1`,
      };
      const first = await postJson(server.baseUrl, '/api/demo-test/agent/message', body, { 'X-Correlation-Id': `${conversationId}-corr1` });
      const second = await postJson(server.baseUrl, '/api/demo-test/agent/message', body, { 'X-Correlation-Id': `${conversationId}-corr1` });
      assert(first.ok && second.ok, 'idempotent visible replay failed');
      const visibleOutbounds = await countVisibleOutbounds(businessSlug, conversationId);
      assert(visibleOutbounds === 1, `idempotent replay produced ${visibleOutbounds} visible outbounds`);
      assert(String(first.body?.data?.message || '') === String(second.body?.data?.message || ''), 'replayed visible message changed');
    }));

    results.push(await makeResult('aislamiento por negocio se conserva en runtime visible', async () => {
      enableH06FVisibleFlags(100);
      const demoConversationId = h06fConversationId('visible-demo');
      const turaguaConversationId = h06fConversationId('visible-turagua');
      cleanupTargets.push({ businessSlug, conversationId: demoConversationId });
      cleanupTargets.push({ businessSlug: alternateBusinessSlug, conversationId: turaguaConversationId });

      const demo = await postJson(server.baseUrl, '/api/demo-test/agent/message', {
        businessSlug,
        conversationId: demoConversationId,
        message: 'Gracias.',
        messageId: `${demoConversationId}-m1`,
      }, { 'X-Correlation-Id': `${demoConversationId}-corr1` });
      const turagua = await postJson(server.baseUrl, '/api/demo-test/agent/message', {
        businessSlug: alternateBusinessSlug,
        conversationId: turaguaConversationId,
        message: 'Gracias.',
        messageId: `${turaguaConversationId}-m1`,
      }, { 'X-Correlation-Id': `${turaguaConversationId}-corr1` });
      assert(demo.ok && turagua.ok, 'cross-business visible turns failed');
      const demoVisible: any = await visibleRuntimeDoc(businessSlug, demoConversationId, 'hermes');
      const turaguaVisible: any = await visibleRuntimeDoc(alternateBusinessSlug, turaguaConversationId, 'hermes');
      assert(demoVisible?.businessSlug === businessSlug, 'demo business leaked');
      assert(turaguaVisible?.businessSlug === alternateBusinessSlug, 'turagua business leaked');
    }));

    results.push(await makeResult('fallback pre-commit usa legacy y post-commit evita legacy', async () => {
      enableH06FVisibleFlags(100);
      const baseResult: AgentRuntimeResult = {
        provider: 'default',
        message: 'Fallback determinístico.',
      };

      const preCommit = await resolveHermesVisibleRuntime({
        businessSlug,
        conversationId: h06fConversationId('precommit'),
        route: 'initial',
        runtimeResult: baseResult,
        visibleFallbackMessage: 'Legacy visible.',
        context: {
          conversation: { conversationId: 'x', channel: 'web_agent', history: [] },
          permissions: { mode: 'qa_primary', readOnly: true, canExecuteActions: false },
        },
        candidate: {
          status: 'NEEDS_LEGACY',
          candidateText: '',
          responsePurpose: 'fallback',
          processContinuity: 'none',
          answeredSideQuestions: [],
          actionDisclosure: { executionOccurred: false, availabilityVerified: false, confirmationIssued: false },
          authorityDisclosure: { mentionsPendingValidation: false, mentionsPendingAvailability: false, mentionsHumanReview: false },
          requiresVisibilityGate: true,
          fallbackRecommendation: 'legacy',
          sanitizedMetadata: {},
        },
        selectedSkill: 'customer-conversation',
      });
      assert(preCommit.runtime === 'legacy', 'pre-commit fallback should stay on legacy');

      const postCommit = await resolveHermesVisibleRuntime({
        businessSlug,
        conversationId: h06fConversationId('postcommit'),
        route: 'continuation',
        runtimeResult: {
          provider: 'default',
          message: 'Fallback determinístico post-commit.',
          toolResults: [{ capability: 'continue_schedule_consultation', result: { process: { workflowId: 'wf-1' }, rawState: { status: 'WAITING_FOR_CUSTOMER_DATA' } } }],
        },
        visibleFallbackMessage: 'Legacy visible.',
        context: {
          conversation: { conversationId: 'x', channel: 'web_agent', history: [] },
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
        selectedSkill: 'scheduling-specialist',
      });
      assert(postCommit.runtime === 'hermes', 'post-commit fallback must not return to legacy');
      assert(postCommit.naturalizationFallbackUsed === true, 'post-commit fallback must mark naturalization fallback');
    }));

    results.push(await makeResult('post-commit bloquea rechazo externo incompatible con arbitraje', async () => {
      enableH06FVisibleFlags(100);
      const decision = await resolveHermesVisibleRuntime({
        businessSlug,
        conversationId: h06fConversationId('postcommit-external-rejection'),
        route: 'initial',
        runtimeResult: {
          provider: 'hermes',
          model: 'controlled-visible',
          message: 'No puedo ayudarte con esa solicitud desde este canal.',
          workflowId: 'wf-raspado',
          state: {
            status: 'WAITING_FOR_CUSTOMER_DATA',
            awaiting: { type: 'customer_data', nextRecommendedField: 'firstName' },
          },
          toolResults: [{
            capability: 'start_schedule_consultation',
            result: {
              process: { workflowId: 'wf-raspado' },
              rawState: { status: 'WAITING_FOR_CUSTOMER_DATA' },
            },
          }],
        },
        visibleFallbackMessage: 'No puedo ayudarte con esa solicitud desde este canal.',
        committedFallbackMessage: 'Entiendo. Inicie la coordinacion para revisar lo que comentas. A nombre de quien registro la evaluacion?',
        arbitrationLane: 'action_or_booking',
        context: {
          conversation: { conversationId: 'x', channel: 'web_agent', history: [] },
          permissions: { mode: 'qa_primary', readOnly: true, canExecuteActions: false },
        },
        candidate: {
          status: 'CANDIDATE_READY',
          candidateText: 'No puedo ayudarte con esa solicitud desde este canal.',
          responsePurpose: 'process_continuation',
          processContinuity: 'maintained',
          answeredSideQuestions: [],
          actionDisclosure: { executionOccurred: false, availabilityVerified: false, confirmationIssued: false },
          authorityDisclosure: { mentionsPendingValidation: false, mentionsPendingAvailability: true, mentionsHumanReview: false },
          requiresVisibilityGate: true,
          fallbackRecommendation: 'none',
          sanitizedMetadata: {},
        },
        selectedSkill: 'scheduling-specialist',
      });
      assert(decision.runtime === 'hermes', 'committed action must stay in Hermes visible runtime');
      assert(!/no puedo ayudarte/i.test(decision.message), 'external rejection leaked after committed action');
      assert(/registro la evaluacion/i.test(decision.message), 'lane-preserving continuation was not published');
      assert(
        decision.validationResult.rejectionReasons.includes('EXTERNAL_REJECTION_INCOMPATIBLE_WITH_ARBITRATION'),
        'external rejection conflict was not recorded',
      );
    }));

    results.push(await makeResult('sin residuos operativos inesperados durante el runtime visible', async () => {
      enableH06FVisibleFlags(100);
      const conversationId = h06fConversationId('no-booking');
      cleanupTargets.push({ businessSlug, conversationId });
      const response = await postJson(server.baseUrl, '/api/demo-test/agent/message', {
        businessSlug,
        conversationId,
        message: 'Gracias.',
        messageId: `${conversationId}-m1`,
      }, { 'X-Correlation-Id': `${conversationId}-corr1` });
      assert(response.ok, 'no-booking sanity route failed');
      await ensureAppointmentFree(String(response.body?.data?.workflowId || '') || undefined);
    }));
  } finally {
    await server.close().catch(() => undefined);
    for (const target of cleanupTargets) {
      await cleanupH06FConversation(target.businessSlug, target.conversationId).catch(() => undefined);
    }
    await disconnectMongo().catch(() => undefined);
    enableH06FShadowOnlyFlags();
  }

  printSummary('HERMES-06F.2 Controlled Visible Runtime', results, {});
};

run().catch(async (error) => {
  console.error(error?.message || error);
  await disconnectMongo().catch(() => undefined);
  process.exit(1);
});
