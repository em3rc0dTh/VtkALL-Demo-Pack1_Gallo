import { LandingContent } from './landing.contracts';

const catalogIds = [
  'off_general_diagnostic',
  'off_preventive_maintenance',
  'off_brake_service',
  'off_lavado_premium',
  'off_prepurchase_inspection',
  'off_sandblasting_undercoating',
];

export const demoTestLandingSeed: LandingContent = {
  theme: {
    primary: '#2563eb',
    accent: '#16a34a',
    surface: '#f8fafc',
    text: '#0f172a',
  },
  navigation: [
    { label: 'Servicios', href: '#servicios' },
    { label: 'Proceso', href: '#proceso' },
    { label: 'Contacto', href: '#contacto' },
  ],
  blocks: [
    {
      id: 'demo-hero',
      type: 'hero',
      enabled: true,
      order: 10,
      data: {
        eyebrow: 'Demo Test',
        title: 'Landing neutral para validar contratos Pack0',
        subtitle: 'Una experiencia publica sobria para probar catalogo, contacto y agente sin acoplarse a un vertical especifico.',
        primaryCta: 'Conversar con agente',
        secondaryCta: 'Ver catalogo',
        imageUrl: '/window.svg',
      },
    },
    {
      id: 'demo-catalog',
      type: 'catalog',
      enabled: true,
      order: 20,
      data: {
        title: 'Servicios disponibles',
        subtitle: 'Ofertas semilla del negocio actual.',
      },
    },
    {
      id: 'demo-agent',
      type: 'agent_call_to_action',
      enabled: true,
      order: 30,
      data: {
        title: 'Atencion asistida',
        body: 'El agente DemoTest usa los flujos Hermes y Temporal de Pack0.',
        cta: 'Iniciar conversacion',
      },
    },
    {
      id: 'demo-footer',
      type: 'footer',
      enabled: true,
      order: 40,
      data: {
        company: 'Demo Test Laboratory',
        note: 'Seed neutral para pruebas de contrato.',
      },
    },
  ],
};

export const turaguaLandingSeed: LandingContent = {
  theme: {
    primary: '#1d4ed8',
    accent: '#f59e0b',
    surface: '#f8fafc',
    text: '#0f172a',
  },
  navigation: [
    { label: 'Servicios', href: '#servicios' },
    { label: 'Taller', href: '#taller' },
    { label: 'Galeria', href: '#galeria' },
    { label: 'Contacto', href: '#contacto' },
  ],
  blocks: [
    {
      id: 'turagua-hero',
      type: 'hero',
      enabled: true,
      order: 10,
      data: {
        eyebrow: 'Turagua Auto Services',
        title: 'Diagnostico y cuidado automotriz con agenda asistida',
        subtitle: 'Servicios mecanicos, estetica y proteccion para autos modernos, conectados a la plataforma operativa Pack0.',
        primaryCta: 'Agendar con Iris',
        secondaryCta: 'Explorar servicios',
        imageUrl: '/window.svg',
      },
    },
    {
      id: 'turagua-stats',
      type: 'stats',
      enabled: true,
      order: 20,
      data: {
        items: [
          { label: 'Servicios activos', value: '8' },
          { label: 'Equipos', value: '4' },
          { label: 'Agenda', value: 'Hermes' },
        ],
      },
    },
    {
      id: 'turagua-catalog',
      type: 'catalog',
      enabled: true,
      order: 30,
      data: {
        title: 'Catalogo Turagua',
        subtitle: 'Diagnostico, mantenimiento, frenos, motor, detailing y proteccion.',
        featuredOfferingIds: catalogIds,
      },
    },
    {
      id: 'turagua-about',
      type: 'about',
      enabled: true,
      order: 40,
      data: {
        title: 'Operaciones claras desde el primer contacto',
        body: 'La landing publica mantiene el estilo comercial de Pack1, pero su informacion sale de BusinessProfile, CatalogOffering y el flujo de agente de Pack0.',
      },
    },
    {
      id: 'turagua-gallery',
      type: 'gallery',
      enabled: true,
      order: 50,
      data: {
        title: 'Areas de servicio',
        items: ['Diagnostico electronico', 'Mantenimiento preventivo', 'Lavado premium', 'Carroceria y proteccion'],
      },
    },
    {
      id: 'turagua-testimonials',
      type: 'testimonials',
      enabled: true,
      order: 60,
      data: {
        items: [
          { quote: 'Proceso claro, confirmacion rapida y seguimiento ordenado.', author: 'Cliente corporativo' },
          { quote: 'La asesora virtual ayudo a elegir el servicio antes de reservar.', author: 'Usuario particular' },
        ],
      },
    },
    {
      id: 'turagua-agent',
      type: 'agent_call_to_action',
      enabled: true,
      order: 70,
      data: {
        title: 'Iris puede ayudarte a reservar',
        body: 'El chat usa DemoTestAgentChat sobre el runtime Hermes/Temporal de Pack0.',
        cta: 'Abrir chat',
      },
    },
    {
      id: 'turagua-contact',
      type: 'contact',
      enabled: true,
      order: 80,
      data: {
        title: 'Contacto',
        phone: '+51 999 555 010',
        address: 'Lima, Peru',
        hours: 'Lunes a sabado, 9:00 a 18:00',
      },
    },
    {
      id: 'turagua-footer',
      type: 'footer',
      enabled: true,
      order: 90,
      data: {
        company: 'Turagua Auto Services',
        note: 'Landing reconstruida sobre contratos Pack0.',
      },
    },
  ],
};

export const landingSeeds = [
  {
    _id: 'landing_demo_test_home',
    businessSlug: 'demo_test',
    pageSlug: 'home',
    title: 'Demo Test Landing',
    status: 'published',
    draft: demoTestLandingSeed,
    published: demoTestLandingSeed,
    publishedVersion: 1,
  },
  {
    _id: 'landing_turagua_home',
    businessSlug: 'turagua',
    pageSlug: 'home',
    title: 'Turagua Landing',
    status: 'published',
    draft: turaguaLandingSeed,
    published: turaguaLandingSeed,
    publishedVersion: 1,
  },
];
