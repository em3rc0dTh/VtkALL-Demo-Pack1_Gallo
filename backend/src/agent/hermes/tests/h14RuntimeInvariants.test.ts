import { createServer } from 'http';
import app from '../../../app';
import { AgentContext } from '../../context/agentContext';
import { deterministicFallback } from '../../fallback/deterministicFallback';
import { toPhoneDigits } from '../../runtime/agentRuntime';
import { assert, cleanupRunFixtures, connectMongo, disconnectMongo, makeResult, printSummary, runId } from './h04TestUtils';
import { createH05Fixtures, enableH05TestFlags } from './h05Fixtures';

const baseConversationId = runId('hermes-h14-runtime');
const cleanupIds: string[] = [];
let cleanup: Awaited<ReturnType<typeof cleanupRunFixtures>> = {};

const makeContext = (customerId?: string): AgentContext => ({
  conversation: {
    conversationId: `${baseConversationId}-fallback-${customerId || 'none'}`,
    businessSlug: 'demo_test',
    channel: 'web',
    recentMessages: [],
    ...(customerId
      ? {
          customerIdentity: {
            customerId,
            identityStatus: 'identified',
          },
        }
      : {}),
  },
  business: {
    businessSlug: 'demo_test',
    business: {
      name: 'Turagua Racing Peru',
      timezone: 'America/Lima',
    },
    agent: {
      name: 'Iris',
      role: 'automotive service assistant',
    },
    capabilities: [],
    catalogSummary: [],
  },
});

const runPublicTurn = async (suffix: string, message: string, history: { role: 'user' | 'assistant', content: string }[] = []) => {
  const conversationId = `${baseConversationId}-${suffix}`;
  cleanupIds.push(conversationId);
  const fixtures = await createH05Fixtures(conversationId, {});
  
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, () => resolve()));
  const port = (server.address() as any).port;

  const response = await fetch(`http://localhost:${port}/api/v1/agent-sim/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessSlug: 'demo_test',
      conversationId,
      message,
      messageId: `${conversationId}:turn`,
    }),
  });

  const responseBody = await response.json();
  server.close();

  return { conversationId, fixtures, response: { status: response.status, body: responseBody } };
};

const run = async () => {
  await connectMongo();
  enableH05TestFlags();

  const results = [];

  try {
    results.push(await makeResult('H14.0 Phone contract rejects short numbers', async () => {
      assert(toPhoneDigits('5200') === undefined, '5200 must not be accepted as a phone');
      assert(toPhoneDigits('Mi numero es 933075200') === '933075200', '9-digit mobile should be accepted');
      assert(toPhoneDigits('+51 933 075 200') === '51933075200', 'country-code mobile should be accepted');
    }));

    results.push(await makeResult('H14.0b Recovery wording reflects completed lookup', async () => {
      const found = await deterministicFallback(makeContext('cus_h14_found'), 'Mi numero es 933075200');
      const missing = await deterministicFallback(makeContext(), 'Mi numero es 933075200');
      assert(found.reply === 'Gracias. He recuperado tu informacion. En que puedo ayudarte?', `Unexpected found reply: ${found.reply}`);
      assert(missing.reply === 'Gracias. No encontre una conversacion previa asociada a ese numero. En que puedo ayudarte?', `Unexpected missing reply: ${missing.reply}`);
    }));

    results.push(await makeResult('H14.1 Chaufa - Off Domain', async () => {
      const { response } = await runPublicTurn('chaufa', 'Me puedes hacer un chaufa?');
      console.log('H14.1:', response.body);
      assert(response.status === 200, `Expected 200, got ${response.status}: ${JSON.stringify(response.body)}`);
      const resultMessage = response.body.data?.message || '';
      assert(!/motor|taller|frenos|aceite|revisar/i.test(resultMessage), 'Should not answer with automotive topics');
      assert(/no puedo|automotriz/i.test(resultMessage), 'Should clarify its automotive role');
    }));

    results.push(await makeResult('H14.2 Recalienta en trafico', async () => {
      const { response } = await runPublicTurn('recalienta', 'Por que mi auto se recalienta en trafico?');
      console.log('H14.2:', response.body);
      assert(response.status === 200, `Expected 200, got ${response.status}: ${JSON.stringify(response.body)}`);
      const resultMessage = response.body.data?.message || '';
      assert(/ventilador|radiador|refrigerante|bomba/i.test(resultMessage), 'Should provide technical guidance for overheating');
      assert(!/que sintoma|que problema tiene/i.test(resultMessage), 'Should not ask for a symptom it already has');
    }));

    results.push(await makeResult('H14.3 Agujas se elevan', async () => {
      const { response } = await runPublicTurn('agujas', 'Las agujas de temperatura se elevan');
      console.log('H14.3:', response.body);
      assert(response.status === 200, `Expected 200, got ${response.status}: ${JSON.stringify(response.body)}`);
      const resultMessage = response.body.data?.message || '';
      assert(/trafico|velocidad|acelerar/i.test(resultMessage), 'Should progress to ask under what conditions it elevates');
    }));

  } finally {
    cleanup = await cleanupRunFixtures(baseConversationId);
    await disconnectMongo();
  }
  printSummary('H14 Runtime Invariants', results, cleanup);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
