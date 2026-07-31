import { CustomerInteraction } from '../../../models/CustomerInteraction.model';
import { getVisibleConversationHistory } from '../../../services/agentConversation.service';
import { runHermesQaPrimaryTurn } from '../routing/hermesQaPrimary.service';
import { assert, cleanupRunFixtures, connectMongo, disconnectMongo, makeResult, printSummary, runId } from './h04TestUtils';
import { createH05Fixtures, enableH05TestFlags } from './h05Fixtures';
import { GroundedHermesClient } from './h05TestClients';

const conversationId = runId('hermes-h05-visible');
let cleanup: Awaited<ReturnType<typeof cleanupRunFixtures>> = {};

const run = async () => {
  await connectMongo();
  enableH05TestFlags();
  await createH05Fixtures(conversationId);
  const client = new GroundedHermesClient();
  let legacyCalls = 0;
  const results = [];

  try {
    const result = await runHermesQaPrimaryTurn({
      businessSlug: 'demo_test',
      conversationId,
      message: 'Que servicios tienen?',
      messageId: `${conversationId}:turn-1`,
    }, async () => {
      legacyCalls += 1;
      return { message: 'Legacy fallback visible.' };
    }, { client });

    const publicDto = {
      conversationId,
      workflowId: undefined,
      provider: result.provider,
      model: result.model,
      message: result.message,
      state: undefined,
    };

    results.push(await makeResult('Hermes accepted reply becomes public', async () => {
      assert(result.runtime === 'hermes', 'runtime was not Hermes');
      assert(result.message.includes('servicios'), 'Hermes reply not returned');
      assert(legacyCalls === 0, 'legacy executed on accepted Hermes path');
    }));

    results.push(await makeResult('Hermes visible response persists correctly', async () => {
      const hermesVisible: any = await CustomerInteraction.findOne({ businessSlug: 'demo_test', conversationId, 'participant.runtime': 'hermes', visibility: 'customer' }).lean();
      assert(hermesVisible?.interactionType === 'agent_message', 'Hermes visible interaction type mismatch');
      assert(hermesVisible?.metadata?.runtimeMode === 'qa_primary', 'qa_primary metadata missing');
    }));

    results.push(await makeResult('History includes Hermes as assistant', async () => {
      const history = await getVisibleConversationHistory({ businessSlug: 'demo_test', conversationId });
      assert(history.length === 2, `expected 2 visible messages, got ${history.length}`);
      assert(history[0].role === 'user', 'inbound role mismatch');
      assert(history[1].role === 'assistant', 'Hermes visible not mapped as assistant');
    }));

    results.push(await makeResult('Only one inbound and one visible outbound persist', async () => {
      const inbound = await CustomerInteraction.countDocuments({ businessSlug: 'demo_test', conversationId, direction: 'inbound', visibility: 'customer' });
      const outbound = await CustomerInteraction.countDocuments({ businessSlug: 'demo_test', conversationId, direction: 'outbound', visibility: 'customer' });
      assert(inbound === 1, `expected one inbound, got ${inbound}`);
      assert(outbound === 1, `expected one visible outbound, got ${outbound}`);
    }));

    results.push(await makeResult('Public DTO is unchanged and metadata hidden', async () => {
      const keys = Object.keys(publicDto).sort();
      assert(JSON.stringify(keys) === JSON.stringify(['conversationId', 'message', 'model', 'provider', 'state', 'workflowId'].sort()), 'public DTO shape changed');
      assert(!JSON.stringify(publicDto).includes('eligibility'), 'eligibility leaked');
      assert(!JSON.stringify(publicDto).includes('canaryBucket'), 'canary leaked');
      assert(!JSON.stringify(publicDto).includes('qaCategory'), 'qa metadata leaked');
    }));
  } finally {
    cleanup = await cleanupRunFixtures(conversationId);
    await disconnectMongo();
  }

  printSummary('HERMES-05B Visible Hermes Q&A', results, cleanup);
};

run().catch(async (error) => {
  console.error(error?.message || error);
  await disconnectMongo();
  process.exit(1);
});

