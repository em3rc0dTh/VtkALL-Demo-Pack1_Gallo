import mongoose from 'mongoose';
import { env } from '../../config/env';
import { inspectDemoTestSeed } from '../../services/demoTest';

const businessSlugs = process.env.DEMO_TEST_BUSINESS_SLUG
  ? [process.env.DEMO_TEST_BUSINESS_SLUG]
  : ['demo_test', 'turagua'];

const connectForVerification = async () => {
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
};

const printCollection = (name: string, value: { count: number; sampleIds: string[] }) => {
  console.log(`${name}:`);
  console.log(`  count: ${value.count}`);
  console.log(`  sample ids: ${value.sampleIds.length ? value.sampleIds.join(', ') : '(none)'}`);
};

const run = async () => {
  try {
    await connectForVerification();
    for (const businessSlug of businessSlugs) {
      console.log('demo_test Seed Inspection');
      console.log(`businessSlug: ${businessSlug}`);
      const report = await inspectDemoTestSeed(businessSlug);

      printCollection('WorkTeams', report.workTeams);
      printCollection('WorkTeamScheduleRules', report.workTeamScheduleRules);
      printCollection('WorkTeamScheduleOverrides', report.workTeamScheduleOverrides);
      printCollection('CatalogOfferings', report.catalogOfferings);
      printCollection('ResourceReservations', report.resourceReservations);
      console.log(`  blocking count held/booked: ${report.resourceReservations.blockingCount}`);
      console.log(`  expired holds count: ${report.resourceReservations.expiredHoldsCount}`);
      printCollection('Appointments', report.appointments);
      printCollection('Cases', report.cases);
      console.log('Conclusion:');
      console.log(`  seed sufficient: ${report.conclusion.seedSufficient ? 'yes' : 'no'}`);
      console.log(`  cleanup recommended: ${report.conclusion.cleanupRecommended ? 'yes' : 'no'}`);
      console.log(`  reset recommended: ${report.conclusion.resetRecommended ? 'yes' : 'no'}`);
      console.log(`  proposed action: ${report.conclusion.proposedAction}`);
      if (!report.conclusion.seedSufficient) {
        process.exitCode = 1;
      }
    }
  } catch (error) {
    console.log('Seed inspection skipped due to Mongo host/auth blocker.');
    console.log(`Reason: ${error instanceof Error ? error.message : String(error)}`);
    console.log('No .env or DB data was changed.');
  } finally {
    await mongoose.disconnect();
  }
};

run();
