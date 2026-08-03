import mongoose from 'mongoose';
import { env } from '../../config/env';
import { BusinessProfile } from '../../models/BusinessProfile.model';
import { CatalogOffering } from '../../models/CatalogOffering.model';
import { LandingPage } from '../../models/LandingPage.model';
import { WorkTeam } from '../../models/WorkTeam.model';
import { WorkTeamScheduleRule } from '../../models/WorkTeamScheduleRule.model';
import { getAvailability, inspectDemoTestSeed } from '../../services/demoTest';
import { seedDatabase } from '../../services/seed.service';

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

const assertCondition = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const countTuraguaOperationalSeed = async () => ({
  businessProfiles: await BusinessProfile.countDocuments({ businessSlug: 'turagua' }).exec(),
  catalogOfferings: await CatalogOffering.countDocuments({ businessSlug: 'turagua' }).exec(),
  workTeams: await WorkTeam.countDocuments({ businessSlug: 'turagua' }).exec(),
  workTeamScheduleRules: await WorkTeamScheduleRule.countDocuments({ businessSlug: 'turagua' }).exec(),
});

const assertTuraguaOperationalSeed = async () => {
  const businessProfile = await BusinessProfile.findOne({ businessSlug: 'turagua', active: true }).lean().exec() as any;
  assertCondition(businessProfile, 'Turagua BusinessProfile must exist and be active.');
  assertCondition(businessProfile.businessName === 'Turagua Racing Peru', 'Turagua BusinessProfile businessName mismatch.');
  assertCondition(businessProfile.verticalType === 'vehicle_service', 'Turagua verticalType must be vehicle_service.');
  assertCondition(businessProfile.brand?.timezone === 'America/Lima', 'Turagua timezone must be America/Lima.');
  assertCondition(businessProfile.agent?.name === 'Iris', 'Turagua agent name must be Iris.');
  assertCondition(businessProfile.agent?.enabled === true, 'Turagua agent must be enabled.');

  const team = await WorkTeam.findOne({ _id: 'team_turagua_service', businessSlug: 'turagua', active: true }).lean().exec();
  assertCondition(team, 'Turagua WorkTeam team_turagua_service must exist and be active.');

  const expectedRuleIds = [
    'rule_turagua_service_mon_0900_1700',
    'rule_turagua_service_tue_0900_1700',
    'rule_turagua_service_wed_0900_1700',
    'rule_turagua_service_thu_0900_1700',
    'rule_turagua_service_fri_0900_1700',
  ];
  const rules = await WorkTeamScheduleRule.find({ _id: { $in: expectedRuleIds }, businessSlug: 'turagua' }).lean().exec() as any[];
  assertCondition(rules.length === expectedRuleIds.length, 'Turagua must have weekday service rules Monday-Friday.');
  for (const rule of rules) {
    assertCondition(rule.teamId === 'team_turagua_service', `Turagua rule ${rule._id} must target team_turagua_service.`);
    assertCondition(rule.startTime === '09:00' && rule.endTime === '17:00', `Turagua rule ${rule._id} must run 09:00-17:00.`);
    assertCondition(rule.active === true, `Turagua rule ${rule._id} must be active.`);
  }

  const landing = await LandingPage.findOne({ businessSlug: 'turagua', pageSlug: 'home', status: 'published' }).lean().exec() as any;
  assertCondition(landing?.published, 'Turagua published landing must exist.');
  const catalogBlock = landing.published.blocks.find((block: any) => block.type === 'catalog');
  const featuredOfferingIds = catalogBlock?.data?.featuredOfferingIds || [];
  const expectedOfferingIds = [
    'off_turagua_general_diagnostic',
    'off_turagua_preventive_maintenance',
    'off_turagua_brake_service',
    'off_turagua_lavado_premium',
    'off_turagua_prepurchase_inspection',
    'off_turagua_sandblasting_undercoating',
  ];
  assertCondition(JSON.stringify(featuredOfferingIds) === JSON.stringify(expectedOfferingIds), 'Turagua landing featuredOfferingIds mismatch.');

  const offerings = await CatalogOffering.find({ _id: { $in: expectedOfferingIds }, businessSlug: 'turagua', active: true, publicVisible: true }).lean().exec() as any[];
  assertCondition(offerings.length === expectedOfferingIds.length, 'All Turagua landing offerings must exist in canonical catalog.');
  assertCondition(offerings.every((offering) => offering.businessSlug === 'turagua'), 'Every Turagua offering must belong to turagua.');
  assertCondition(
    offerings.some((offering) => offering._id === 'off_turagua_sandblasting_undercoating' && offering.name === 'Arenado + Undercoating'),
    'Arenado + Undercoating must be a real Turagua catalog offering.'
  );

  const serializedTuraguaSeed = JSON.stringify({ businessProfile, offerings, landing }).toLowerCase();
  assertCondition(!serializedTuraguaSeed.includes('bateylate'), 'Turagua seed must not include BateYLate content.');
  assertCondition(!serializedTuraguaSeed.includes('postre'), 'Turagua seed must not include dessert/postre content.');
  assertCondition(!serializedTuraguaSeed.includes('dessert'), 'Turagua seed must not include dessert content.');

  const availability = await getAvailability({
    businessSlug: 'turagua',
    catalogOfferingId: 'off_turagua_general_diagnostic',
    date: '2026-08-03',
    timezone: 'America/Lima',
  });
  assertCondition(availability.slots.length > 0, 'Turagua must produce availability from canonical services.');

  const before = await countTuraguaOperationalSeed();
  await seedDatabase(false, 'turagua');
  const after = await countTuraguaOperationalSeed();
  assertCondition(JSON.stringify(before) === JSON.stringify(after), 'Turagua seed must be idempotent without duplicates.');
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
      if (businessSlug === 'turagua') {
        await assertTuraguaOperationalSeed();
      }
    }
  } catch (error) {
    console.error('Seed inspection failed.');
    console.error(`Reason: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();
