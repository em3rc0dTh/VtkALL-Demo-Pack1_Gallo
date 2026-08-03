import assert from 'assert';
import { CustomerInteraction } from '../../../models/CustomerInteraction.model';
import { connectMongo, disconnectMongo } from './h04TestUtils';

const run = async () => {
  await connectMongo();
  const count = await CustomerInteraction.countDocuments({
    conversationId: /^hermes-h06b-desk-/,
  });
  assert.equal(count, 0, `H06B reception desk residue detected: ${count}`);
  await disconnectMongo();
  console.log('h06b-reception-desk-residue: PASS');
};

run().catch(async (error) => {
  console.error(error);
  await disconnectMongo().catch(() => undefined);
  process.exit(1);
});
