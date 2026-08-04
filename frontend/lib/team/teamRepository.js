import { apiRequest } from '../api/apiClient';

const buildPath = (path, params = {}) => {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  });

  const query = search.toString();
  return query ? `${path}?${query}` : path;
};

const assertListEnvelope = (payload, label) => {
  if (!payload || !Array.isArray(payload.data) || !payload.meta) {
    throw new Error(`${label} response envelope is invalid`);
  }

  return {
    data: payload.data,
    meta: payload.meta,
    executionContext: payload.executionContext || null,
  };
};

const getAllPages = async ({ path, params, label }) => {
  const firstPage = assertListEnvelope(await apiRequest(buildPath(path, {
    ...params,
    page: 1,
  }), { method: 'GET' }), label);

  const totalPages = Number(firstPage.meta.totalPages) || 1;
  const pages = [firstPage];

  for (let page = 2; page <= totalPages; page += 1) {
    pages.push(assertListEnvelope(await apiRequest(buildPath(path, {
      ...params,
      page,
    }), { method: 'GET' }), label));
  }

  return {
    data: pages.flatMap((page) => page.data),
    meta: firstPage.meta,
    executionContext: firstPage.executionContext,
  };
};

export const teamRepository = {
  async getWorkTeams({ businessSlug }) {
    return getAllPages({
      path: '/api/v1/work-teams',
      label: 'WorkTeam',
      params: {
      businessSlug,
      limit: 100,
      sort: 'name',
      },
    });
  },

  async getResourceReservations({ businessSlug }) {
    return getAllPages({
      path: '/api/v1/resource-reservations',
      label: 'ResourceReservation',
      params: {
      businessSlug,
      limit: 100,
      sort: '-startAt',
      },
    });
  },
};
