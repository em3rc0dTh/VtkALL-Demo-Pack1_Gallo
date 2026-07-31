import { CustomerInteraction } from '../../../models/CustomerInteraction.model';
import { runHermesResponseCandidateSynthesis } from '../orchestration/hermesResponseSynthesizer.service';
import { dispatchHermesSkillPlan } from '../orchestration/hermesSkillDispatch.service';
import { observeHermesReceptionDeskTurn } from '../orchestration/hermesReceptionDesk.service';
import { HermesSkillManifest } from '../contracts/hermesSkillRegistry.contract';
import { assert, cleanupRunFixtures, connectMongo, disconnectMongo, makeResult, printSummary, runId } from './h04TestUtils';
import { createH05Fixtures, enableH05TestFlags } from './h05Fixtures';

const baseConversationId = runId('hermes-h06e-synth');
const cleanupIds: string[] = [];
let cleanup: Awaited<ReturnType<typeof cleanupRunFixtures>> = {};

const runCandidate = async (suffix: string, message: string, options: {
  processState?: any;
  activeCase?: boolean;
  knownCustomer?: boolean;
  dispatchOverride?: Parameters<typeof dispatchHermesSkillPlan>[1];
  selectedSkillOverride?: any;
} = {}) => {
  const conversationId = `${baseConversationId}-${suffix}`;
  cleanupIds.push(conversationId);
  const fixtures = await createH05Fixtures(conversationId, options);
  const observed = await observeHermesReceptionDeskTurn({
    businessSlug: 'demo_test',
    conversationId,
    message,
    messageId: `${conversationId}:turn`,
    correlationId: `${conversationId}:corr`,
    processState: options.processState,
    customerId: options.knownCustomer || options.activeCase ? fixtures.customerId : undefined,
    caseId: options.activeCase ? fixtures.caseId : undefined,
    channel: 'web_agent',
  });
  const plan = options.selectedSkillOverride
    ? { ...observed.plan, selectedSkill: options.selectedSkillOverride }
    : observed.plan;
  const dispatched = await dispatchHermesSkillPlan(plan, options.dispatchOverride);
  const candidate = await runHermesResponseCandidateSynthesis({
    turnId: observed.plan.turnId,
    conversationId: observed.plan.conversationId,
    correlationId: observed.plan.correlationId,
    businessSlug: observed.plan.businessSlug,
    agentPersona: observed.context.business?.agent,
    userMessage: message,
    turnAssessment: observed.assessment,
    dispatchPlan: plan,
    skillResult: dispatched.result,
    readOnlyContext: observed.context,
    activeProcessSummary: {
      active: observed.assessment.activeProcess,
      status: observed.assessment.processStatus,
      owner: plan.activeProcessOwner,
    },
    knownFacts: {
      ...observed.assessment.knownData,
      ...plan.skillContext.relevantFacts,
    },
    sideQuestions: observed.assessment.secondaryIntents.map((intent) => ({
      type: intent.type,
      summary: intent.summary,
    })),
    language: 'es',
    businessTimezone: observed.context.business?.timezone,
    visibilityMode: 'candidate_only',
  });
  return { conversationId, observed, dispatched, candidate };
};

const run = async () => {
  await connectMongo();
  enableH05TestFlags();
  const results = [];

  try {
    results.push(await makeResult('courtesy stays brief and direct', async () => {
      const { candidate } = await runCandidate('thanks', 'Gracias.');
      assert(candidate.status === 'CANDIDATE_READY', 'courtesy should produce candidate');
      assert(candidate.responsePurpose === 'direct_response', 'courtesy should stay direct');
      assert(!candidate.pendingQuestion, 'courtesy should not ask unnecessary question');
    }));

    results.push(await makeResult('incomplete scheduling asks one minimum question', async () => {
      const { candidate } = await runCandidate('needs-input', 'Quiero agendar una evaluacion.');
      assert(candidate.status === 'NEEDS_CLARIFICATION', 'incomplete scheduling should need clarification');
      assert(/A nombre de quien deseas solicitar la cita/i.test(candidate.candidateText), 'candidate should ask one minimum question');
      assert(candidate.actionDisclosure.executionOccurred === false, 'no execution should be disclosed');
    }));

    results.push(await makeResult('preference without authority remains pending validation', async () => {
      const { candidate } = await runCandidate('preference', 'Quiero manana a las cuatro.');
      assert(candidate.status === 'NEEDS_CLARIFICATION', 'preference alone should still need input');
      assert(/Ya registre tu preferencia/i.test(candidate.candidateText), 'candidate should acknowledge preference');
      assert(candidate.authorityDisclosure.mentionsPendingAvailability === true, 'candidate must keep availability pending');
    }));

    results.push(await makeResult('side question is composed with continuity and next question', async () => {
      const { candidate } = await runCandidate(
        'side-question',
        'Quiero manana a las cuatro. Cuanto dura la evaluacion?'
      );
      assert(/duracion depende/i.test(candidate.candidateText), 'candidate should answer side question safely');
      assert(/Ya registre tu preferencia/i.test(candidate.candidateText), 'candidate should keep process continuity');
      assert(Boolean(candidate.pendingQuestion), 'candidate should still ask next minimum question');
    }));

    results.push(await makeResult('active process keeps authoritative offering question over specialist drift', async () => {
      const { candidate } = await runCandidate(
        'authoritative-offering',
        'Quiero un lomo saltado.',
        {
          processState: {
            status: 'WAITING_FOR_SERVICE_SELECTION',
            awaiting: { type: 'offering_selection', nextRecommendedField: 'catalogOfferingId' },
          },
          dispatchOverride: {
            executeSkill: async ({ manifest }) => {
              if (manifest.id !== 'scheduling-specialist') {
                return {
                  status: 'NEEDS_INPUT',
                  summary: 'fallback',
                  missingData: [],
                  fallbackUsed: false,
                  ownerRetainedByHermes: true,
                  actionExecutionAllowed: false,
                };
              }
              return {
                status: 'NEEDS_INPUT',
                summary: 'drifted specialist prompt',
                missingData: ['customer_identity'],
                fallbackUsed: false,
                ownerRetainedByHermes: true,
                actionExecutionAllowed: false,
                details: {
                  prioritizedMissingField: 'customer_identity',
                  nextQuestion: 'A nombre de quien deseas solicitar la cita?',
                },
              };
            },
          },
        }
      );
      assert(/Consulta basica H05/i.test(candidate.candidateText), 'candidate must mention available service naturally');
      assert(/Cual te interesa/i.test(candidate.candidateText), 'candidate must ask for service choice naturally');
      assert(!/A nombre de quien deseas solicitar la cita/i.test(candidate.candidateText), 'candidate must not leak drifted customer prompt');
    }));

    results.push(await makeResult('greeting during offering selection stays warm and catalog-led', async () => {
      const { candidate } = await runCandidate(
        'greeting-offering',
        'Holaaaaaaaaaaaaaaaaaaaaaaa',
        {
          processState: {
            status: 'WAITING_FOR_SERVICE_SELECTION',
            awaiting: { type: 'offering_selection', nextRecommendedField: 'catalogOfferingId' },
          },
        }
      );
      assert(/Hola, aqui estoy contigo/i.test(candidate.candidateText), 'candidate should greet warmly');
      assert(/Consulta basica H05/i.test(candidate.candidateText), 'candidate should surface catalog naturally');
      assert(!/Que servicio deseas solicitar/i.test(candidate.candidateText), 'candidate should avoid robotic prompt');
    }));

    results.push(await makeResult('catalog question during offering selection answers catalog before resuming', async () => {
      const { candidate } = await runCandidate(
        'catalog-offering',
        'Que servicios tienen?',
        {
          processState: {
            status: 'WAITING_FOR_SERVICE_SELECTION',
            awaiting: { type: 'offering_selection', nextRecommendedField: 'catalogOfferingId' },
          },
        }
      );
      assert(/Consulta basica H05/i.test(candidate.candidateText), 'candidate should answer with real catalog');
      assert(/dura aprox|te ayudo a agendarlo|Cual te interesa/i.test(candidate.candidateText), 'candidate should stay conversational');
    }));

    results.push(await makeResult('action proposal is not worded as reservation', async () => {
      const { candidate } = await runCandidate(
        'proposal',
        'Quiero agendar la Consulta basica H05 para Toyota 2019 manana a las cuatro. Mi telefono es 999111222.',
        { knownCustomer: true }
      );
      assert(candidate.status === 'CANDIDATE_READY', 'proposal should produce ready candidate');
      assert(candidate.responsePurpose === 'proposal_disclosure', 'candidate should disclose proposal state');
      assert(!/reservad|confirmad/i.test(candidate.candidateText), 'candidate must not claim reservation or confirmation');
    }));

    results.push(await makeResult('timeout recommends safe legacy fallback', async () => {
      const timeoutRegistry: HermesSkillManifest[] = [{
        id: 'customer-conversation',
        version: '1.0.1-timeout',
        description: 'Timeout test skill',
        supportedIntents: ['conversation'],
        acceptedDecisions: ['RESPOND_DIRECTLY'],
        requiredFields: [],
        timeoutMs: 5,
        fallbackStrategy: 'safe_direct_owner',
        permissions: {
          readAuthority: true,
          proposeActions: false,
          executionAllowed: false,
        },
        ownerPriority: 'primary',
      }];
      const { candidate } = await runCandidate('timeout', 'Gracias.', {
        dispatchOverride: {
          registry: timeoutRegistry,
          executeSkill: async () => {
            await new Promise((resolve) => setTimeout(resolve, 20));
            return {
              status: 'ANSWER_READY',
              summary: 'late result',
              fallbackUsed: false,
              ownerRetainedByHermes: true,
              actionExecutionAllowed: false,
            };
          },
        },
      });
      assert(candidate.status === 'NEEDS_LEGACY', 'timeout should recommend legacy fallback');
      assert(candidate.fallbackRecommendation === 'legacy', 'timeout should recommend legacy');
    }));

    results.push(await makeResult('unknown skill never leaks internal identifier', async () => {
      const { candidate } = await runCandidate('unknown-skill', 'Hola.', {
        selectedSkillOverride: 'skill-que-no-existe',
      });
      assert(candidate.status === 'ESCALATION_REQUIRED', 'unknown skill should safely escalate');
      assert(!/skill-que-no-existe/i.test(candidate.candidateText), 'candidate must not leak unknown skill identifier');
    }));

    results.push(await makeResult('candidate persists separately from visible outbound', async () => {
      const { conversationId } = await runCandidate('persisted', 'Quiero agendar una evaluacion.');
      const candidateDoc = await CustomerInteraction.countDocuments({
        businessSlug: 'demo_test',
        conversationId,
        visibility: 'internal',
        interactionType: 'system_event',
        'metadata.runtimeMode': 'response_candidate_synthesizer',
      });
      const visibleDoc = await CustomerInteraction.countDocuments({
        businessSlug: 'demo_test',
        conversationId,
        visibility: 'customer',
        'participant.runtime': 'hermes',
      });
      assert(candidateDoc === 1, 'candidate should persist internally once');
      assert(visibleDoc === 0, 'candidate persistence must not create visible outbound');
    }));
  } finally {
    for (const id of cleanupIds) cleanup = await cleanupRunFixtures(id);
    await disconnectMongo();
  }

  printSummary('HERMES-06E Response Synthesizer', results, cleanup);
};

run().catch(async (error) => {
  console.error(error);
  await disconnectMongo().catch(() => undefined);
  process.exit(1);
});
