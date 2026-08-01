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
    primary: '#00AEEF',
    accent: '#111827',
    surface: '#f4f5ff',
    text: '#3f3436',
  },
  navigation: [
    { label: 'Inicio', href: '#inicio' },
    { label: 'Servicios', href: '#servicios' },
    { label: 'Nosotros', href: '#nosotros' },
    { label: 'Contacto', href: '#contacto' },
  ],
  blocks: [
    {
      id: 'hero',
      type: 'hero',
      enabled: true,
      order: 10,
      data: {
        variant: 'turagua_legacy',
        eyebrow: 'Turagua Racing Peru',
        title: 'Tu vehiculo protegido, restaurado y listo para exigir',
        titleHighlight: 'mas.',
        backdropText: 'Turagua Racing Peru',
        subtitle: 'Especialistas en proteccion inferior, restauracion de chasis, undercoating, arenado y soluciones automotrices pensadas para resistir oxido, desgaste, humedad y uso extremo.',
        supportingText: 'Trabajamos con procesos tecnicos, materiales de calidad y atencion personalizada para proteger, restaurar y mejorar la apariencia de tu vehiculo.',
        primaryCta: 'Agendar cita',
        secondaryCta: 'Ver servicios',
        heroMediaUrl: '/images/galeria_taller.png',
        logoUrl: '/images/turagua.jpg',
        promotions: [
          { eyebrow: 'Servicio destacado', title: 'Arenado + Undercoating', cta: 'Obtener' },
          { eyebrow: 'Promo de lanzamiento', title: 'Especial Web: 20% OFF en Planchado y Pintura', cta: 'Obtener' },
        ],
      },
    },
    {
      id: 'catalog',
      type: 'catalog',
      enabled: true,
      order: 20,
      data: {
        title: 'Nuestros Servicios',
        subtitle: 'Selecciona el servicio que necesita tu vehiculo: undercoating, arenado, pintura, mantenimiento, estetica o preparacion off-road.',
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
