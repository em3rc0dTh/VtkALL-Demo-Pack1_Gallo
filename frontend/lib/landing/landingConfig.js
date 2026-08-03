export const defaultLandingConfig = (profile = {}) => ({
  hero: {
    eyebrow: 'Plantilla madre neutral',
    title: profile.branding?.name || profile.businessSlug || 'Demo Test Laboratory',
    subtitle: 'Te orientamos sobre la oferta correcta, resolvemos dudas y coordinamos una consulta sin vueltas.',
    primaryCta: `Hablar con ${profile.agent?.name || 'Demo Agent'}`,
    secondaryCta: 'Ver catalogo',
  },
  visual: {
    title: 'Operacion conectada',
    chips: ['Catalogo', 'Disponibilidad', 'Caso', 'Seguimiento', 'Mensajes', 'Reserva'],
  },
  sections: {
    servicesTitle: 'Catalogo de servicios',
    servicesDescription: 'Ofertas activas leidas desde el backend comercial.',
    aboutTitle: 'Sobre el pack',
    aboutBody: 'Pack 0 combina contratos, persistencia, Temporal, idempotencia y runtime Hermes en una base reutilizable.',
    galleryTitle: 'Flujo base',
    galleryItems: ['Interaccion', 'Caso', 'Disponibilidad', 'Cita'],
    contactTitle: 'Quieres reservar?',
    contactBody: 'Demo Agent te ayuda a elegir oferta, resolver dudas y coordinar la cita.',
  },
});

export const getLandingConfig = (profile = {}) => {
  const fallback = defaultLandingConfig(profile);
  const landing = profile.landing || {};

  return {
    hero: { ...fallback.hero, ...(landing.hero || {}) },
    visual: { ...fallback.visual, ...(landing.visual || {}) },
    sections: { ...fallback.sections, ...(landing.sections || {}) },
  };
};
