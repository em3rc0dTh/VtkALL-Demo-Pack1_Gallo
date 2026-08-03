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

export const LANDING_FRAME_HEIGHTS = ['viewport', 'compact', 'content'];

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
  motion: 'signature',
  agent: {
    name: 'Iris',
    avatarUrl: 'https://i.ibb.co/84r9sJc/imagen-2026-06-08-153923818.png',
    bannerUrl: '/images/turagua.jpg',
    welcomeMessage: '¡Hola! 👋 Soy Iris, del equipo de Turagua Racing Perú. ¿En qué te puedo ayudar hoy?',
    nameColor: '#0f172a',
    avatarAlignment: 'left',
  },
  blocks: [
    {
      id: 'hero',
      type: 'hero',
      enabled: true,
      order: 10,
      frameHeight: 'viewport',
      layout: { variant: 'turagua_legacy', media: 'background', align: 'right' },
      data: {
        variant: 'turagua_legacy',
        eyebrow: 'Turagua Racing Peru',
        brandMode: 'business',
        title: 'Tu vehiculo protegido, restaurado y listo para exigir',
        titleHighlight: 'mas.',
        backdropText: 'Turagua Racing Peru',
        subtitle: 'Especialistas en proteccion inferior, restauracion de chasis, undercoating, arenado y soluciones automotrices pensadas para resistir oxido, desgaste, humedad y uso extremo.',
        supportingText: 'Trabajamos con procesos tecnicos, materiales de calidad y atencion personalizada para proteger, restaurar y mejorar la apariencia de tu vehiculo.',
        primaryCta: 'Agendar cita',
        secondaryCta: 'Ver servicios',
        heroMediaUrl: '/images/galeria_taller.png',
        promotions: [
          { eyebrow: 'Servicio destacado', title: 'Arenado + Undercoating', cta: 'Obtener', position: 'bottom-left' },
          { eyebrow: 'Promo de lanzamiento', title: 'Especial Web: 20% OFF en Planchado y Pintura', cta: 'Obtener', position: 'bottom-left' },
        ],
        stats: [
          { label: 'Trayectoria', value: '10+ Anos' },
          { label: 'Rating promedio', value: '4.9' },
          { label: 'Agenda asistida', value: 'Iris' },
        ],
      },
    },
    {
      id: 'catalog',
      type: 'catalog',
      enabled: true,
      order: 20,
      frameHeight: 'viewport',
      layout: { variant: 'turagua_catalog_frame' },
      data: {
        title: 'Nuestros Servicios',
        subtitle: 'Selecciona el servicio que necesita tu vehiculo: undercoating, arenado, pintura, mantenimiento, estetica o preparacion off-road.',
        featuredOfferingIds: [
          'off_turagua_general_diagnostic',
          'off_turagua_preventive_maintenance',
          'off_turagua_brake_service',
          'off_turagua_lavado_premium',
          'off_turagua_prepurchase_inspection',
          'off_turagua_sandblasting_undercoating',
        ],
      },
    },
    {
      id: 'agent',
      type: 'agent_call_to_action',
      enabled: true,
      order: 30,
      frameHeight: 'compact',
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
    brand: { displayName: 'Turagua', logoUrl: '/images/turagua.jpg', tagline: 'Proteccion & estetica automotriz' },
    contact: { primaryPhone: '+51 999 555 010', whatsapp: '+51 999 555 010', email: 'contacto@turagua.pe' },
    locations: [{ id: 'turagua-main', name: 'Taller principal', addressLine: 'Lima, Peru', city: 'Lima', country: 'Peru' }],
    commercialHours: { weekdays: '9:00 a 18:00', saturday: '9:00 a 18:00', sunday: 'Cerrado', summary: 'Lunes a sabado, 9:00 a 18:00' },
    agent: {
      name: 'Iris',
      avatarUrl: 'https://i.ibb.co/84r9sJc/imagen-2026-06-08-153923818.png',
      bannerUrl: '/images/turagua.jpg',
      welcomeMessage: '¡Hola! 👋 Soy Iris, del equipo de Turagua Racing Perú. ¿En qué te puedo ayudar hoy?',
      nameColor: '#0f172a',
      avatarAlignment: 'left',
    },
  },
  catalogOfferings: [
    { _id: 'off_turagua_general_diagnostic', name: 'Diagnostico general', description: 'Revision integral del vehiculo.', publicVisible: true },
    { _id: 'off_turagua_preventive_maintenance', name: 'Mantenimiento preventivo', description: 'Servicio programado por kilometraje.', publicVisible: true },
    { _id: 'off_turagua_lavado_premium', name: 'Lavado premium', description: 'Limpieza profunda interior y exterior.', publicVisible: true },
    { _id: 'off_turagua_sandblasting_undercoating', name: 'Arenado + Undercoating', description: 'Proteccion inferior contra oxido y desgaste.', publicVisible: true },
  ],
};
