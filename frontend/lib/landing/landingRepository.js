import { apiRequest } from '@/lib/api/apiClient';
import { requireDemoTestDataMode } from '@/lib/config/demoTestDataMode';
import { cloneLandingContent, mockLandingPayload } from './landingContract';

const adminHeaders = () => ({
  'X-Demo-Test-Admin-Token': process.env.NEXT_PUBLIC_DEMO_TEST_ADMIN_WRITE_TOKEN || 'local-dev-admin',
});

const unwrap = (response) => response?.data || response;

export const landingRepository = {
  async getPublicLandingPage({ businessSlug = 'turagua', pageSlug = 'home' } = {}) {
    if (requireDemoTestDataMode() !== 'api') {
      return {
        ...mockLandingPayload,
        content: cloneLandingContent(mockLandingPayload.content),
      };
    }

    const response = await apiRequest(`/api/v1/public/landing-pages/${encodeURIComponent(businessSlug)}/${encodeURIComponent(pageSlug)}`);
    return unwrap(response);
  },

  async getAdminLandingPage({ businessSlug = 'turagua', pageSlug = 'home' } = {}) {
    if (requireDemoTestDataMode() !== 'api') {
      return {
        landingPage: {
          ...mockLandingPayload.landingPage,
          draft: cloneLandingContent(mockLandingPayload.content),
        },
        versions: [{ _id: 'mock_v1', version: 1, action: 'seed', title: 'Mock seed' }],
      };
    }

    const response = await apiRequest(`/api/v1/admin/landing-pages/${encodeURIComponent(businessSlug)}/${encodeURIComponent(pageSlug)}`);
    return unwrap(response);
  },

  async saveDraft({ businessSlug = 'turagua', pageSlug = 'home', title, draft }) {
    const response = await apiRequest(`/api/v1/admin/landing-pages/${encodeURIComponent(businessSlug)}/${encodeURIComponent(pageSlug)}`, {
      method: 'PATCH',
      headers: adminHeaders(),
      body: JSON.stringify({ title, draft }),
    });
    return unwrap(response);
  },

  async publish({ businessSlug = 'turagua', pageSlug = 'home' }) {
    const response = await apiRequest(`/api/v1/admin/landing-pages/${encodeURIComponent(businessSlug)}/${encodeURIComponent(pageSlug)}/publish`, {
      method: 'POST',
      headers: adminHeaders(),
    });
    return unwrap(response);
  },

  async restore({ businessSlug = 'turagua', pageSlug = 'home', version }) {
    const response = await apiRequest(`/api/v1/admin/landing-pages/${encodeURIComponent(businessSlug)}/${encodeURIComponent(pageSlug)}/versions/${encodeURIComponent(version)}/restore`, {
      method: 'POST',
      headers: adminHeaders(),
    });
    return unwrap(response);
  },
};
