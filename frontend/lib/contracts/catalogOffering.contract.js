import { ApiError } from '../api/apiError';

export function assertCatalogOfferingPageResponse(payload, { businessSlug }) {
  if (!payload || !Array.isArray(payload.data) || !payload.meta) {
    throw new ApiError({
      code: 'INVALID_CATALOG_OFFERING_RESPONSE',
      message: 'CatalogOffering response envelope is invalid.',
      status: 500,
      kind: 'invalid_response',
      details: { businessSlug },
    });
  }

  return {
    catalogOfferings: payload.data,
    executionContext: payload.executionContext || null,
    meta: payload.meta,
  };
}

export function assertCatalogOfferings(offerings, { businessSlug, verticalType }) {
  if (!businessSlug) {
    throw new ApiError({
      code: 'CATALOG_BUSINESS_SLUG_REQUIRED',
      message: 'businessSlug is required to load CatalogOffering reference data.',
      status: 400,
      kind: 'integration_configuration',
    });
  }

  const catalogOfferings = offerings.filter((offering) => (
    offering?.businessSlug === businessSlug &&
    offering.active !== false &&
    (!verticalType || !offering.verticalType || offering.verticalType === verticalType || businessSlug === 'demo_test')
  ));

  return {
    catalogOfferings,
  };
}
