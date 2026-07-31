import { ApiError } from '../api/apiError';

const getActiveProfiles = (payload) => {
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  return rows.filter((profile) => profile?.active !== false);
};

const toFrontendBusinessProfile = (profile) => ({
  ...profile,
  branding: profile.branding || {
    name: profile.brand?.displayName || profile.businessName || profile.businessSlug,
    displayName: profile.brand?.displayName || profile.businessName || profile.businessSlug,
  },
  timezone: profile.timezone || profile.brand?.timezone || 'America/Lima',
  labels: profile.labels || {},
  features: profile.features || {},
});

export function assertBusinessProfileListResponse(payload, { businessSlug }) {
  if (!payload || !Array.isArray(payload.data)) {
    throw new ApiError({
      code: 'INVALID_BUSINESS_PROFILE_RESPONSE',
      message: 'BusinessProfile response envelope is invalid.',
      status: 500,
      kind: 'invalid_response',
      details: { businessSlug },
    });
  }

  const profiles = getActiveProfiles(payload).filter((profile) => profile.businessSlug === businessSlug);

  if (profiles.length === 0) {
    throw new ApiError({
      code: 'BUSINESS_PROFILE_NOT_FOUND',
      message: `No active BusinessProfile found for ${businessSlug}.`,
      status: 404,
      kind: 'integration_configuration',
      details: { businessSlug, meta: payload.meta || null },
    });
  }

  if (profiles.length > 1) {
    throw new ApiError({
      code: 'BUSINESS_PROFILE_AMBIGUOUS',
      message: `More than one active BusinessProfile found for ${businessSlug}.`,
      status: 409,
      kind: 'integration_configuration',
      details: { businessSlug, count: profiles.length, ids: profiles.map((profile) => profile._id) },
    });
  }

  return {
    businessProfile: toFrontendBusinessProfile(profiles[0]),
    executionContext: payload.executionContext || null,
    meta: payload.meta || null,
  };
}
