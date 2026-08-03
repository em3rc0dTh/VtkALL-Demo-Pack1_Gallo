import { BusinessProfile } from '../../../models/BusinessProfile.model';
import { BusinessPublicContext } from './hermesContext.contract';

export const readBusinessContext = async (businessSlug: string): Promise<BusinessPublicContext | undefined> => {
  const profile: any = await BusinessProfile.findOne({ businessSlug, active: { $ne: false } }).lean().exec();
  if (!profile || profile.businessSlug !== businessSlug) return undefined;
  return {
    businessSlug,
    businessName: profile.businessName || profile.brand?.name,
    verticalType: profile.verticalType,
    timezone: profile.timezone || profile.business?.timezone || 'America/Lima',
    agent: {
      name: profile.agent?.name,
      role: profile.agent?.role,
      personality: profile.agent?.personality,
    },
    features: {
      supportsAppointments: Boolean(profile.features?.supportsAppointments ?? true),
    },
  };
};
