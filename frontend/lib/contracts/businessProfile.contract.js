import { ApiError } from '../api/apiError';

const getActiveProfiles = (payload) => {
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  return rows.filter((profile) => profile?.active !== false);
};

const pickText = (...values) => values.find((value) => typeof value === 'string' && value.trim()) || '';
const hasOwn = (value, key) => Boolean(value && Object.prototype.hasOwnProperty.call(value, key));

const toFrontendBusinessProfile = (profile) => {
  const settingsBrand = profile.settings?.branding || {};
  const displayName = pickText(settingsBrand.displayName, profile.brand?.displayName, profile.branding?.displayName, profile.businessName, profile.businessSlug);
  const logoUrl = hasOwn(settingsBrand, 'logoUrl') ? pickText(settingsBrand.logoUrl) : pickText(profile.brand?.logoUrl, profile.branding?.logoUrl);
  const tagline = hasOwn(settingsBrand, 'tagline') ? pickText(settingsBrand.tagline) : pickText(profile.brand?.tagline, profile.branding?.tagline);

  return {
    ...profile,
    brand: {
      ...(profile.brand || {}),
      displayName,
      logoUrl,
      tagline,
    },
    branding: {
      ...(profile.branding || {}),
      name: displayName,
      displayName,
      logoUrl,
      tagline,
    },
    timezone: profile.timezone || profile.brand?.timezone || profile.settings?.branding?.timezone || 'America/Lima',
    labels: profile.labels || {},
    features: profile.features || {},
  };
};

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
