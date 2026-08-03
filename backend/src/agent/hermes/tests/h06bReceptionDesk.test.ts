import { CustomerInteraction } from '../../../models/CustomerInteraction.model';
import { observeHermesReceptionDeskTurn } from '../orchestration/hermesReceptionDesk.service';
import { assert, cleanupRunFixtures, connectMongo, disconnectMongo, makeResult, printSummary, runId } from './h04TestUtils';
import { createH05Fixtures, enableH05TestFlags } from './h05Fixtures';

const baseConversationId = runId('hermes-h06b-desk');
const cleanupIds: string[] = [];
let cleanup: Awaited<ReturnType<typeof cleanupRunFixtures>> = {};

const runObservation = async (suffix: string, message: string, options: {
  processState?: any;
  activeCase?: boolean;
  knownCustomer?: boolean;
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
  return { conversationId, fixtures, observed };
};

const run = async () => {
  await connectMongo();
  enableH05TestFlags();
  const results = [];

  try {
    results.push(await makeResult('multi-intent booking with side questions', async () => {
      const { observed } = await runObservation(
        'multi-intent',
        'Quiero una cita para el 21 de julio de 2026, pero antes dime cuanto cuesta y si trabajan con hibridos.'
      );
      assert(observed.plan.decision === 'PROPOSE_ACTION', 'expected PROPOSE_ACTION for operational primary intent');
      assert(observed.plan.selectedSkill === 'scheduling-specialist', 'expected scheduling-specialist as owner skill');
      assert(observed.assessment.primaryIntent.type === 'start_booking', 'expected booking as primary intent');
      assert(observed.assessment.secondaryIntents.some((intent) => intent.type === 'price'), 'price question not preserved');
      assert(observed.assessment.secondaryIntents.some((intent) => intent.type === 'compatibility'), 'compatibility question not preserved');
      assert(observed.plan.actionAllowed === false, 'actionAllowed must remain false in H06B');
    }));

    results.push(await makeResult('active process stays with scheduling owner', async () => {
      const { observed } = await runObservation('active-process', 'A las 4.', {
        processState: {
          status: 'WAITING_FOR_SLOT_SELECTION',
        },
      });
      assert(observed.plan.decision === 'CONTINUE_ACTIVE_PROCESS', 'active process did not remain with active owner');
      assert(observed.plan.selectedSkill === 'scheduling-specialist', 'active process should stay with scheduling-specialist');
      assert(observed.plan.activeProcessOwner === 'scheduling-specialist', 'owner skill missing');
    }));

    results.push(await makeResult('explicit correction is preserved', async () => {
      const { observed } = await runObservation('correction', 'Mi auto es Toyota 2018. Perdon, es del 2019.');
      assert(observed.assessment.corrections.some((item) =>
        item.field === 'managedEntityYear' && item.previousValue === '2018' && item.nextValue === '2019'
      ), 'explicit year correction was not captured');
    }));

    results.push(await makeResult('thanks resolves directly', async () => {
      const { observed } = await runObservation('thanks', 'Gracias.');
      assert(observed.plan.decision === 'RESPOND_DIRECTLY', 'thanks should be direct response');
      assert(observed.plan.selectedSkill === 'customer-conversation', 'thanks should stay in customer-conversation');
    }));

    results.push(await makeResult('ambiguous request asks for information', async () => {
      const { observed } = await runObservation('ambiguous', 'Quiero una revision.');
      assert(observed.plan.decision === 'ASK_FOR_INFORMATION', 'ambiguous request should ask for clarification');
      assert(observed.plan.nextBehavior === 'ask_next_question', 'ambiguous request should ask next question');
    }));

    results.push(await makeResult('dispatch plan persists as internal sanitized micro-stop', async () => {
      const { conversationId } = await runObservation('persisted', 'Mi telefono es 999999999 y tambien trabajan sabados?', {
        processState: {
          status: 'WAITING_FOR_CUSTOMER_DATA',
          awaiting: { nextRecommendedField: 'phone' },
        },
      });
      const persisted: any = await CustomerInteraction.findOne({
        businessSlug: 'demo_test',
        conversationId,
        visibility: 'internal',
        interactionType: 'system_event',
        'metadata.runtimeMode': 'reception_desk_orchestrator',
      }).lean().exec();
      assert(Boolean(persisted), 'dispatch plan was not persisted');
      assert(persisted.metadata?.decision, 'dispatch decision missing from metadata');
      assert(persisted.metadata?.selectedSkill, 'selected skill missing from metadata');
      assert(persisted.metadata?.phonePresent === true, 'sanitized phone presence missing');
      assert(!JSON.stringify(persisted.metadata || {}).includes('999999999'), 'raw phone leaked into persisted metadata');
    }));
  } finally {
    for (const id of cleanupIds) cleanup = await cleanupRunFixtures(id);
    await disconnectMongo();
  }

  printSummary('HERMES-06B Reception Desk Orchestrator', results, cleanup);
};

run().catch(async (error) => {
  console.error(error);
  await disconnectMongo().catch(() => undefined);
  process.exit(1);
});
