export const LANDING_BLOCK_TYPES = [
  'hero',
  'catalog',
  'stats',
  'about',
  'gallery',
  'testimonials',
  'promotion',
  'call_to_action',
  'contact',
  'agent_call_to_action',
  'structured_content',
  'footer',
];

export const isAllowedLandingBlockType = (type) => LANDING_BLOCK_TYPES.includes(type);

export const sortLandingBlocks = (blocks = []) =>
  blocks
    .filter((block) => block?.enabled !== false && isAllowedLandingBlockType(block.type))
    .sort((left, right) => Number(left.order || 0) - Number(right.order || 0));

export const cloneLandingContent = (content) => JSON.parse(JSON.stringify(content));

export const defaultLandingContent = {
  theme: {
    primary: '#1d4ed8',
    accent: '#f59e0b',
    surface: '#f8fafc',
    text: '#0f172a',
  },
  navigation: [
    { label: 'Servicios', href: '#servicios' },
    { label: 'Contacto', href: '#contacto' },
  ],
  blocks: [
    {
      id: 'hero',
      type: 'hero',
      enabled: true,
      order: 10,
      data: {
        eyebrow: 'Turagua Auto Services',
        title: 'Diagnostico y cuidado automotriz con agenda asistida',
        subtitle: 'Servicios mecanicos, estetica y proteccion conectados a la plataforma operativa Pack0.',
        primaryCta: 'Agendar con Iris',
        secondaryCta: 'Explorar servicios',
        imageUrl: '/window.svg',
      },
    },
    {
      id: 'catalog',
      type: 'catalog',
      enabled: true,
      order: 20,
      data: {
        title: 'Catalogo Turagua',
        subtitle: 'Servicios publicados desde CatalogOffering.',
      },
    },
    {
      id: 'agent',
      type: 'agent_call_to_action',
      enabled: true,
      order: 30,
      data: {
        title: 'Agenda con Iris',
        body: 'El agente opera sobre Hermes y Temporal.',
        cta: 'Abrir chat',
      },
    },
  ],
};

export const mockLandingPayload = {
  landingPage: {
    _id: 'landing_turagua_home',
    businessSlug: 'turagua',
    pageSlug: 'home',
    title: 'Turagua Landing',
    status: 'published',
    draft: defaultLandingContent,
    published: defaultLandingContent,
    publishedVersion: 1,
  },
  content: defaultLandingContent,
  businessProfile: {
    businessSlug: 'turagua',
    businessName: 'Turagua Auto Services',
    brand: { displayName: 'Turagua' },
    agent: { name: 'Iris' },
  },
  catalogOfferings: [
    { _id: 'off_general_diagnostic', name: 'Diagnostico general', description: 'Revision integral del vehiculo.', publicVisible: true },
    { _id: 'off_preventive_maintenance', name: 'Mantenimiento preventivo', description: 'Servicio programado por kilometraje.', publicVisible: true },
    { _id: 'off_lavado_premium', name: 'Lavado premium', description: 'Limpieza profunda interior y exterior.', publicVisible: true },
  ],
};
