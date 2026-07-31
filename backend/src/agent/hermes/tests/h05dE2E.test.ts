import { CustomerInteraction } from '../../../models/CustomerInteraction.model';
import { getVisibleConversationHistory } from '../../../services/agentConversation.service';
import { buildHermesReadOnlyContext } from '../context/hermesContextBuilder.service';
import { evaluateHermesQaEligibility } from '../routing/hermesQaEligibility.service';
import { runHermesQaPrimaryTurn } from '../routing/hermesQaPrimary.service';
import { assert, cleanupRunFixtures, connectMongo, disconnectMongo, makeResult, printSummary, runId } from './h04TestUtils';
import { createH05Fixtures, enableH05TestFlags } from './h05Fixtures';
import { FailingHermesClient, GroundedHermesClient, StaticHermesClient } from './h05TestClients';

const baseConversationId = runId('hermes-h05-e2e');
const cleanupIds: string[] = [];
let cleanup: Awaited<ReturnType<typeof cleanupRunFixtures>> = {};

const runQa = async (suffix: string, message: string, client: any = new GroundedHermesClient(), fixtureOptions: any = {}) => {
  const conversationId = `${baseConversationId}-${suffix}`;
  cleanupIds.push(conversationId);
  const fixtures = await createH05Fixtures(conversationId, fixtureOptions);
  let legacyCalls = 0;
  const result = await runHermesQaPrimaryTurn({
    businessSlug: 'demo_test',
    conversationId,
    message,
    customerId: fixtures.customerId,
    caseId: fixtureOptions.activeCase ? fixtures.caseId : undefined,
    messageId: `${conversationId}:turn`,
    state: fixtureOptions.processState,
  }, async () => {
    legacyCalls += 1;
    return { message: 'Legacy visible response.' };
  }, { client });
  return { conversationId, fixtures, result, legacyCalls, client };
};

const run = async () => {
  await connectMongo();
  enableH05TestFlags();
  const results = [];

  try {
    results.push(await makeResult('saludo Hermes visible', async () => {
      const { result, legacyCalls } = await runQa('greeting', 'Hola.');
      assert(result.runtime === 'hermes', 'greeting not Hermes visible');
      assert(legacyCalls === 0, 'legacy executed for greeting');
    }));

    results.push(await makeResult('identidad Hermes visible', async () => {
      const { result } = await runQa('identity', 'Quien eres?');
      assert(result.runtime === 'hermes', 'identity not Hermes visible');
      assert(!/AGENTS\.md|SOUL\.md|system prompt/i.test(result.message), 'identity leaked implementation');
    }));

    results.push(await makeResult('servicios catalogo real', async () => {
      const { result } = await runQa('services', 'Que servicios tienen?');
      assert(result.runtime === 'hermes', 'services not Hermes visible');
      assert(!/offeringId|customerId|caseId/i.test(result.message), 'internal id leaked in services');
    }));

    results.push(await makeResult('duracion real', async () => {
      const { result } = await runQa('duration', 'Cuanto dura la consulta basica?');
      assert(result.runtime === 'hermes', 'duration not Hermes visible');
      assert(result.message.includes('60'), 'duration was not grounded');
    }));

    results.push(await makeResult('precio no publicado', async () => {
      const { result } = await runQa('price', 'Cuanto cuesta?');
      assert(result.runtime === 'hermes', 'price not Hermes visible');
      assert(/no esta publicado|confirmarlo/i.test(result.message), 'not-published price not handled safely');
      assert(!/S\/\s*\d|\$\s*\d|precio estimado/i.test(result.message), 'invented price visible');
    }));

    results.push(await makeResult('comparacion basada en catalogo', async () => {
      const { result } = await runQa('compare', 'Cual es la diferencia entre estas dos opciones?');
      assert(result.runtime === 'hermes', 'comparison not Hermes visible');
      assert(/diferencia|alcance|duracion/i.test(result.message), 'comparison not catalog-like');
    }));

    results.push(await makeResult('cliente conocido no repregunta nombre', async () => {
      const { result } = await runQa('known', 'Cuanto dura el servicio?', new GroundedHermesClient(), { knownCustomer: true });
      assert(result.runtime === 'hermes', 'known customer question not Hermes visible');
      assert(!/como te llamas|cual es tu nombre/i.test(result.message), 'Hermes repeated name question');
    }));

    for (const [suffix, message] of [
      ['booking', 'Quiero reservar.'],
      ['availability', 'Tienen horario manana?'],
      ['phone', 'Mi numero es 999999999.'],
      ['rename', 'Cambia mi nombre.'],
      ['cancel', 'Cancela mi cita.'],
      ['slot', 'Quiero el horario de las tres.'],
      ['yes', 'Si.'],
      ['name', 'Ricardo.'],
    ]) {
      results.push(await makeResult(`${message} -> legacy`, async () => {
        const { result, legacyCalls } = await runQa(suffix, message);
        assert(result.runtime === 'legacy', `${message} did not route to legacy`);
        assert(legacyCalls === 1, `${message} did not execute legacy exactly once`);
      }));
    }

    results.push(await makeResult('attachment -> legacy', async () => {
      const conversationId = `${baseConversationId}-attachment`;
      cleanupIds.push(conversationId);
      await createH05Fixtures(conversationId);
      let legacyCalls = 0;
      const result = await runHermesQaPrimaryTurn({
        businessSlug: 'demo_test',
        conversationId,
        message: 'Adjunto este archivo.',
        attachmentIds: ['att_1'],
        messageId: `${conversationId}:turn`,
      }, async () => {
        legacyCalls += 1;
        return { message: 'Legacy visible response.' };
      }, { client: new GroundedHermesClient() });
      assert(result.runtime === 'legacy', 'attachment did not route to legacy');
      assert(legacyCalls === 1, 'attachment did not execute legacy once');
    }));

    results.push(await makeResult('proceso activo -> legacy', async () => {
      const { result } = await runQa('active-process', 'Cuanto dura la consulta?', new GroundedHermesClient(), { processState: { status: 'WAITING_FOR_CUSTOMER_DATA' } });
      assert(result.runtime === 'legacy', 'active process did not route to legacy');
    }));

    results.push(await makeResult('case operacional activo -> legacy', async () => {
      const { result } = await runQa('active-case', 'Cuanto dura la consulta?', new GroundedHermesClient(), { activeCase: true });
      assert(result.runtime === 'legacy', 'active operational case did not route to legacy');
    }));

    results.push(await makeResult('falla Hermes -> legacy visible', async () => {
      const { conversationId, result } = await runQa('failure', 'Que servicios tienen?', new FailingHermesClient());
      const visibleOutbound = await CustomerInteraction.countDocuments({ businessSlug: 'demo_test', conversationId, direction: 'outbound', visibility: 'customer' });
      assert(result.runtime === 'legacy', 'failure did not fall back');
      assert(visibleOutbound === 1, 'failure produced duplicate visible outbound');
    }));

    results.push(await makeResult('candidato invalido rechazado', async () => {
      const { conversationId, result } = await runQa('rejected', 'Que servicios tienen?', new StaticHermesClient('Ya reserve tu cita para manana.'));
      const rejected = await CustomerInteraction.countDocuments({ businessSlug: 'demo_test', conversationId, visibility: 'shadow', 'metadata.runtimeMode': 'qa_candidate_rejected' });
      const hermesVisible = await CustomerInteraction.countDocuments({ businessSlug: 'demo_test', conversationId, visibility: 'customer', 'participant.runtime': 'hermes' });
      assert(result.runtime === 'legacy', 'invalid candidate did not fall back');
      assert(rejected === 1, 'invalid candidate not persisted internally');
      assert(hermesVisible === 0, 'invalid candidate became visible');
    }));

    results.push(await makeResult('reinicio reconstruye Hermes visible como assistant', async () => {
      const { conversationId } = await runQa('restart', 'Hola.');
      await disconnectMongo();
      await connectMongo();
      const history = await getVisibleConversationHistory({ businessSlug: 'demo_test', conversationId });
      assert(history.some((message) => message.role === 'assistant'), 'Hermes visible not reconstructed as assistant');
    }));

    results.push(await makeResult('aislamiento business/conversation', async () => {
      const a = await runQa('isolation-a', 'Hola.');
      const b = await runQa('isolation-b', 'Que servicios tienen?');
      const historyA = await getVisibleConversationHistory({ businessSlug: 'demo_test', conversationId: a.conversationId });
      const historyB = await getVisibleConversationHistory({ businessSlug: 'demo_test', conversationId: b.conversationId });
      assert(!historyA.some((message) => message.content.includes('servicios publicos')), 'conversation B leaked into A');
      assert(!historyB.some((message) => message.content.includes('Hola, soy Hermes')), 'conversation A leaked into B');
    }));

    results.push(await makeResult('router remains hidden from public DTO', async () => {
      const { result } = await runQa('dto', 'Hola.');
      const dto = { conversationId: 'x', workflowId: undefined, provider: result.provider, model: result.model, message: result.message, state: undefined };
      assert(!JSON.stringify(dto).includes('eligibility'), 'eligibility leaked to DTO');
      assert(!JSON.stringify(dto).includes('canaryBucket'), 'canary leaked to DTO');
    }));

    results.push(await makeResult('explicit eligibility check with context', async () => {
      const conversationId = `${baseConversationId}-eligibility-context`;
      cleanupIds.push(conversationId);
      await createH05Fixtures(conversationId);
      const built = await buildHermesReadOnlyContext({ businessSlug: 'demo_test', conversationId });
      const decision = await evaluateHermesQaEligibility({ businessSlug: 'demo_test', conversationId, message: 'Que servicios tienen?', context: built.context });
      assert(decision.eligible === true && decision.readOnly === true, 'eligibility did not remain read-only');
    }));
  } finally {
    for (const id of cleanupIds) cleanup = await cleanupRunFixtures(id);
    await disconnectMongo();
  }

  printSummary('HERMES-05D End-to-End Evaluation', results, cleanup);
};

run().catch(async (error) => {
  console.error(error?.message || error);
  await disconnectMongo();
  process.exit(1);
});

