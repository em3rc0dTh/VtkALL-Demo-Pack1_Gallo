import { apiRequest } from '../api/apiClient';

const listEndpoints = {
  customers: '/api/v1/customers',
  managedEntities: '/api/v1/managed-entities',
  cases: '/api/v1/cases',
  appointments: '/api/v1/appointments',
  catalogOfferings: '/api/v1/catalog-offerings',
  customerInteractions: '/api/v1/customer-interactions',
  timelineEvents: '/api/v1/timeline-events',
  notifications: '/api/v1/notifications',
  workTeams: '/api/v1/work-teams',
  resourceReservations: '/api/v1/resource-reservations',
};

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
  const pageSize = params.limit || 100;
  const firstPage = assertListEnvelope(await apiRequest(buildPath(path, {
    ...params,
    page: 1,
    limit: pageSize,
  }), { method: 'GET' }), label);

  const totalPages = Number(firstPage.meta.totalPages) || 1;
  const pages = [firstPage];

  for (let page = 2; page <= totalPages; page += 1) {
    pages.push(assertListEnvelope(await apiRequest(buildPath(path, {
      ...params,
      page,
      limit: pageSize,
    }), { method: 'GET' }), label));
  }

  return {
    data: pages.flatMap((page) => page.data),
    meta: firstPage.meta,
    executionContext: firstPage.executionContext,
  };
};

const withoutArchived = (items = []) => items.filter((item) => !item?.archivedAt);

export const adminDataRepository = {
  async list(resource, { businessSlug, active, sort = '-createdAt', limit = 100 } = {}) {
    const path = listEndpoints[resource];

    if (!path) {
      throw new Error(`Unknown admin data resource: ${resource}`);
    }

    return getAllPages({
      path,
      label: resource,
      params: {
        businessSlug,
        active,
        sort,
        limit,
      },
    });
  },

  async getSnapshot({ businessSlug }) {
    const [
      customers,
      managedEntities,
      cases,
      appointments,
      catalogOfferings,
      customerInteractions,
      timelineEvents,
      notifications,
      workTeams,
      resourceReservations,
    ] = await Promise.all([
      this.list('customers', { businessSlug }),
      this.list('managedEntities', { businessSlug }),
      this.list('cases', { businessSlug }),
      this.list('appointments', { businessSlug }),
      this.list('catalogOfferings', { businessSlug, sort: 'name' }),
      this.list('customerInteractions', { businessSlug }),
      this.list('timelineEvents', { businessSlug }),
      this.list('notifications', { businessSlug }),
      this.list('workTeams', { businessSlug, active: true, sort: 'name' }),
      this.list('resourceReservations', { businessSlug }),
    ]);

    return {
      customers: customers.data,
      managedEntities: managedEntities.data,
      cases: cases.data,
      appointments: appointments.data,
      catalogOfferings: withoutArchived(catalogOfferings.data),
      customerInteractions: customerInteractions.data,
      timelineEvents: timelineEvents.data,
      notifications: notifications.data,
      workTeams: withoutArchived(workTeams.data),
      resourceReservations: resourceReservations.data,
    };
  },
};
