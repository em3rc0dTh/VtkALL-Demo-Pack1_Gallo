import fs from 'fs';
import path from 'path';
import { CustomerInteraction } from '../../../models/CustomerInteraction.model';
import { connectMongo, disconnectMongo } from './h04TestUtils';
import { countH06FResidue, forbiddenDtoTerms } from './h06fFixtures';

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const root = path.resolve(__dirname, '../../..');
const controllerPath = path.join(root, 'controllers', 'agentSim.controller.ts');
const e2ePath = path.join(root, 'agent', 'hermes', 'tests', 'h06fE2EShadow.test.ts');

const run = async () => {
  await connectMongo();
  try {
    const residue = await countH06FResidue();
    assert(residue.customerInteractions === 0, `H06F residue remains in CustomerInteraction: ${residue.customerInteractions}`);
    assert(residue.idempotencyRecords === 0, `H06F residue remains in IdempotencyRecord: ${residue.idempotencyRecords}`);
    assert(residue.appointments === 0, `H06F residue created appointment fixtures: ${residue.appointments}`);
    assert(residue.resourceReservations === 0, `H06F residue created reservation fixtures: ${residue.resourceReservations}`);

    const leakedVisible = await CustomerInteraction.countDocuments({
      conversationId: /^hermes-h06f-/,
      visibility: 'customer',
      $or: [
        { body: /dispatch plan|skill invocation|skill result|response candidate/i },
        { message: /dispatch plan|skill invocation|skill result|response candidate/i },
      ],
    });
    assert(leakedVisible === 0, 'H06F leaked internal Hermes artifacts into visible history.');

    const controllerSource = fs.readFileSync(controllerPath, 'utf8');
    assert(!/sendSingleResponse\([^)]*dispatchPlan/i.test(controllerSource), 'Controller is exposing dispatchPlan in public response.');
    assert(!/sendSingleResponse\([^)]*responseCandidate/i.test(controllerSource), 'Controller is exposing responseCandidate in public response.');

    const e2eSource = fs.readFileSync(e2ePath, 'utf8');
    assert(!/from '@temporalio\//.test(e2eSource), 'H06F.1 test imported Temporal directly.');
    assert(!/createCustomer\(|createManagedEntity|createCase\(/.test(e2eSource), 'H06F.1 test introduced operational writes.');
    assert(forbiddenDtoTerms.length > 0, 'Forbidden DTO term registry is unexpectedly empty.');

    console.log('h06f-e2e-residue: PASS');
  } finally {
    await disconnectMongo();
  }
};

run().catch(async (error) => {
  console.error(error?.message || error);
  await disconnectMongo().catch(() => undefined);
  process.exit(1);
});
