import assert from 'assert';
import { countH06BResidue } from './h06bFixtures';
import { disconnectMongo } from '../../agent/hermes/tests/h04TestUtils';

const run = async () => {
  const counts = await countH06BResidue();
  for (const [key, value] of Object.entries(counts)) {
    assert.equal(value, 0, `H06B residue detected in ${key}: ${value}`);
  }
  await disconnectMongo();
  console.log(JSON.stringify({
    ok: true,
    counts,
  }, null, 2));
};

run().catch(async (error) => {
  console.error(error);
  await disconnectMongo().catch(() => undefined);
  process.exit(1);
});
