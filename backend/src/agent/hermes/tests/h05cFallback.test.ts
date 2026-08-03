import { CustomerInteraction } from '../../../models/CustomerInteraction.model';
import { runHermesQaPrimaryTurn } from '../routing/hermesQaPrimary.service';
import { validateHermesQaVisibleReply } from '../routing/hermesQaResponseValidator.service';
import { assert, cleanupRunFixtures, connectMongo, disconnectMongo, makeResult, printSummary, runId } from './h04TestUtils';
import { createH05Fixtures, enableH05TestFlags } from './h05Fixtures';
import { FailingHermesClient, GroundedHermesClient, StaticHermesClient } from './h05TestClients';

let cleanup: Awaited<ReturnType<typeof cleanupRunFixtures>> = {};

const runTurn = async (conversationId: string, client: any, message = 'Que servicios tienen?') => {
  await createH05Fixtures(conversationId);
  let legacyCalls = 0;
  const result = await runHermesQaPrimaryTurn({
    businessSlug: 'demo_test',
    conversationId,
    message,
    messageId: `${conversationId}:turn`,
  }, async () => {
    legacyCalls += 1;
    return { message: 'Legacy fallback visible.' };
  }, { client });
  return { result, legacyCalls };
};

const run = async () => {
  await connectMongo();
  enableH05TestFlags();
  const results = [];
  const cleanupIds: string[] = [];

  try {
    results.push(await makeResult('canary stable', async () => {
      const conversationId = runId('hermes-h05-fallback-canary');
      cleanupIds.push(conversationId);
      await createH05Fixtures(conversationId);
      process.env.HERMES_QA_CANARY_PERCENT = '100';
      const first = await runHermesQaPrimaryTurn({ businessSlug: 'demo_test', conversationId, message: 'Hola.', messageId: `${conversationId}:a` }, async () => ({ message: 'Legacy' }), { client: new GroundedHermesClient() });
      const second = await runHermesQaPrimaryTurn({ businessSlug: 'demo_test', conversationId, message: 'Quien eres?', messageId: `${conversationId}:b` }, async () => ({ message: 'Legacy' }), { client: new GroundedHermesClient() });
      assert(first.eligibility.canaryBucket === second.eligibility.canaryBucket, 'canary bucket changed for same conversation');
    }));

    results.push(await makeResult('0 percent routes all to legacy', async () => {
      const conversationId = runId('hermes-h05-fallback-zero');
      cleanupIds.push(conversationId);
      process.env.HERMES_QA_CANARY_PERCENT = '0';
      const { result, legacyCalls } = await runTurn(conversationId, new GroundedHermesClient());
      process.env.HERMES_QA_CANARY_PERCENT = '100';
      assert(result.runtime === 'legacy', '0 percent did not route to legacy');
      assert(legacyCalls === 1, 'legacy did not execute exactly once');
    }));

    results.push(await makeResult('100 percent routes eligible to Hermes', async () => {
      const conversationId = runId('hermes-h05-fallback-hundred');
      cleanupIds.push(conversationId);
      process.env.HERMES_QA_CANARY_PERCENT = '100';
      const client = new GroundedHermesClient();
      const { result, legacyCalls } = await runTurn(conversationId, client);
      assert(result.runtime === 'hermes', 'eligible did not route to Hermes at 100');
      assert(legacyCalls === 0, 'legacy executed on accepted Hermes');
      assert(client.calls === 1, 'Hermes was not called exactly once');
    }));

    results.push(await makeResult('ineligible remains legacy at 100 percent', async () => {
      const conversationId = runId('hermes-h05-fallback-ineligible');
      cleanupIds.push(conversationId);
      const { result, legacyCalls } = await runTurn(conversationId, new GroundedHermesClient(), 'Quiero reservar.');
      assert(result.runtime === 'legacy', 'ineligible routed to Hermes');
      assert(legacyCalls === 1, 'legacy did not execute exactly once for ineligible');
    }));

    results.push(await makeResult('timeout/provider failure falls back', async () => {
      const conversationId = runId('hermes-h05-fallback-failure');
      cleanupIds.push(conversationId);
      const { result, legacyCalls } = await runTurn(conversationId, new FailingHermesClient());
      assert(result.runtime === 'legacy', 'provider failure did not fall back');
      assert(legacyCalls === 1, 'legacy did not execute exactly once after failure');
    }));

    results.push(await makeResult('rejected response falls back and remains hidden', async () => {
      const conversationId = runId('hermes-h05-fallback-rejected');
      cleanupIds.push(conversationId);
      const { result, legacyCalls } = await runTurn(conversationId, new StaticHermesClient('Ya reserve tu cita para manana.'));
      const rejected = await CustomerInteraction.countDocuments({ businessSlug: 'demo_test', conversationId, visibility: 'shadow', 'metadata.runtimeMode': 'qa_candidate_rejected' });
      const hermesVisible = await CustomerInteraction.countDocuments({ businessSlug: 'demo_test', conversationId, visibility: 'customer', 'participant.runtime': 'hermes' });
      assert(result.runtime === 'legacy', 'rejected response did not fall back');
      assert(legacyCalls === 1, 'legacy did not execute exactly once after rejection');
      assert(rejected === 1, 'rejected candidate was not persisted internally');
      assert(hermesVisible === 0, 'rejected Hermes candidate became visible');
    }));

    results.push(await makeResult('no duplicate inbound/outbound in fallback', async () => {
      const conversationId = runId('hermes-h05-fallback-counts');
      cleanupIds.push(conversationId);
      await runTurn(conversationId, new StaticHermesClient('Hay disponibilidad manana.'));
      const inbound = await CustomerInteraction.countDocuments({ businessSlug: 'demo_test', conversationId, direction: 'inbound', visibility: 'customer' });
      const visibleOutbound = await CustomerInteraction.countDocuments({ businessSlug: 'demo_test', conversationId, direction: 'outbound', visibility: 'customer' });
      assert(inbound === 1, `expected one inbound, got ${inbound}`);
      assert(visibleOutbound === 1, `expected one visible outbound, got ${visibleOutbound}`);
    }));

    results.push(await makeResult('response validation matrix', async () => {
      const valid = validateHermesQaVisibleReply({ reply: 'La consulta basica dura 60 minutos.' });
      const invalids = [
        '',
        'Tu cita quedo confirmada.',
        'Hay disponibilidad manana.',
        'El precio estimado es S/ 50.',
        'C:\\Users\\secret\\.env',
        'Segun AGENTS.md...',
        'offeringId=off_123',
        'x'.repeat(4000),
        '{"message":"hola"}',
      ].map((reply) => validateHermesQaVisibleReply({ reply, context: { catalog: [{ id: 'x', pricing: { type: 'not_published' }, publicVisible: true, active: true }], conversation: { conversationId: 'c', channel: 'web_agent', history: [] }, permissions: { mode: 'qa_primary', readOnly: true, canExecuteActions: false } } as any }));
      assert(valid.accepted === true, 'valid response rejected');
      assert(invalids.every((item) => item.accepted === false), 'invalid response accepted');
    }));
  } finally {
    for (const id of cleanupIds) {
      cleanup = await cleanupRunFixtures(id);
    }
    await disconnectMongo();
  }

  printSummary('HERMES-05C Canary Fallback Validation', results, cleanup);
};

run().catch(async (error) => {
  console.error(error?.message || error);
  await disconnectMongo();
  process.exit(1);
});

