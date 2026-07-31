import { mockCatalogRepository } from './mockCatalogRepository';
import { apiRequest } from '../api/apiClient';
import { requireDemoTestDataMode } from '../config/demoTestDataMode';
import {
  assertCatalogOfferingPageResponse,
  assertCatalogOfferings,
} from '../contracts/catalogOffering.contract';

const apiCatalogRepository = {
  async getOfferings({ businessSlug, verticalType }) {
    const allOfferings = [];
    let page = 1;
    let totalPages = 1;
    let executionContext = null;

    do {
      const params = new URLSearchParams({
        businessSlug,
        active: 'true',
        page: String(page),
        limit: '100',
        sort: 'displayOrder,name,createdAt',
      });

      const response = await apiRequest(`/api/v1/catalog-offerings?${params.toString()}`, { method: 'GET' });
      const pageResult = assertCatalogOfferingPageResponse(response, { businessSlug });
      allOfferings.push(...pageResult.catalogOfferings);
      executionContext = pageResult.executionContext || executionContext;
      totalPages = Number(pageResult.meta?.totalPages || 1);
      page += 1;
    } while (page <= totalPages);

    return {
      ...assertCatalogOfferings(allOfferings, { businessSlug, verticalType }),
      executionContext,
      meta: {
        pagesLoaded: totalPages,
        paginationHandled: true,
      },
    };
  },
};

export const catalogRepository = {
  getOfferings: async (params) => {
    const mode = requireDemoTestDataMode();
    if (mode === 'api') {
      return apiCatalogRepository.getOfferings(params);
    }

    const catalogOfferings = await mockCatalogRepository.getOfferings(params);
    return {
      catalogOfferings,
      executionContext: null,
      meta: {
        pagesLoaded: 1,
        paginationHandled: true,
        simulator: true,
      },
    };
  }
};
