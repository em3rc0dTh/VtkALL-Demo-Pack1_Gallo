import { CustomerInteraction } from '../../../models/CustomerInteraction.model';
import { dispatchHermesSkillPlan } from '../orchestration/hermesSkillDispatch.service';
import { observeHermesReceptionDeskTurn } from '../orchestration/hermesReceptionDesk.service';
import { HermesSkillResult } from '../contracts/hermesSkillRegistry.contract';
import { assert, cleanupRunFixtures, connectMongo, disconnectMongo, makeResult, printSummary, runId } from './h04TestUtils';
import { createH05Fixtures, enableH05TestFlags } from './h05Fixtures';

const baseConversationId = runId('hermes-h06d-specialist');
const cleanupIds: string[] = [];
let cleanup: Awaited<ReturnType<typeof cleanupRunFixtures>> = {};

const runSpecialist = async (suffix: string, message: string, options: {
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
  const dispatched = await dispatchHermesSkillPlan(observed.plan);
  return { conversationId, fixtures, observed, dispatched };
};

const run = async () => {
  await connectMongo();
  enableH05TestFlags();
  const results = [];

  try {
    results.push(await makeResult('incomplete booking requests next minimum data', async () => {
      const { dispatched } = await runSpecialist('incomplete', 'Quiero agendar una evaluacion.');
      const result = dispatched.result as HermesSkillResult;
      assert(result.status === 'NEEDS_INPUT', 'incomplete booking should request input');
      assert(result.details?.prioritizedMissingField === 'customer_identity', 'next missing field should be customer identity');
      assert(result.details?.specialistState === 'COLLECTING_REQUIRED_DATA', 'state should remain collecting');
    }));

    results.push(await makeResult('relative preference registers tomorrow at four as unverified', async () => {
      const { dispatched } = await runSpecialist('relative-date', 'Quiero manana a las cuatro.');
      const result = dispatched.result as HermesSkillResult;
      assert(result.status === 'NEEDS_INPUT', 'relative preference alone should still need additional data');
      assert(result.details?.relativeDate === '2026-07-21', 'tomorrow should resolve to 2026-07-21');
      const temporalSlot = (result.details?.slots as any[]).find((slot) => slot.slot === 'temporal_preference');
      assert(temporalSlot?.status === 'inferred', 'temporal preference should be inferred from relative date');
    }));

    results.push(await makeResult('active process keeps owner and slot answer inside the process', async () => {
      const { observed, dispatched } = await runSpecialist('active-owner', 'A las cuatro.', {
        knownCustomer: true,
        processState: {
          status: 'WAITING_FOR_SLOT_SELECTION',
          selectedOffering: { _id: 'known-offering' },
        },
      });
      const result = dispatched.result as HermesSkillResult;
      assert(observed.plan.activeProcessOwner === 'scheduling-specialist', 'owner should remain scheduling-specialist');
      assert(result.details?.possibleDuplicate === true, 'active continuation should mark possible duplicate');
      assert(
        result.status === 'ACTION_PROPOSAL' || result.status === 'NEEDS_INPUT',
        'active process should remain inside scheduling specialist'
      );
    }));

    results.push(await makeResult('side question preserves time preference and active process', async () => {
      const { dispatched } = await runSpecialist(
        'side-question',
        'Quiero manana a las cuatro. Cuanto dura la evaluacion?'
      );
      const result = dispatched.result as HermesSkillResult;
      const temporalSlot = (result.details?.slots as any[]).find((slot) => slot.slot === 'temporal_preference');
      assert(Boolean(temporalSlot?.value), 'time preference should be preserved');
      assert((result.details?.sideQuestion as any)?.type === 'duration', 'side question should be detected');
    }));

    results.push(await makeResult('correction keeps only the corrected plate active', async () => {
      const { dispatched } = await runSpecialist('correction', 'Quiero agendar una cita. Mi placa es ABC-123. Perdon, ABC-132.');
      const result = dispatched.result as HermesSkillResult;
      const correctedPlate = (result.details?.slots as any[]).find((slot) => slot.slot === 'managed_entity_plate');
      assert(correctedPlate?.value === 'ABC-132', 'corrected plate should remain active');
      assert(correctedPlate?.status === 'corrected', 'corrected plate should be marked as corrected');
    }));

    results.push(await makeResult('ambiguous request does not invent prior service', async () => {
      const { dispatched } = await runSpecialist('ambiguous', 'Quiero agendar lo de siempre.');
      const result = dispatched.result as HermesSkillResult;
      assert(result.status === 'NEEDS_INPUT', 'ambiguous request should require input');
      assert(result.details?.prioritizedMissingField === 'service', 'should ask for service instead of inventing prior service');
    }));

    results.push(await makeResult('complete semantic request yields non-executing action proposal', async () => {
      const { dispatched } = await runSpecialist(
        'proposal-ready',
        'Quiero agendar la Consulta basica H05 para Toyota 2019 manana a las cuatro. Mi telefono es 999111222.',
        { knownCustomer: true }
      );
      const result = dispatched.result as HermesSkillResult;
      assert(result.status === 'ACTION_PROPOSAL', 'complete request should yield action proposal');
      const proposal = result.details?.proposal as any;
      assert(proposal?.executionAllowed === false, 'proposal must remain non-executing');
      assert(proposal?.temporalPreference?.availabilityStatus === 'UNVERIFIED', 'availability must remain unverified');
    }));

    results.push(await makeResult('persisted skill result stays sanitized', async () => {
      const { conversationId } = await runSpecialist(
        'sanitized',
        'Quiero agendar la Consulta basica H05 para Toyota 2019 manana a las cuatro. Mi telefono es 999111222.',
        { knownCustomer: true }
      );
      const persisted: any = await CustomerInteraction.findOne({
        businessSlug: 'demo_test',
        conversationId,
        visibility: 'internal',
        interactionType: 'system_event',
        'metadata.runtimeMode': 'skill_dispatch_registry',
        'metadata.skillId': 'scheduling-specialist',
      }).sort({ createdAt: -1 }).lean().exec();
      assert(Boolean(persisted), 'skill result should persist');
      assert(!JSON.stringify(persisted.metadata || {}).includes('999111222'), 'raw phone leaked into specialist metadata');
    }));
  } finally {
    for (const id of cleanupIds) cleanup = await cleanupRunFixtures(id);
    await disconnectMongo();
  }

  printSummary('HERMES-06D Scheduling Specialist', results, cleanup);
};

run().catch(async (error) => {
  console.error(error);
  await disconnectMongo().catch(() => undefined);
  process.exit(1);
});
