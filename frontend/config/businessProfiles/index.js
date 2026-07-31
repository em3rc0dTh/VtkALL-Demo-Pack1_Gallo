import { demoTestBusinessProfile } from './demoTest.profile';
import { turaguaBusinessProfile } from './turagua.profile';

const businessProfilesBySlug = {
  [demoTestBusinessProfile.businessSlug]: demoTestBusinessProfile,
  [turaguaBusinessProfile.businessSlug]: turaguaBusinessProfile,
};

export function getMockBusinessProfile(businessSlug) {
  return businessProfilesBySlug[businessSlug] || null;
}

export const defaultMockBusinessProfile = demoTestBusinessProfile;
