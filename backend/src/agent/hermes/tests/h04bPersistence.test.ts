import { Case } from '../../../models/Case.model';
import { Customer } from '../../../models/Customer.model';
import { CustomerInteraction } from '../../../models/CustomerInteraction.model';
import {
  getShadowEvaluationHistory,
  getVisibleConversationHistory,
  linkConversationToCase,
  linkConversationToCustomer,
  recordInboundMessage,
  recordShadowAgentMessage,
  recordVisibleAgentMessage,
} from '../../../services/agentConversation.service';
import { assert, cleanupRunFixtures, connectMongo, disconnectMongo, makeResult, printSummary, runId } from './h04TestUtils';

const conversationId = runId('hermes-h04b');
const otherConversationId = `${conversationId}-other`;
const businessSlug = 'demo_test';
const workflowId = conversationId;
const customerId = `${conversationId}-customer`;
const caseId = `${conversationId}-case`;
const otherBusiness = `${conversationId}-business`;

let cleanup: Awaited<ReturnType<typeof cleanupRunFixtures>> = {};

const countConversation = () => CustomerInteraction.countDocuments({ businessSlug, conversationId });

const setup = async () => {
  await (Customer as any).create({
    _id: customerId,
    businessSlug,
    displayName: 'Ricardo H04B',
    contact: { phones: [{ normalized: '+51999990000' }] },
  });
  await (Case as any).create({
    _id: caseId,
    businessSlug,
    customerId,
    status: 'lead',
    caseNumber: `H04B-${conversationId}`,
    intent: { type: 'consultation_request', summary: 'H04B persistence case' },
  });
  await (Customer as any).create({ _id: `${conversationId}-cross-customer`, businessSlug: otherBusiness });
  await (Case as any).create({
    _id: `${conversationId}-cross-case`,
    businessSlug: otherBusiness,
    customerId: `${conversationId}-cross-customer`,
    status: 'lead',
  });
};

const run = async () => {
  await connectMongo();
  await cleanupRunFixtures(conversationId);
  const results = [];

  try {
    await setup();

    results.push(await makeResult('inbound persistence', async () => {
      await recordInboundMessage({
        workflowId,
        businessSlug,
        conversationId,
        body: 'Mi nombre es Ricardo.',
        messageId: `${conversationId}-inbound-1`,
        correlationId: `${conversationId}-corr-1`,
      });
      const doc: any = await CustomerInteraction.findOne({ businessSlug, conversationId, messageId: `${conversationId}-inbound-1` }).lean();
      assert(doc?.direction === 'inbound', 'inbound direction mismatch');
      assert(doc?.participant?.type === 'customer', 'inbound participant mismatch');
      assert(doc?.interactionType === 'customer_message', 'inbound interactionType mismatch');
      assert(doc?.visibility === 'customer', 'inbound visibility mismatch');
      assert(doc?.content?.text === 'Mi nombre es Ricardo.', 'inbound content mismatch');
      assert(doc?.execution?.correlationId === `${conversationId}-corr-1`, 'correlationId missing');
    }));

    results.push(await makeResult('legacy visible persistence', async () => {
      await recordVisibleAgentMessage({
        workflowId,
        businessSlug,
        conversationId,
        body: 'Hola Ricardo, te ayudo con la consulta.',
        messageId: `${conversationId}-legacy-1`,
      });
      const doc: any = await CustomerInteraction.findOne({ businessSlug, conversationId, messageId: `${conversationId}-legacy-1` }).lean();
      assert(doc?.direction === 'outbound', 'legacy direction mismatch');
      assert(doc?.participant?.runtime === 'legacy', 'legacy runtime mismatch');
      assert(doc?.interactionType === 'agent_message', 'legacy interactionType mismatch');
      assert(doc?.visibility === 'customer', 'legacy visibility mismatch');
    }));

    results.push(await makeResult('shadow persistence', async () => {
      await recordShadowAgentMessage({
        workflowId,
        businessSlug,
        conversationId,
        body: 'Hermes shadow reply.',
        messageId: `${conversationId}-shadow-1`,
        metadata: {
          runtimeMode: 'shadow',
          selectedSkill: 'catalog-advisor',
          shadowStatus: 'completed',
          evaluation: { emptyReply: false },
        },
      });
      const doc: any = await CustomerInteraction.findOne({ businessSlug, conversationId, messageId: `${conversationId}-shadow-1` }).lean();
      assert(doc?.participant?.runtime === 'hermes', 'shadow runtime mismatch');
      assert(doc?.interactionType === 'shadow_response', 'shadow interactionType mismatch');
      assert(doc?.visibility === 'shadow', 'shadow visibility mismatch');
      assert(doc?.metadata?.evaluation?.emptyReply === false, 'shadow evaluation missing');
    }));

    results.push(await makeResult('visible history and shadow exclusion', async () => {
      const history = await getVisibleConversationHistory({ businessSlug, conversationId });
      assert(history.length === 2, `expected 2 visible messages, got ${history.length}`);
      assert(history[0].role === 'user', 'first visible role mismatch');
      assert(history[1].role === 'assistant', 'second visible role mismatch');
      assert(!history.some((message) => message.content.includes('Hermes shadow')), 'shadow leaked into visible history');
    }));

    results.push(await makeResult('chronological ordering and limits', async () => {
      for (let index = 0; index < 35; index += 1) {
        await recordInboundMessage({
          workflowId,
          businessSlug,
          conversationId,
          body: `limit-message-${index}`,
          messageId: `${conversationId}-limit-${index}`,
        });
      }
      const limited = await getVisibleConversationHistory({ businessSlug, conversationId, limit: 30, maxChars: 30000 });
      assert(limited.length === 30, `expected 30 limited messages, got ${limited.length}`);
      assert(limited[limited.length - 1].content === 'limit-message-34', 'latest message was not preserved');
      const charLimited = await getVisibleConversationHistory({ businessSlug, conversationId, limit: 30, maxChars: 20 });
      assert(charLimited.length >= 1, 'character limit removed every message');
      assert(charLimited[charLimited.length - 1].content === 'limit-message-34', 'character limit did not preserve latest turn');
    }));

    results.push(await makeResult('idempotent replay and conflicting replay', async () => {
      const before = await countConversation();
      await recordInboundMessage({
        workflowId,
        businessSlug,
        conversationId,
        body: 'Replay same payload.',
        messageId: `${conversationId}-idempotent`,
      });
      await recordInboundMessage({
        workflowId,
        businessSlug,
        conversationId,
        body: 'Replay same payload.',
        messageId: `${conversationId}-idempotent`,
      });
      assert(await countConversation() === before + 1, 'idempotent replay created duplicate');
      let conflict = false;
      try {
        await recordInboundMessage({
          workflowId,
          businessSlug,
          conversationId,
          body: 'Replay different payload.',
          messageId: `${conversationId}-idempotent`,
        });
      } catch {
        conflict = true;
      }
      assert(conflict, 'conflicting replay was not rejected');
    }));

    results.push(await makeResult('legacy and hermes coexist with same message id', async () => {
      await recordVisibleAgentMessage({
        workflowId,
        businessSlug,
        conversationId,
        body: 'Visible coexist reply.',
        messageId: `${conversationId}-coexist`,
      });
      await recordShadowAgentMessage({
        workflowId,
        businessSlug,
        conversationId,
        body: 'Shadow coexist reply.',
        messageId: `${conversationId}-coexist`,
      });
      const docs = await CustomerInteraction.find({ businessSlug, conversationId, messageId: `${conversationId}-coexist` }).lean();
      assert(docs.length === 2, `expected 2 coexist docs, got ${docs.length}`);
    }));

    results.push(await makeResult('customer and case linking', async () => {
      await linkConversationToCustomer({ businessSlug, conversationId, customerId });
      await linkConversationToCase({ businessSlug, conversationId, caseId });
      const linked = await CustomerInteraction.countDocuments({ businessSlug, conversationId, customerId, caseId });
      assert(linked > 0, 'conversation documents were not linked');
    }));

    results.push(await makeResult('cross-business rejection', async () => {
      let customerRejected = false;
      let caseRejected = false;
      try {
        await linkConversationToCustomer({ businessSlug, conversationId, customerId: `${conversationId}-cross-customer` });
      } catch {
        customerRejected = true;
      }
      try {
        await linkConversationToCase({ businessSlug, conversationId, caseId: `${conversationId}-cross-case` });
      } catch {
        caseRejected = true;
      }
      assert(customerRejected, 'cross-business customer was accepted');
      assert(caseRejected, 'cross-business case was accepted');
    }));

    results.push(await makeResult('cross-conversation isolation', async () => {
      await recordInboundMessage({
        workflowId: otherConversationId,
        businessSlug,
        conversationId: otherConversationId,
        body: 'Message from another conversation.',
        messageId: `${otherConversationId}-inbound`,
      });
      const history = await getVisibleConversationHistory({ businessSlug, conversationId });
      assert(!history.some((message) => message.content.includes('another conversation')), 'other conversation leaked into history');
    }));

    results.push(await makeResult('shadow evaluation history internal only', async () => {
      const shadows = await getShadowEvaluationHistory({ businessSlug, conversationId });
      assert(shadows.length >= 1, 'shadow evaluation history missing');
      assert(shadows.every((row: any) => row.visibility === 'shadow'), 'non-shadow row in shadow history');
    }));
  } finally {
    cleanup = await cleanupRunFixtures(conversationId);
    await cleanupRunFixtures(otherConversationId);
    await Customer.deleteMany({ businessSlug: otherBusiness, _id: new RegExp(`^${conversationId}`) });
    await Case.deleteMany({ businessSlug: otherBusiness, _id: new RegExp(`^${conversationId}`) });
    await disconnectMongo();
  }

  results.push(await makeResult('fixture cleanup', async () => {
    await connectMongo();
    assert(await CustomerInteraction.countDocuments({ businessSlug, conversationId }) === 0, 'CustomerInteraction cleanup failed');
    assert(await Customer.countDocuments({ businessSlug, _id: new RegExp(`^${conversationId}`) }) === 0, 'Customer cleanup failed');
    assert(await Case.countDocuments({ businessSlug, _id: new RegExp(`^${conversationId}`) }) === 0, 'Case cleanup failed');
    await disconnectMongo();
  }));

  printSummary('HERMES-04B Persistence Verification', results, cleanup);
};

run().catch(async (error) => {
  console.error(error?.message || error);
  await disconnectMongo();
  process.exit(1);
});
