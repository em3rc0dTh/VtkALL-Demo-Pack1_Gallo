import { Appointment } from '../../../models/Appointment.model';
import { ResourceReservation } from '../../../models/ResourceReservation.model';
import { CustomerInteraction } from '../../../models/CustomerInteraction.model';
import { observeHermesReceptionDeskTurn } from '../orchestration/hermesReceptionDesk.service';
import { dispatchHermesSkillPlan, getHermesSkillRegistry } from '../orchestration/hermesSkillDispatch.service';
import { runHermesResponseCandidateSynthesis } from '../orchestration/hermesResponseSynthesizer.service';
import type { HermesSkillManifest } from '../contracts/hermesSkillRegistry.contract';
import {
  assert,
  connectMongo,
  disconnectMongo,
  makeResult,
  printSummary,
} from './h04TestUtils';
import {
  apiGet,
  apiPost,
  assertNoDtoLeak,
  cleanupH06FConversation,
  collectTurnDocs,
  countVisibleOutbounds,
  enableH06FShadowOnlyFlags,
  ensureAppointmentFree,
  extractOfferingName,
  h06fConversationId,
  restartMongo,
  startH06FServer,
  summarizeTurnArtifacts,
} from './h06fFixtures';

const businessSlug = 'demo_test';
const alternateBusinessSlug = 'turagua';
const cleanupTargets: Array<{ businessSlug: string; conversationId: string }> = [];

const snapshotTurn = async (input: {
  baseUrl: string;
  conversationId: string;
  message: string;
  messageId: string;
  correlationId: string;
  workflowId?: string;
  businessSlug?: string;
}) => {
  const beforeVisible = await countVisibleOutbounds(input.businessSlug || businessSlug, input.conversationId);
  const response = input.workflowId
    ? await apiPost(
      input.baseUrl,
      `/api/demo-test/agent/workflows/${encodeURIComponent(input.workflowId)}/message`,
      {
        conversationId: input.conversationId,
        message: input.message,
        messageId: input.messageId,
      },
      { 'X-Correlation-Id': input.correlationId }
    )
    : await apiPost(
      input.baseUrl,
      '/api/demo-test/agent/message',
      {
        businessSlug: input.businessSlug || businessSlug,
        conversationId: input.conversationId,
        message: input.message,
        messageId: input.messageId,
      },
      { 'X-Correlation-Id': input.correlationId }
    );
  const afterVisible = await countVisibleOutbounds(input.businessSlug || businessSlug, input.conversationId);
  return {
    response,
    visibleDelta: afterVisible - beforeVisible,
    artifacts: await summarizeTurnArtifacts(input.businessSlug || businessSlug, input.conversationId, input.correlationId),
  };
};

const run = async () => {
  enableH06FShadowOnlyFlags();
  await connectMongo();
  const results = [];
  let server = await startH06FServer();

  try {
    results.push(await makeResult('cortesia por ruta inicial mantiene legacy visible y artefactos internos', async () => {
      const conversationId = h06fConversationId('courtesy');
      cleanupTargets.push({ businessSlug, conversationId });
      const messageId = `${conversationId}-m1`;
      const correlationId = `${conversationId}-corr1`;
      const turn = await snapshotTurn({
        baseUrl: server.baseUrl,
        conversationId,
        message: 'Gracias.',
        messageId,
        correlationId,
      });
      assert(turn.response.ok, `initial courtesy route failed with ${turn.response.status}`);
      assert(turn.visibleDelta === 1, 'courtesy turn produced more than one visible outbound');
      assertNoDtoLeak(turn.response.body?.data);
      assert(turn.artifacts.inbound === 1, 'courtesy inbound artifact missing');
      assert(turn.artifacts.dispatchPlans === 1, 'courtesy dispatch plan missing');
      assert(turn.artifacts.skillInvocations === 1, 'courtesy skill invocation missing');
      assert(turn.artifacts.skillResults === 1, 'courtesy skill result missing');
      assert(turn.artifacts.responseCandidates === 1, 'courtesy response candidate missing');
      assert(turn.artifacts.visibleOutbound <= 1, 'courtesy exceeded visible outbound limit');
      assert(turn.artifacts.leakedInternalVisible === false, 'courtesy leaked internal artifacts to public history');
      const planDoc: any = turn.artifacts.docs.find((doc: any) => doc?.metadata?.runtimeMode === 'reception_desk_orchestrator');
      assert(planDoc?.metadata?.decision === 'RESPOND_DIRECTLY', 'courtesy did not map to RESPOND_DIRECTLY');
    }));

    results.push(await makeResult('duplicado idempotente no duplica artefactos ni outbounds visibles', async () => {
      const conversationId = h06fConversationId('idempotency');
      cleanupTargets.push({ businessSlug, conversationId });
      const messageId = `${conversationId}-m1`;
      const correlationId = `${conversationId}-corr1`;
      const first = await snapshotTurn({
        baseUrl: server.baseUrl,
        conversationId,
        message: 'Gracias.',
        messageId,
        correlationId,
      });
      const second = await snapshotTurn({
        baseUrl: server.baseUrl,
        conversationId,
        message: 'Gracias.',
        messageId,
        correlationId,
      });
      assert(first.response.ok && second.response.ok, 'idempotent replay failed');
      assert(second.visibleDelta === 0, 'idempotent replay created another visible outbound');
      const docs = await collectTurnDocs(businessSlug, conversationId, correlationId);
      assert(docs.length === first.artifacts.docs.length, 'idempotent replay duplicated internal artifacts');
    }));

    results.push(await makeResult('flujo real inicial y de continuidad conserva workflow y sombra interna', async () => {
      const conversationId = h06fConversationId('schedule');
      cleanupTargets.push({ businessSlug, conversationId });

      const start = await snapshotTurn({
        baseUrl: server.baseUrl,
        conversationId,
        message: 'Quiero reservar una consulta.',
        messageId: `${conversationId}-m1`,
        correlationId: `${conversationId}-corr1`,
      });
      assert(start.response.ok, `schedule start failed with ${start.response.status}`);
      assert(start.visibleDelta === 1, 'schedule start produced more than one visible outbound');
      assertNoDtoLeak(start.response.body?.data);
      const workflowId = String(start.response.body?.data?.workflowId || '');
      assert(workflowId, 'schedule start did not return workflowId');
      const stateResponse = await apiGet(server.baseUrl, `/api/demo-test/agent/workflows/${encodeURIComponent(workflowId)}/state`);
      assert(stateResponse.ok, 'workflow state endpoint failed');
      const offeringName = extractOfferingName(stateResponse.body?.data || start.response.body?.data?.state);
      assert(offeringName, 'could not resolve authoritative offering name from workflow state');
      const startPlan: any = start.artifacts.docs.find((doc: any) => doc?.metadata?.runtimeMode === 'reception_desk_orchestrator');
      assert(startPlan?.metadata?.selectedSkill === 'scheduling-specialist', 'start did not delegate to scheduling-specialist');

      const selectService = await snapshotTurn({
        baseUrl: server.baseUrl,
        conversationId,
        workflowId,
        message: offeringName,
        messageId: `${conversationId}-m2`,
        correlationId: `${conversationId}-corr2`,
      });
      assert(selectService.response.ok, 'service selection workflow turn failed');
      assert(selectService.visibleDelta === 1, 'service selection produced more than one visible outbound');
      assertNoDtoLeak(selectService.response.body?.data);

      const customerData = await snapshotTurn({
        baseUrl: server.baseUrl,
        conversationId,
        workflowId,
        message: 'Soy Ricardo Perez y mi telefono es 999999999.',
        messageId: `${conversationId}-m3`,
        correlationId: `${conversationId}-corr3`,
      });
      assert(customerData.response.ok, 'customer data workflow turn failed');
      assert(customerData.visibleDelta === 1, 'customer data produced more than one visible outbound');
      assertNoDtoLeak(customerData.response.body?.data);

      await server.close();
      await restartMongo();
      server = await startH06FServer();

      const dateTurn = await snapshotTurn({
        baseUrl: server.baseUrl,
        conversationId,
        workflowId,
        message: 'Mañana.',
        messageId: `${conversationId}-m4`,
        correlationId: `${conversationId}-corr4`,
      });
      assert(dateTurn.response.ok, 'date workflow turn failed after restart');
      assert(dateTurn.visibleDelta === 1, 'date workflow turn produced more than one visible outbound');
      assertNoDtoLeak(dateTurn.response.body?.data);
      const datePlan: any = dateTurn.artifacts.docs.find((doc: any) => doc?.metadata?.runtimeMode === 'reception_desk_orchestrator');
      assert(datePlan?.metadata?.selectedSkill === 'scheduling-specialist', 'date turn lost scheduling ownership');

      const hybridTurn = await snapshotTurn({
        baseUrl: server.baseUrl,
        conversationId,
        workflowId,
        message: 'A las cuatro. ¿También atienden los sábados?',
        messageId: `${conversationId}-m5`,
        correlationId: `${conversationId}-corr5`,
      });
      assert(hybridTurn.response.ok, 'hybrid workflow turn failed');
      assert(hybridTurn.visibleDelta === 1, 'hybrid workflow turn produced more than one visible outbound');
      const hybridCandidate: any = hybridTurn.artifacts.docs.find((doc: any) => doc?.metadata?.runtimeMode === 'response_candidate_synthesizer');
      assert(
        hybridCandidate?.metadata?.answeredSideQuestions?.includes('unknown')
        || hybridCandidate?.metadata?.answeredSideQuestions?.includes('duration')
        || hybridCandidate?.metadata?.answeredSideQuestions?.includes('business_information')
        || hybridCandidate?.metadata?.answeredSideQuestions?.includes('compatibility'),
        'hybrid turn did not persist side-question metadata'
      );

      const correctionTurn = await snapshotTurn({
        baseUrl: server.baseUrl,
        conversationId,
        workflowId,
        message: 'Es un Toyota del 2018. Perdón, del 2019.',
        messageId: `${conversationId}-m6`,
        correlationId: `${conversationId}-corr6`,
      });
      assert(correctionTurn.response.ok, 'correction workflow turn failed');

      const history = await CustomerInteraction.find({
        businessSlug,
        conversationId,
        visibility: 'customer',
      }).lean().exec();
      assert(!history.some((doc: any) => /response candidate|dispatch plan|skill result|skill invocation/i.test(String(doc.body || ''))), 'visible history leaked shadow artifacts');
      await ensureAppointmentFree(workflowId);
    }));

    results.push(await makeResult('dos conversaciones simultaneas mantienen correlacion y aislamiento', async () => {
      const conversationA = h06fConversationId('parallel-a');
      const conversationB = h06fConversationId('parallel-b');
      cleanupTargets.push({ businessSlug, conversationId: conversationA });
      cleanupTargets.push({ businessSlug, conversationId: conversationB });
      const [a, b] = await Promise.all([
        snapshotTurn({
          baseUrl: server.baseUrl,
          conversationId: conversationA,
          message: 'Gracias.',
          messageId: `${conversationA}-m1`,
          correlationId: `${conversationA}-corr1`,
        }),
        snapshotTurn({
          baseUrl: server.baseUrl,
          conversationId: conversationB,
          message: 'Quiero reservar una consulta.',
          messageId: `${conversationB}-m1`,
          correlationId: `${conversationB}-corr1`,
        }),
      ]);
      assert(a.response.ok && b.response.ok, 'parallel turns failed');
      assert(a.artifacts.docs.every((doc: any) => doc.conversationId === conversationA), 'parallel A leaked conversation B data');
      assert(b.artifacts.docs.every((doc: any) => doc.conversationId === conversationB), 'parallel B leaked conversation A data');
      assert(a.artifacts.docs.every((doc: any) => doc.execution?.correlationId === `${conversationA}-corr1`), 'parallel A correlation mismatch');
      assert(b.artifacts.docs.every((doc: any) => doc.execution?.correlationId === `${conversationB}-corr1`), 'parallel B correlation mismatch');
    }));

    results.push(await makeResult('dos negocios mantienen aislamiento por businessSlug', async () => {
      const primaryConversationId = h06fConversationId('business-demo');
      const alternateConversationId = h06fConversationId('business-turagua');
      cleanupTargets.push({ businessSlug, conversationId: primaryConversationId });
      cleanupTargets.push({ businessSlug: alternateBusinessSlug, conversationId: alternateConversationId });

      const primary = await snapshotTurn({
        baseUrl: server.baseUrl,
        conversationId: primaryConversationId,
        message: 'Gracias.',
        messageId: `${primaryConversationId}-m1`,
        correlationId: `${primaryConversationId}-corr1`,
        businessSlug,
      });
      const alternate = await snapshotTurn({
        baseUrl: server.baseUrl,
        conversationId: alternateConversationId,
        message: 'Gracias.',
        messageId: `${alternateConversationId}-m1`,
        correlationId: `${alternateConversationId}-corr1`,
        businessSlug: alternateBusinessSlug,
      });
      assert(primary.response.ok && alternate.response.ok, 'cross-business turns failed');
      assert(primary.artifacts.docs.every((doc: any) => doc.businessSlug === businessSlug), 'primary business leaked alternate slug');
      assert(alternate.artifacts.docs.every((doc: any) => doc.businessSlug === alternateBusinessSlug), 'alternate business leaked primary slug');
    }));

    results.push(await makeResult('timeout y skill desconocido degradan a fallback seguro sin filtrar internals', async () => {
      const timeoutConversationId = h06fConversationId('fault-timeout');
      const unknownConversationId = h06fConversationId('fault-unknown');
      cleanupTargets.push({ businessSlug, conversationId: timeoutConversationId });
      cleanupTargets.push({ businessSlug, conversationId: unknownConversationId });

      const observedTimeout = await observeHermesReceptionDeskTurn({
        businessSlug,
        conversationId: timeoutConversationId,
        message: 'Quiero agendar una consulta mañana.',
        messageId: `${timeoutConversationId}-m1`,
        correlationId: `${timeoutConversationId}-corr1`,
      });

      const timeoutRegistry = getHermesSkillRegistry().map((manifest) =>
        manifest.id === 'scheduling-specialist'
          ? { ...manifest, timeoutMs: 5 }
          : manifest
      ) as HermesSkillManifest[];
      const timedOut = await dispatchHermesSkillPlan(observedTimeout.plan, {
        registry: timeoutRegistry,
        executeSkill: async ({ manifest }) => {
          if (manifest.id !== 'scheduling-specialist') {
            return {
              status: 'ANSWER_READY',
              summary: 'ok',
              fallbackUsed: false,
              ownerRetainedByHermes: true,
              actionExecutionAllowed: false,
            };
          }
          await new Promise((resolve) => setTimeout(resolve, 20));
          return {
            status: 'ANSWER_READY',
            summary: 'late',
            fallbackUsed: false,
            ownerRetainedByHermes: true,
            actionExecutionAllowed: false,
          };
        },
      });
      assert(timedOut.result.status === 'TIMED_OUT', 'timeout did not produce TIMED_OUT');
      const timeoutCandidate = await runHermesResponseCandidateSynthesis({
        turnId: observedTimeout.plan.turnId,
        conversationId: timeoutConversationId,
        correlationId: `${timeoutConversationId}-corr1`,
        businessSlug,
        userMessage: 'Quiero agendar una consulta mañana.',
        turnAssessment: observedTimeout.assessment,
        dispatchPlan: observedTimeout.plan,
        skillResult: timedOut.result,
        activeProcessSummary: {
          active: observedTimeout.assessment.activeProcess,
          status: observedTimeout.assessment.processStatus,
          owner: observedTimeout.plan.activeProcessOwner,
        },
        knownFacts: {},
        sideQuestions: [],
        language: 'es',
        businessTimezone: 'America/Lima',
        visibilityMode: 'candidate_only',
      });
      assert(timeoutCandidate.status === 'NEEDS_LEGACY', 'timeout did not degrade to legacy fallback candidate');

      const observedUnknown = await observeHermesReceptionDeskTurn({
        businessSlug,
        conversationId: unknownConversationId,
        message: 'Es un Toyota del 2018. Perdón, del 2019.',
        messageId: `${unknownConversationId}-m1`,
        correlationId: `${unknownConversationId}-corr1`,
      });
      assert(
        observedUnknown.assessment.corrections.some((item) => item.previousValue === '2018' && item.nextValue === '2019'),
        'correction assessment did not preserve replacement evidence'
      );

      const unknownPlan = { ...observedUnknown.plan, selectedSkill: 'unknown-skill' as any };
      const unknown = await dispatchHermesSkillPlan(unknownPlan);
      assert(unknown.result.status === 'CANNOT_HANDLE', 'unknown skill did not remain in safe fallback');
      const unknownCandidate = await runHermesResponseCandidateSynthesis({
        turnId: observedUnknown.plan.turnId,
        conversationId: unknownConversationId,
        correlationId: `${unknownConversationId}-corr1`,
        businessSlug,
        userMessage: 'Es un Toyota del 2018. Perdón, del 2019.',
        turnAssessment: observedUnknown.assessment,
        dispatchPlan: unknownPlan,
        skillResult: unknown.result,
        activeProcessSummary: {
          active: observedUnknown.assessment.activeProcess,
          status: observedUnknown.assessment.processStatus,
          owner: observedUnknown.plan.activeProcessOwner,
        },
        knownFacts: {},
        sideQuestions: [],
        language: 'es',
        businessTimezone: 'America/Lima',
        visibilityMode: 'candidate_only',
      });
      assert(unknownCandidate.status === 'ESCALATION_REQUIRED', 'unknown skill did not synthesize safe escalation');
      assert(!/unknown-skill|scheduling-specialist|catalog-advisor/i.test(unknownCandidate.candidateText), 'unknown skill leaked internal names');
      assert(unknown.result.actionExecutionAllowed === false, 'unknown skill enabled action execution');
    }));

    results.push(await makeResult('sin booking real ni doble outbound tras todo el recorrido', async () => {
      const reservations = await ResourceReservation.countDocuments({ workflowId: /^schedule-consultation-/ });
      const appointments = await Appointment.countDocuments({ resourceReservationId: /^schedule-consultation-/ });
      assert(reservations >= 0 && appointments >= 0, 'booking verification query failed');
      const visibleViolations = await CustomerInteraction.countDocuments({
        conversationId: /^hermes-h06f-/,
        direction: 'outbound',
        visibility: 'customer',
        body: /Hermes dispatch plan|Hermes skill invocation|Hermes skill result|Hermes response candidate/i,
      });
      assert(visibleViolations === 0, 'public history contains internal Hermes artifacts');
    }));
  } finally {
    await server.close().catch(() => undefined);
    for (const target of cleanupTargets) {
      await cleanupH06FConversation(target.businessSlug, target.conversationId).catch(() => undefined);
    }
    await disconnectMongo().catch(() => undefined);
  }

  printSummary('HERMES-06F.1 Pipeline E2E Shadow-Only', results, {});
};

run().catch(async (error) => {
  console.error(error?.message || error);
  await disconnectMongo().catch(() => undefined);
  process.exit(1);
});
