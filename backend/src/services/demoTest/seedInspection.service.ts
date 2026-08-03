import { Appointment } from '../../models/Appointment.model';
import { Case } from '../../models/Case.model';
import { CatalogOffering } from '../../models/CatalogOffering.model';
import { ResourceReservation } from '../../models/ResourceReservation.model';
import { WorkTeam } from '../../models/WorkTeam.model';
import { WorkTeamScheduleOverride } from '../../models/WorkTeamScheduleOverride.model';
import { WorkTeamScheduleRule } from '../../models/WorkTeamScheduleRule.model';
import { DemoTestSeedInspectionCollection, DemoTestSeedInspectionReport } from './types';

const sampleCollection = async (model: any, businessSlug: string): Promise<DemoTestSeedInspectionCollection> => {
  const [count, sample] = await Promise.all([
    model.countDocuments({ businessSlug }).exec(),
    model.find({ businessSlug }).select({ _id: 1 }).sort({ _id: 1 }).limit(5).lean().exec(),
  ]);

  return {
    count,
    sampleIds: sample.map((item: any) => String(item._id)),
  };
};

export const inspectDemoTestSeed = async (businessSlug = 'demo_test'): Promise<DemoTestSeedInspectionReport> => {
  const [
    workTeams,
    workTeamScheduleRules,
    workTeamScheduleOverrides,
    catalogOfferings,
    resourceReservations,
    appointments,
    cases,
    blockingCount,
    expiredHoldsCount,
  ] = await Promise.all([
    sampleCollection(WorkTeam, businessSlug),
    sampleCollection(WorkTeamScheduleRule, businessSlug),
    sampleCollection(WorkTeamScheduleOverride, businessSlug),
    sampleCollection(CatalogOffering, businessSlug),
    sampleCollection(ResourceReservation, businessSlug),
    sampleCollection(Appointment, businessSlug),
    sampleCollection(Case, businessSlug),
    ResourceReservation.countDocuments({ businessSlug, status: { $in: ['held', 'booked'] } }).exec(),
    ResourceReservation.countDocuments({ businessSlug, status: 'held', expiresAt: { $lt: new Date() } }).exec(),
  ]);

  const seedSufficient = workTeams.count > 0 && workTeamScheduleRules.count > 0 && catalogOfferings.count > 0;

  return {
    businessSlug,
    workTeams,
    workTeamScheduleRules,
    workTeamScheduleOverrides,
    catalogOfferings,
    resourceReservations: {
      ...resourceReservations,
      blockingCount,
      expiredHoldsCount,
    },
    appointments,
    cases,
    conclusion: {
      seedSufficient,
      cleanupRecommended: resourceReservations.count > 0 || appointments.count > 0,
      resetRecommended: false,
      proposedAction: seedSufficient ? 'none' : 'partial_cleanup',
    },
  };
};
