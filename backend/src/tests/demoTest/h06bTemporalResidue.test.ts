import assert from 'assert';
import { cleanupReadinessResidue, connectMongo, countReadinessResidue, disconnectMongo } from './h06bTemporalUtils';

const run = async () => {
  await connectMongo();

  const before = await countReadinessResidue();
  await cleanupReadinessResidue();
  const after = await countReadinessResidue();

  for (const [key, value] of Object.entries(after)) {
    assert.equal(value, 0, `Readiness residue detected in ${key}: ${value}`);
  }

  await disconnectMongo();
  console.log(JSON.stringify({
    ok: true,
    before,
    after,
  }, null, 2));
};

run().catch(async (error) => {
  console.error(error);
  await disconnectMongo().catch(() => undefined);
  process.exit(1);
});
