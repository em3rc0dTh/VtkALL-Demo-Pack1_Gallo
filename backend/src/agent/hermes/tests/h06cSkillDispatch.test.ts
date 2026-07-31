import { CustomerInteraction } from '../../../models/CustomerInteraction.model';
import { dispatchHermesSkillPlan } from '../orchestration/hermesSkillDispatch.service';
import { observeHermesReceptionDeskTurn } from '../orchestration/hermesReceptionDesk.service';
import { HermesSkillManifest } from '../contracts/hermesSkillRegistry.contract';
import { assert, cleanupRunFixtures, connectMongo, disconnectMongo, makeResult, printSummary, runId } from './h04TestUtils';
import { createH05Fixtures, enableH05TestFlags } from './h05Fixtures';

const baseConversationId = runId('hermes-h06c-dispatch');
const cleanupIds: string[] = [];
let cleanup: Awaited<ReturnType<typeof cleanupRunFixtures>> = {};

const runDispatch = async (suffix: string, message: string, options: {
  processState?: any;
  activeCase?: boolean;
  knownCustomer?: boolean;
  autoDispatch?: boolean;
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
  const dispatched = options.autoDispatch === false ? undefined : await dispatchHermesSkillPlan(observed.plan);
  return { conversationId, fixtures, observed, dispatched };
};

const run = async () => {
  await connectMongo();
  enableH05TestFlags();
  const results = [];

  try {
    results.push(await makeResult('direct conversational response stays internal and typed', async () => {
      const { dispatched } = await runDispatch('thanks', 'Gracias.');
      assert(Boolean(dispatched), 'dispatch result missing');
      const dispatch = dispatched!;
      assert(dispatch.manifest?.id === 'customer-conversation', 'thanks should remain in customer-conversation');
      assert(dispatch.result.status === 'ANSWER_READY', 'thanks should resolve as ANSWER_READY');
      assert(dispatch.result.actionExecutionAllowed === false, 'execution must stay disabled');
    }));

    results.push(await makeResult('informational turn uses catalog advisor with minimal projection', async () => {
      const { conversationId, dispatched } = await runDispatch('catalog', 'Cuanto cuesta la evaluacion?');
      assert(Boolean(dispatched), 'dispatch result missing');
      const dispatch = dispatched!;
      assert(dispatch.manifest?.id === 'catalog-advisor', 'price question should route to catalog-advisor');
      assert(
        dispatch.result.status === 'ANSWER_READY' || dispatch.result.status === 'NEEDS_INPUT',
        'catalog-advisor must return typed informational result'
      );
      const invocation: any = await CustomerInteraction.findOne({
        businessSlug: 'demo_test',
        conversationId,
        visibility: 'internal',
        interactionType: 'system_event',
        'metadata.runtimeMode': 'skill_dispatch_registry',
        'metadata.skillId': 'catalog-advisor',
      }).lean().exec();
      assert(Boolean(invocation), 'catalog invocation must persist');
      assert(!JSON.stringify(invocation.metadata || {}).includes('999999999'), 'raw phone leaked into projected context');
    }));

    results.push(await makeResult('scheduling specialist returns needs input without executing actions', async () => {
      const { dispatched } = await runDispatch('scheduling', 'Quiero una cita manana.');
      assert(Boolean(dispatched), 'dispatch result missing');
      const dispatch = dispatched!;
      assert(dispatch.manifest?.id === 'scheduling-specialist', 'booking turn should route to scheduling-specialist');
      assert(dispatch.result.status === 'NEEDS_INPUT', 'incomplete scheduling should request more data');
      assert(dispatch.result.actionExecutionAllowed === false, 'scheduling specialist must not execute actions in H06C');
    }));

    results.push(await makeResult('active process preserves scheduling ownership', async () => {
      const { observed, dispatched } = await runDispatch('active-process', 'A las 4.', {
        processState: {
          status: 'WAITING_FOR_SLOT_SELECTION',
        },
      });
      assert(Boolean(dispatched), 'dispatch result missing');
      const dispatch = dispatched!;
      assert(observed.plan.decision === 'CONTINUE_ACTIVE_PROCESS', 'active process decision mismatch');
      assert(observed.plan.activeProcessOwner === 'scheduling-specialist', 'owner must remain scheduling-specialist');
      assert(
        dispatch.result.status === 'ACTION_PROPOSAL' || dispatch.result.status === 'NEEDS_INPUT',
        'active process must remain typed under scheduling specialist'
      );
    }));

    results.push(await makeResult('unknown skill falls back safely', async () => {
      const { observed } = await runDispatch('unknown', 'Hola.');
      const dispatched = await dispatchHermesSkillPlan({
        ...observed.plan,
        selectedSkill: 'scheduling-companion-that-does-not-exist' as any,
      });
      assert(dispatched.result.status === 'CANNOT_HANDLE', 'unknown skill must fall back safely');
      assert(dispatched.result.fallbackUsed === true, 'unknown skill must mark fallback');
    }));

    results.push(await makeResult('timeout returns typed timed out result', async () => {
      const { observed } = await runDispatch('timeout', 'Gracias.', { autoDispatch: false });
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
      const dispatched = await dispatchHermesSkillPlan(observed.plan, {
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
      });
      assert(dispatched.result.status === 'TIMED_OUT', 'timeout must produce TIMED_OUT');
      assert(dispatched.result.fallbackUsed === true, 'timeout must use fallback');
      assert(dispatched.result.error?.code === 'SKILL_TIMEOUT', 'timeout code missing');
    }));
  } finally {
    for (const id of cleanupIds) cleanup = await cleanupRunFixtures(id);
    await disconnectMongo();
  }

  printSummary('HERMES-06C Skill Registry & Dispatch', results, cleanup);
};

run().catch(async (error) => {
  console.error(error);
  await disconnectMongo().catch(() => undefined);
  process.exit(1);
});
