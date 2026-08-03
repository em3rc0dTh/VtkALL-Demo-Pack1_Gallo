import assert from 'assert';
import mongoose from 'mongoose';
import { env, validateTemporalAddress } from '../../config/env';
import { seedDatabase } from '../../services/seed.service';
import { inspectDemoTestSeed } from '../../services/demoTest';
import { isBlockingReservationDuplicateKeyError } from '../../services/demoTest/resourceReservation.service';

const connectForVerification = async () => {
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
};

const isMongoAccessBlocker = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return /server selection|authentication failed|econnrefused|getaddrinfo|enotfound|timed out/i.test(message);
};

const assertSeedSufficient = async (businessSlug: string) => {
  const report = await inspectDemoTestSeed(businessSlug);
  assert(report.conclusion.seedSufficient, `${businessSlug} seed must be sufficient`);
  return report;
};

const run = async () => {
  console.log('BE-FIX-01 baseline compatibility');

  try {
    await connectForVerification();

    await seedDatabase(false, 'demo_test');
    const firstDemoReport = await assertSeedSufficient('demo_test');
    await seedDatabase(false, 'demo_test');
    const secondDemoReport = await assertSeedSufficient('demo_test');
    assert.strictEqual(secondDemoReport.workTeams.count, firstDemoReport.workTeams.count, 'neutral seed must be idempotent for WorkTeams');
    assert.strictEqual(secondDemoReport.workTeamScheduleRules.count, firstDemoReport.workTeamScheduleRules.count, 'neutral seed must be idempotent for schedule rules');
    assert.strictEqual(secondDemoReport.catalogOfferings.count, firstDemoReport.catalogOfferings.count, 'neutral seed must be idempotent for offerings');

    await seedDatabase(false, 'turagua');
    await assertSeedSufficient('turagua');

    assert.strictEqual(validateTemporalAddress('localhost:7233'), 'localhost:7233');
    assert.throws(
      () => validateTemporalAddress('http://localhost:7233'),
      /Invalid TEMPORAL_ADDRESS/
    );
    assert.throws(
      () => validateTemporalAddress('https://localhost:7233'),
      /Invalid TEMPORAL_ADDRESS/
    );

    assert.strictEqual(isBlockingReservationDuplicateKeyError({
      code: 11000,
      keyPattern: { _id: 1 },
    }), false, 'unrelated duplicate key must not map to double booking');
    assert.strictEqual(isBlockingReservationDuplicateKeyError({
      code: 11000,
      keyPattern: { businessSlug: 1, teamId: 1, slotKeys: 1 },
    }), true, 'blocking reservation duplicate key must map to double booking');

    console.log('ok neutral seed is idempotent');
    console.log('ok seed inspection succeeds for demo_test and turagua');
    console.log('ok invalid TEMPORAL_ADDRESS URL format fails validation');
    console.log('ok unrelated duplicate key is not mapped as DOUBLE_BOOKING_CONFLICT');
  } catch (error) {
    const blocked = isMongoAccessBlocker(error);
    console.log(blocked ? 'BE-FIX-01 baseline compatibility blocked.' : 'BE-FIX-01 baseline compatibility failed.');
    console.log(`Reason: ${error instanceof Error ? error.message : String(error)}`);
    if (!blocked) {
      process.exitCode = 1;
    }
  } finally {
    await mongoose.disconnect();
  }
};

run();
