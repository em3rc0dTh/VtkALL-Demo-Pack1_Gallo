const entities = [
  { path: 'business-profiles', tag: 'Business Profiles', name: 'BusinessProfile' },
  { path: 'catalog-offerings', tag: 'Catalog Offerings', name: 'CatalogOffering' },
  { path: 'customers', tag: 'Customers', name: 'Customer' },
  { path: 'managed-entities', tag: 'Managed Entities', name: 'ManagedEntity' },
  { path: 'cases', tag: 'Cases', name: 'Case' },
  { path: 'customer-interactions', tag: 'Customer Interactions', name: 'CustomerInteraction' },
  { path: 'appointments', tag: 'Appointments', name: 'Appointment' },
  { path: 'decision-records', tag: 'Decision Records', name: 'DecisionRecord' },
  { path: 'notifications', tag: 'Notifications', name: 'Notification' },
  { path: 'timeline-events', tag: 'Timeline Events', name: 'TimelineEvent' },
  { path: 'attachments', tag: 'Attachments', name: 'Attachment' },
  { path: 'availability-slots', tag: 'Availability Slots', name: 'AvailabilitySlot' },
  { path: 'work-teams', tag: 'Work Teams', name: 'WorkTeam' },
  { path: 'work-team-schedule-rules', tag: 'Work Team Schedule Rules', name: 'WorkTeamScheduleRule' },
  { path: 'work-team-schedule-overrides', tag: 'Work Team Schedule Overrides', name: 'WorkTeamScheduleOverride' },
  { path: 'resource-reservations', tag: 'Resource Reservations', name: 'ResourceReservation' }
];

const generateCrudPaths = () => {
  const paths: any = {};

  entities.forEach(entity => {
    paths[`/api/v1/${entity.path}`] = {
      get: {
        tags: [entity.tag],
        summary: `List ${entity.name}s`,
        description: `Returns a list of ${entity.name} items. Supports pagination and filtering.`,
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'businessSlug', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Successful response' }
        }
      },
      post: {
        tags: [entity.tag],
        summary: `Create a new ${entity.name}`,
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } }
        },
        responses: {
          201: { description: 'Created successfully' }
        }
      }
    };

    paths[`/api/v1/${entity.path}/{id}`] = {
      get: {
        tags: [entity.tag],
        summary: `Get a ${entity.name} by ID`,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Successful response' }, 404: { description: 'Not found' } }
      },
      put: {
        tags: [entity.tag],
        summary: `Replace a ${entity.name}`,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { 200: { description: 'Updated successfully' }, 404: { description: 'Not found' } }
      },
      patch: {
        tags: [entity.tag],
        summary: `Update a ${entity.name}`,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { 200: { description: 'Updated successfully' }, 404: { description: 'Not found' } }
      },
      delete: {
        tags: [entity.tag],
        summary: `Delete a ${entity.name}`,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 204: { description: 'Deleted successfully' }, 404: { description: 'Not found' } }
      }
    };
  });

  return paths;
};

const relationalPaths = {
  '/api/v1/customers/{id}/cases': { get: { tags: ['Customers'], summary: 'Get Cases for Customer', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Successful response' } } } },
  '/api/v1/customers/{id}/managed-entities': { get: { tags: ['Customers'], summary: 'Get Managed Entities for Customer', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Successful response' } } } },
  '/api/v1/cases/{id}/timeline': { get: { tags: ['Cases'], summary: 'Get Case Timeline', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Successful response' } } } },
  '/api/v1/cases/{id}/interactions': { get: { tags: ['Cases'], summary: 'Get Case Interactions', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Successful response' } } } },
  '/api/v1/cases/{id}/appointments': { get: { tags: ['Cases'], summary: 'Get Case Appointments', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Successful response' } } } },
  '/api/v1/cases/{id}/notifications': { get: { tags: ['Cases'], summary: 'Get Case Notifications', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Successful response' } } } },
  '/api/v1/cases/{id}/decisions': { get: { tags: ['Cases'], summary: 'Get Case Decisions', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Successful response' } } } },
  '/api/v1/managed-entities/{id}/cases': { get: { tags: ['Managed Entities'], summary: 'Get Cases for Managed Entity', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Successful response' } } } }
};

const adminPaths = {
  '/api/v1/admin/health': { get: { tags: ['Health'], summary: 'API Health Check', responses: { 200: { description: 'Successful response' } } } },
  '/api/v1/admin/seed': { post: { tags: ['Admin Seed'], summary: 'Seed database (Idempotent)', responses: { 200: { description: 'Successful response' } } } },
  '/api/v1/admin/seed/reset': { post: { tags: ['Admin Seed'], summary: 'Reset and seed database', responses: { 200: { description: 'Successful response' } } } },
  '/api/v1/admin/seed/status': { get: { tags: ['Admin Seed'], summary: 'Get seed status', responses: { 200: { description: 'Successful response' } } } },
};

const workflowPaths = {
  '/api/v1/workflow-data/catalog': { get: { tags: ['Workflow Data'], summary: 'Get workflow catalog', responses: { 200: { description: 'Successful response' } } } },
  '/api/v1/workflow-data/catalog/{id}/required-fields': { get: { tags: ['Workflow Data'], summary: 'Get required fields for appointment workflow', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Successful response' } } } },
  '/api/v1/workflow-data/availability': { get: { tags: ['Workflow Data'], summary: 'Get available team capacity slots', responses: { 200: { description: 'Successful response' } } } },
  '/api/v1/workflow-data/customer-context': { post: { tags: ['Workflow Data'], summary: 'Validate customer data for workflow', responses: { 200: { description: 'Successful response' } } } },
  '/api/v1/workflow-data/appointments/reserve': { post: { tags: ['Workflow Data'], summary: 'Reserve appointment and team capacity from workflow', responses: { 201: { description: 'Created successfully' }, 409: { description: 'Resource unavailable' } } } },
  '/api/v1/agent-sim/schedule-consultation/start': { post: { tags: ['Agent Sim'], summary: 'Start manual agent schedule consultation workflow', responses: { 201: { description: 'Created successfully' } } } },
  '/api/v1/agent-sim/workflows/{workflowId}/state': { get: { tags: ['Agent Sim'], summary: 'Get manual workflow state', parameters: [{ name: 'workflowId', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Successful response' } } } },
  '/api/v1/agent-sim/workflows/{workflowId}/message': { post: { tags: ['Agent Sim'], summary: 'Generate agent message from Temporal workflow state', parameters: [{ name: 'workflowId', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Successful response' } } } },
};

export const generatedPaths = {
  ...adminPaths,
  ...generateCrudPaths(),
  ...relationalPaths,
  ...workflowPaths
};
