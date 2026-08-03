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
  async getBusinessProfileSettings({ businessSlug }) {
    const response = await apiRequest(`/api/v1/admin/business-profiles/${encodeURIComponent(businessSlug)}`);
    return response?.data || response;
  },
  async updateBusinessProfileSettings({ businessSlug, expectedVersion, changes }) {
    const response = await apiRequest(`/api/v1/admin/business-profiles/${encodeURIComponent(businessSlug)}`, {
      method: 'PATCH',
      headers: {
        'X-Demo-Test-Admin-Token': process.env.NEXT_PUBLIC_DEMO_TEST_ADMIN_WRITE_TOKEN || 'local-dev-admin',
      },
      body: JSON.stringify({ expectedVersion, changes }),
    });
    return response?.data || response;
  },
  async uploadBusinessLogo({ businessSlug, file }) {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_DEMO_TEST_API_BASE_URL || ''}/api/v1/admin/business-profiles/${encodeURIComponent(businessSlug)}/logo`, {
      method: 'POST',
      headers: {
        'X-Demo-Test-Admin-Token': process.env.NEXT_PUBLIC_DEMO_TEST_ADMIN_WRITE_TOKEN || 'local-dev-admin',
      },
      body: formData,
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || payload?.error) {
      const error = new Error(payload?.error?.message || 'No pudimos subir el logo.');
      error.code = payload?.error?.code;
      error.details = payload?.error?.details;
      throw error;
    }
    return payload?.data || payload;
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
  async getBusinessProfileSettings({ businessSlug }) {
    const profile = getMockBusinessProfile(businessSlug);
    const settings = profile?.settings || {};
    const location = settings.locations?.[0] || {};
    return {
      businessSlug,
      version: 0,
      branding: settings.branding || {},
      contact: settings.contact || {},
      primaryLocation: location,
      commercialHours: settings.commercialHours || {},
    };
  },
  async updateBusinessProfileSettings() {
    throw new Error('Ajustes editables requieren modo API.');
  },
  async uploadBusinessLogo() {
    throw new Error('Upload de logo requiere modo API.');
  },
};

export const businessProfileRepository = {
  getBusinessProfile: async (params) => {
    const mode = requireDemoTestDataMode();
    return mode === 'api'
      ? apiBusinessProfileRepository.getBusinessProfile(params)
      : mockBusinessProfileRepository.getBusinessProfile(params);
  },
  getBusinessProfileSettings: async (params) => {
    const mode = requireDemoTestDataMode();
    return mode === 'api'
      ? apiBusinessProfileRepository.getBusinessProfileSettings(params)
      : mockBusinessProfileRepository.getBusinessProfileSettings(params);
  },
  updateBusinessProfileSettings: async (params) => {
    const mode = requireDemoTestDataMode();
    return mode === 'api'
      ? apiBusinessProfileRepository.updateBusinessProfileSettings(params)
      : mockBusinessProfileRepository.updateBusinessProfileSettings(params);
  },
  uploadBusinessLogo: async (params) => {
    const mode = requireDemoTestDataMode();
    return mode === 'api'
      ? apiBusinessProfileRepository.uploadBusinessLogo(params)
      : mockBusinessProfileRepository.uploadBusinessLogo(params);
  },
};
