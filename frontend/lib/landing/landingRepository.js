import { apiRequest } from '@/lib/api/apiClient';
import { requireDemoTestDataMode } from '@/lib/config/demoTestDataMode';
import { cloneLandingContent, mockLandingPayload } from './landingContract';
import { galloMockLandingPayload } from './galloLandingContract';

const adminHeaders = () => ({
  'X-Demo-Test-Admin-Token': process.env.NEXT_PUBLIC_DEMO_TEST_ADMIN_WRITE_TOKEN || 'local-dev-admin',
});

const unwrap = (response) => response?.data || response;

const mockPayloadFor = (businessSlug) => businessSlug === 'gallo' ? galloMockLandingPayload : mockLandingPayload;

const mapGalloContent = (content, mapper) => {
  if (!content?.blocks) return content;
  const next = cloneLandingContent(content);
  next.blocks = next.blocks.map((block) => {
    const variant = block?.layout?.variant || block?.data?.variant;
    if (variant !== 'gallo_contact_scene') return block;
    return { ...block, data: mapper({ ...(block.data || {}) }) };
  });
  return next;
};

const encodeGalloPresentationSnapshots = (content) => mapGalloContent(content, (data) => ({
  ...data,
  displayAddress: data.address || data.displayAddress || '',
  displayHours: Array.isArray(data.hours) ? data.hours : (Array.isArray(data.displayHours) ? data.displayHours : []),
}));

const decodeGalloPresentationSnapshots = (content) => mapGalloContent(content, (data) => ({
  ...data,
  address: data.address || data.displayAddress || '',
  hours: Array.isArray(data.hours) && data.hours.length ? data.hours : (Array.isArray(data.displayHours) ? data.displayHours : []),
}));

const hydrateGalloPayload = (payload, businessSlug) => {
  if (businessSlug !== 'gallo' || !payload) return payload;
  return {
    ...payload,
    content: decodeGalloPresentationSnapshots(payload.content),
    landingPage: payload.landingPage ? {
      ...payload.landingPage,
      draft: decodeGalloPresentationSnapshots(payload.landingPage.draft),
      published: decodeGalloPresentationSnapshots(payload.landingPage.published),
    } : payload.landingPage,
  };
};

export const landingRepository = {
  async getPublicLandingPage({ businessSlug = 'turagua', pageSlug = 'home' } = {}) {
    if (requireDemoTestDataMode() !== 'api') {
      const mockPayload = mockPayloadFor(businessSlug);
      return hydrateGalloPayload({
        ...mockPayload,
        content: cloneLandingContent(mockPayload.content),
      }, businessSlug);
    }

    const response = await apiRequest(`/api/v1/public/landing-pages/${encodeURIComponent(businessSlug)}/${encodeURIComponent(pageSlug)}`);
    return hydrateGalloPayload(unwrap(response), businessSlug);
  },

  async getAdminLandingPage({ businessSlug = 'turagua', pageSlug = 'home' } = {}) {
    if (requireDemoTestDataMode() !== 'api') {
      const mockPayload = mockPayloadFor(businessSlug);
      return hydrateGalloPayload({
        landingPage: {
          ...mockPayload.landingPage,
          draft: cloneLandingContent(mockPayload.content),
        },
        businessProfile: mockPayload.businessProfile,
        versions: [{ _id: `mock_${businessSlug}_v1`, version: 1, action: 'seed', title: 'Mock seed' }],
      }, businessSlug);
    }

    const response = await apiRequest(`/api/v1/admin/landing-pages/${encodeURIComponent(businessSlug)}/${encodeURIComponent(pageSlug)}`);
    return hydrateGalloPayload(unwrap(response), businessSlug);
  },

  async saveDraft({ businessSlug = 'turagua', pageSlug = 'home', title, draft }) {
    const persistedDraft = businessSlug === 'gallo' ? encodeGalloPresentationSnapshots(draft) : draft;
    const response = await apiRequest(`/api/v1/admin/landing-pages/${encodeURIComponent(businessSlug)}/${encodeURIComponent(pageSlug)}`, {
      method: 'PATCH',
      headers: adminHeaders(),
      body: JSON.stringify({ title, draft: persistedDraft }),
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
