import { apiRequest } from '../api/apiClient';
import { getMockBusinessProfile } from '@/config/businessProfiles';
import { requireDemoTestDataMode } from '../config/demoTestDataMode';
import { assertBusinessProfileListResponse } from '../contracts/businessProfile.contract';

const apiBusinessProfileRepository = {
  async getBusinessProfile({ businessSlug }) {
    const params = new URLSearchParams({
      businessSlug,
      active: 'true',
      limit: '2',
      sort: 'businessSlug',
    });
    const response = await apiRequest(`/api/v1/business-profiles?${params.toString()}`, { method: 'GET' });
    return assertBusinessProfileListResponse(response, { businessSlug });
  },
};

const mockBusinessProfileRepository = {
  async getBusinessProfile({ businessSlug }) {
    const profile = getMockBusinessProfile(businessSlug);
    if (!profile) {
      return assertBusinessProfileListResponse({ data: [], meta: { page: 1, limit: 1, total: 0, totalPages: 0 } }, { businessSlug });
    }
    return {
      businessProfile: profile,
      executionContext: null,
      meta: { page: 1, limit: 1, total: 1, totalPages: 1 },
    };
  },
};

export const businessProfileRepository = {
  getBusinessProfile: async (params) => {
    const mode = requireDemoTestDataMode();
    return mode === 'api'
      ? apiBusinessProfileRepository.getBusinessProfile(params)
      : mockBusinessProfileRepository.getBusinessProfile(params);
  },
};
