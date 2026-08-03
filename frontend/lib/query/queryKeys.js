export const demoTestQueryKeys = {
  root: ['demo-test'],

  businessProfile: ({ businessSlug }) => [
    'demo-test',
    'business-profile',
    businessSlug,
  ],

  catalog: ({ businessSlug, verticalType }) => [
    'demo-test',
    'catalog',
    businessSlug,
    verticalType,
  ],

  availability: ({
    businessSlug,
    teamId,
    date,
    durationMinutes,
    timezone,
    catalogOfferingId,
    caseId,
  }) => [
    'demo-test',
    'availability',
    businessSlug,
    teamId,
    date,
    durationMinutes,
    timezone,
    catalogOfferingId,
    caseId,
  ],

  timeline: ({ businessSlug, caseId }) => [
    'demo-test',
    'timeline',
    businessSlug,
    caseId,
  ],
};
