import { HermesApiClient } from '../clients/hermesApi.client';
import { ExecutionContext } from '../contracts/executionContext.contract';
import { HermesCompletionInput } from '../contracts/hermesChatRequest.contract';
import { HermesCompletionResult } from '../contracts/hermesChatResponse.contract';
import { buildHermesReadOnlyContext } from '../context/hermesContextBuilder.service';
import { dispatchHermesShadowSafely } from '../services/hermesShadow.service';
import { Case } from '../../../models/Case.model';
import { CatalogOffering } from '../../../models/CatalogOffering.model';
import { Customer } from '../../../models/Customer.model';
import { CustomerInteraction } from '../../../models/CustomerInteraction.model';
import {
  getShadowEvaluationHistory,
  getVisibleConversationHistory,
  recordInboundMessage,
  recordShadowAgentMessage,
  recordVisibleAgentMessage,
} from '../../../services/agentConversation.service';
import { assert, cleanupRunFixtures, connectMongo, disconnectMongo, makeResult, printSummary, runId } from './h04TestUtils';

const conversationId = runId('hermes-h04d');
const conversationA = `${conversationId}-a`;
const conversationB = `${conversationId}-b`;
const businessSlug = 'demo_test';
const customerId = `${conversationId}-customer`;
const offeringId = `${conversationId}-offering`;
const caseId = `${conversationId}-case`;

let cleanup: Awaited<ReturnType<typeof cleanupRunFixtures>> = {};

class GroundedHermesClient implements HermesApiClient {
  async getHealth() {
    return { ok: true, version: 'h04d-test' } as any;
  }

  async complete(input: any) {
    const text = input.messages.map((message: any) => message.content).join('\n').toLowerCase();
    let reply = 'Ricardo, puedo orientarte con la consulta sin confirmar una cita.';
    if (text.includes('cuanto dura') || text.includes('cuánto dura')) {
      reply = 'Ricardo, la consulta dura 60 minutos segun el catalogo disponible.';
    }
    if (text.includes('consulta tiene costo') || text.includes('precio') || text.includes('costo')) {
      reply = 'Ricardo, el precio no esta publicado; no voy a inventar un monto.';
    }
    if (text.includes('en realidad me llamo roberto')) {
      reply = 'Roberto, gracias por la correccion. La tomo para esta conversacion, pero no declaro que actualice la base.';
    }
    if (text.includes('ana')) {
      reply = 'Ana, puedo ayudarte con la consulta sin usar datos de otra conversacion.';
    }
    return { reply, model: 'h04d-test', usage: {} } as any;
  }
}

class FailingHermesClient implements HermesApiClient {
  async getHealth() {
    return { ok: false } as any;
  }

  async complete(_input: HermesCompletionInput, _context: ExecutionContext): Promise<HermesCompletionResult> {
    throw new Error('provider unavailable');
  }
}

const withFlags = () => {
  process.env.HERMES_ENABLED = 'true';
  process.env.HERMES_SHADOW_ENABLED = 'true';
  process.env.HERMES_SHADOW_SAMPLE_PERCENT = '100';
  process.env.HERMES_CONTEXT_ENABLED = 'true';
  process.env.HERMES_PERSIST_INTERACTIONS = 'true';
  process.env.HERMES_PERSIST_SHADOW = 'true';
  process.env.HERMES_READ_BUSINESS_CONTEXT = 'true';
  process.env.HERMES_READ_CATALOG_CONTEXT = 'true';
  process.env.HERMES_READ_CUSTOMER_CONTEXT = 'true';
  process.env.HERMES_READ_CASE_CONTEXT = 'true';
  process.env.HERMES_READ_PROCESS_CONTEXT = 'true';
};

const setup = async () => {
  await (CatalogOffering as any).create({
    _id: offeringId,
    businessSlug,
    active: true,
    publicVisible: true,
    name: 'Consulta H04D',
    description: 'Consulta real para shadow H04D',
    durationMinutes: 60,
    pricing: { type: 'not_published', currency: 'PEN' },
  });
  await (Customer as any).create({
    _id: customerId,
    businessSlug,
    displayName: 'Ricardo',
    phone: '+51999111222',
  });
  await (Case as any).create({
    _id: caseId,
    businessSlug,
    customerId,
    status: 'lead',
    statusGroup: 'pre_order',
    caseNumber: `H04D-${conversationId}`,
    intent: {
      type: 'consultation_request',
      summary: 'Consulta seleccionada',
      selectedOfferingId: offeringId,
    },
  });
};

const runShadowTurn = async ({
  currentConversationId,
  userMessage,
  legacyReply,
  messageId,
  client = new GroundedHermesClient(),
}: {
  currentConversationId: string;
  userMessage: string;
  legacyReply: string;
  messageId: string;
  client?: HermesApiClient;
}) => {
  await recordInboundMessage({
    workflowId: currentConversationId,
    businessSlug,
    conversationId: currentConversationId,
    body: userMessage,
    messageId: `${messageId}-inbound`,
  });
  await recordVisibleAgentMessage({
    workflowId: currentConversationId,
    businessSlug,
    conversationId: currentConversationId,
    body: legacyReply,
    messageId: `${messageId}-legacy`,
  });
  const history = await getVisibleConversationHistory({ businessSlug, conversationId: currentConversationId });
  const built = await buildHermesReadOnlyContext({
    businessSlug,
    conversationId: currentConversationId,
    channel: 'web_agent',
    customerId,
    caseId,
    processState: {
      status: 'WAITING_FOR_CUSTOMER_DATA',
      customerData: { firstName: 'Ricardo' },
      selectedOffering: { _id: offeringId },
    },
  });
  const shadow = await dispatchHermesShadowSafely({
    businessSlug,
    conversationId: currentConversationId,
    userMessage,
    legacyReply,
    history: built.history.length ? built.history : history,
    readOnlyContext: built.context,
    channel: 'web_agent',
    correlationId: `${messageId}-corr`,
  }, { client });

  if (shadow.hermesReply || shadow.status !== 'skipped') {
    await recordShadowAgentMessage({
      workflowId: currentConversationId,
      businessSlug,
      conversationId: currentConversationId,
      body: shadow.hermesReply || `Hermes shadow ${shadow.status}`,
      messageId: `${messageId}-shadow`,
      correlationId: shadow.correlationId,
      metadata: {
        runtimeMode: 'shadow',
        selectedSkill: 'catalog-advisor',
        shadowStatus: shadow.status,
        evaluation: shadow.evaluation,
        contextUsed: Boolean(built.context.business),
      },
    });
  }
  return { shadow, built, publicResponse: { message: legacyReply, conversationId: currentConversationId } };
};

const run = async () => {
  await connectMongo();
  await cleanupRunFixtures(conversationId);
  await cleanupRunFixtures(conversationA);
  await cleanupRunFixtures(conversationB);
  const results = [];

  try {
    withFlags();
    await setup();

    results.push(await makeResult('shadow persisted and evaluation persisted', async () => {
      const { shadow, publicResponse } = await runShadowTurn({
        currentConversationId: conversationId,
        userMessage: 'Mi nombre es Ricardo. Cuanto dura la consulta?',
        legacyReply: 'Te ayudo con la consulta.',
        messageId: `${conversationId}-duration`,
      });
      assert(shadow.status === 'completed', 'shadow did not complete');
      assert(shadow.hermesReply?.includes('60'), 'shadow did not use catalog duration');
      const persisted: any = await CustomerInteraction.findOne({ businessSlug, conversationId, messageId: `${conversationId}-duration-shadow` }).lean();
      assert(persisted?.visibility === 'shadow', 'persisted shadow visibility mismatch');
      assert(persisted?.metadata?.evaluation?.emptyReply === false, 'evaluation not persisted');
      assert(persisted?.metadata?.evaluation?.usedCatalogGrounding === true, 'catalog grounding evaluator failed');
      assert(!JSON.stringify(publicResponse).includes(String(shadow.hermesReply)), 'public response leaked hermes reply');
    }));

    results.push(await makeResult('visible history excludes shadow and legacy remains public', async () => {
      const history = await getVisibleConversationHistory({ businessSlug, conversationId });
      assert(history.some((message) => message.content === 'Te ayudo con la consulta.'), 'legacy visible reply missing');
      assert(!history.some((message) => message.content.includes('60 minutos')), 'shadow leaked into visible history');
    }));

    results.push(await makeResult('side question and no false price', async () => {
      const { shadow } = await runShadowTurn({
        currentConversationId: conversationId,
        userMessage: 'Antes, la consulta tiene costo?',
        legacyReply: 'Me compartes tu telefono?',
        messageId: `${conversationId}-cost`,
      });
      assert(shadow.hermesReply?.includes('no esta publicado'), 'side question was not answered safely');
      assert(shadow.evaluation.answeredSideQuestion === true, 'side question evaluator failed');
      assert(shadow.evaluation.falsePrice === false, 'false price evaluator failed');
    }));

    results.push(await makeResult('known customer and selected case reduce repeated questions', async () => {
      const { shadow, built } = await runShadowTurn({
        currentConversationId: conversationId,
        userMessage: 'Que servicio tengo seleccionado?',
        legacyReply: 'Reviso el servicio.',
        messageId: `${conversationId}-case`,
      });
      assert(built.context.case?.intent?.selectedOfferingId === offeringId, 'case selected offering missing');
      assert(shadow.evaluation.repeatedQuestion === false, 'shadow repeated known data question');
      assert(!String(shadow.hermesReply).toLowerCase().includes('que servicio deseas'), 'shadow asked for already selected service');
    }));

    results.push(await makeResult('user correction without database update claim', async () => {
      const { shadow } = await runShadowTurn({
        currentConversationId: conversationId,
        userMessage: 'En realidad me llamo Roberto.',
        legacyReply: 'Gracias por avisar.',
        messageId: `${conversationId}-correction`,
      });
      assert(shadow.hermesReply?.includes('Roberto'), 'correction not acknowledged');
      assert(shadow.evaluation.unauthorizedActionClaim === false, 'shadow claimed unauthorized update');
    }));

    results.push(await makeResult('no false confirmation', async () => {
      const shadows: any[] = await getShadowEvaluationHistory({ businessSlug, conversationId });
      assert(shadows.length > 0, 'no shadow history available');
      assert(shadows.every((row) => row.metadata?.evaluation?.unauthorizedActionClaim === false), 'false confirmation detected');
    }));

    results.push(await makeResult('cross-conversation isolation', async () => {
      await runShadowTurn({
        currentConversationId: conversationA,
        userMessage: 'Mi nombre es Ricardo.',
        legacyReply: 'Hola Ricardo.',
        messageId: `${conversationA}-name`,
      });
      const { shadow } = await runShadowTurn({
        currentConversationId: conversationB,
        userMessage: 'Mi nombre es Ana. Cuanto dura la consulta?',
        legacyReply: 'Hola Ana.',
        messageId: `${conversationB}-name`,
      });
      assert(!String(shadow.hermesReply).includes('Ricardo'), 'conversation B leaked Ricardo');
      assert(String(shadow.hermesReply).includes('Ana'), 'conversation B did not use Ana');
    }));

    results.push(await makeResult('restart reconstruction from Mongo', async () => {
      await disconnectMongo();
      await connectMongo();
      const history = await getVisibleConversationHistory({ businessSlug, conversationId });
      assert(history.length >= 2, 'history was not reconstructed after reconnect');
      assert(history.some((message) => message.role === 'user'), 'reconstructed history missing user');
      assert(history.some((message) => message.role === 'assistant'), 'reconstructed history missing assistant');
    }));

    results.push(await makeResult('Hermes failure fail-open and records shadow failure', async () => {
      const { shadow, publicResponse } = await runShadowTurn({
        currentConversationId: conversationId,
        userMessage: 'Prueba de falla Hermes.',
        legacyReply: 'Legacy sigue visible.',
        messageId: `${conversationId}-failure`,
        client: new FailingHermesClient(),
      });
      assert(shadow.status === 'provider_error', `expected provider_error, got ${shadow.status}`);
      assert(publicResponse.message === 'Legacy sigue visible.', 'legacy response changed on Hermes failure');
      const persisted: any = await CustomerInteraction.findOne({ businessSlug, conversationId, messageId: `${conversationId}-failure-shadow` }).lean();
      assert(persisted?.visibility === 'shadow', 'failure shadow was not persisted internally');
      assert(persisted?.metadata?.shadowStatus === 'provider_error', 'failure status not persisted');
    }));
  } finally {
    cleanup = await cleanupRunFixtures(conversationId);
    await cleanupRunFixtures(conversationA);
    await cleanupRunFixtures(conversationB);
    await disconnectMongo();
  }

  results.push(await makeResult('fixture cleanup', async () => {
    await connectMongo();
    assert(await CustomerInteraction.countDocuments({ businessSlug, conversationId }) === 0, 'main interaction cleanup failed');
    assert(await CustomerInteraction.countDocuments({ businessSlug, conversationId: conversationA }) === 0, 'conversation A cleanup failed');
    assert(await CustomerInteraction.countDocuments({ businessSlug, conversationId: conversationB }) === 0, 'conversation B cleanup failed');
    assert(await Customer.countDocuments({ businessSlug, _id: new RegExp(`^${conversationId}`) }) === 0, 'Customer cleanup failed');
    assert(await CatalogOffering.countDocuments({ businessSlug, _id: new RegExp(`^${conversationId}`) }) === 0, 'CatalogOffering cleanup failed');
    assert(await Case.countDocuments({ businessSlug, _id: new RegExp(`^${conversationId}`) }) === 0, 'Case cleanup failed');
    await disconnectMongo();
  }));

  printSummary('HERMES-04D Persisted Shadow Verification', results, cleanup);
};

run().catch(async (error) => {
  console.error(error?.message || error);
  await disconnectMongo();
  process.exit(1);
});
