import { LandingContent } from './landing.contracts';

const catalogIds = [
  'off_turagua_general_diagnostic',
  'off_turagua_preventive_maintenance',
  'off_turagua_brake_service',
  'off_turagua_lavado_premium',
  'off_turagua_prepurchase_inspection',
  'off_turagua_sandblasting_undercoating',
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
      id: 'turagua-hero',
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
          {
            eyebrow: 'Servicio destacado',
            title: 'Arenado + Undercoating',
            cta: 'Obtener',
            message: 'Hola Iris, quiero informacion sobre Arenado + Undercoating.',
          },
          {
            eyebrow: 'Promo de lanzamiento',
            title: 'Especial Web: 20% OFF en Planchado y Pintura',
            cta: 'Obtener',
            message: 'Hola Iris, quiero la promo de lanzamiento de Planchado y Pintura.',
          },
        ],
      },
    },
    {
      id: 'turagua-stats',
      type: 'stats',
      enabled: true,
      order: 20,
      data: {
        items: [
          { label: 'Trayectoria ininterrumpida', value: '10+ Anos' },
          { label: 'Rating promedio', value: '4.9' },
          { label: 'Agenda asistida', value: 'Iris' },
        ],
      },
    },
    {
      id: 'turagua-catalog',
      type: 'catalog',
      enabled: true,
      order: 30,
      data: {
        title: 'Nuestros Servicios',
        subtitle: 'Selecciona el servicio que necesita tu vehiculo: undercoating, arenado, pintura, mantenimiento, estetica o preparacion off-road.',
        featuredOfferingIds: catalogIds,
      },
    },
    {
      id: 'turagua-about',
      type: 'about',
      enabled: true,
      order: 40,
      data: {
        eyebrow: 'Sobre Nosotros',
        title: 'Turagua Racing Peru Calidad, detalle y proteccion automotriz.',
        body: 'En Turagua Racing Peru nos especializamos en el cuidado, proteccion y renovacion de vehiculos. Nuestro trabajo combina experiencia, procesos tecnicos y atencion personalizada para entregar resultados visibles, duraderos y confiables.',
        imageUrl: '/images/sobre_nosotros.png',
        features: [
          { icon: 'sparkles', title: 'Mecanicos Certificados', body: 'Equipo con experiencia en estetica automotriz, proteccion inferior, restauracion visual y preparacion de vehiculos.' },
          { icon: 'trophy', title: 'Calidad de Repuestos', body: 'Todos nuestros mantenimientos se realizan con repuestos de la mejor calidad.' },
          { icon: 'wrench', title: 'Mecanica Especializada', body: 'Brindamos atencion personalizada y garantizada para cada vehiculo.' },
        ],
      },
    },
    {
      id: 'turagua-gallery',
      type: 'gallery',
      enabled: true,
      order: 50,
      data: {
        title: 'Explorar Servicios',
        items: [
          { title: 'Arenado', imageUrl: '/images/galeria_taller.png' },
          { title: 'Undercoating', imageUrl: '/images/galeria_detailing.png' },
          { title: 'Planchado y pintura', imageUrl: '/images/galeria_pintura.png' },
          { title: 'Estetica automotriz', imageUrl: '/images/galeria_planchado.png' },
        ],
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
        body: 'Quieres agendar una cita? Prueba a Iris aqui.',
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
        company: 'Turagua Racing Peru',
        note: 'Proteccion, restauracion y estetica automotriz.',
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
