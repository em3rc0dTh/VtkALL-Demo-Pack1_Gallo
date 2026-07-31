import assert from 'assert';
import { countH06DResidue } from './h06dFixtures';

const run = async () => {
  const counts = await countH06DResidue();
  for (const [key, value] of Object.entries(counts)) {
    assert.equal(value, 0, `H06D residue detected in ${key}: ${value}`);
  }
  console.log(JSON.stringify({
    ok: true,
    counts,
  }, null, 2));
};

run().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
