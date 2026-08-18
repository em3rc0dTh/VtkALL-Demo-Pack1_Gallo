export const SERVICE_DISPLAY_MODES = [
  { value: 'cards', label: 'Cards', description: 'Tarjetas visuales equilibradas.' },
  { value: 'compact', label: 'Cards compactas', description: 'Más densidad con menor altura.' },
  { value: 'list', label: 'Lista', description: 'Lectura vertical clara y directa.' },
  { value: 'carousel', label: 'Carousel', description: 'Tarjetas grandes con desplazamiento horizontal.' },
  { value: 'rail', label: 'Rail horizontal', description: 'Carril compacto para explorar más opciones.' },
  { value: 'text', label: 'Texto / columnas', description: 'Presentación editorial con mínima decoración.' },
  { value: 'featured-grid', label: 'Featured grid', description: 'Primera categoría dominante y secundarias alrededor.' },
];

export const SERVICE_COLUMN_OPTIONS = [
  { value: '2', label: '2 columnas' },
  { value: '3', label: '3 columnas' },
  { value: '4', label: '4 columnas' },
];

export const MOTION_PRESETS = [
  { value: 'none', label: 'Sin animación' },
  { value: 'fade', label: 'Fade' },
  { value: 'rise', label: 'Rise' },
  { value: 'slide', label: 'Slide' },
  { value: 'stagger', label: 'Stagger' },
  { value: 'scale', label: 'Scale reveal' },
  { value: 'blur-reveal', label: 'Blur reveal' },
];

export const DEPTH_PRESETS = [
  { value: 'none', label: 'Sin profundidad' },
  { value: 'subtle', label: 'Profundidad sutil' },
  { value: 'tilt', label: 'Card tilt' },
  { value: 'layered', label: 'Capas / depth' },
];

export const DEFAULT_SERVICE_PRESENTATION = Object.freeze({
  displayMode: 'cards',
  columns: 3,
  showImage: true,
  showDescription: true,
  showPrice: true,
  showDuration: false,
  motion: 'rise',
  depth: 'subtle',
});

const clone = (value) => JSON.parse(JSON.stringify(value));

export const normalizeServicePresentation = (value = {}) => {
  const displayMode = SERVICE_DISPLAY_MODES.some((item) => item.value === value.displayMode)
    ? value.displayMode
    : DEFAULT_SERVICE_PRESENTATION.displayMode;
  const motion = MOTION_PRESETS.some((item) => item.value === value.motion)
    ? value.motion
    : DEFAULT_SERVICE_PRESENTATION.motion;
  const depth = DEPTH_PRESETS.some((item) => item.value === value.depth)
    ? value.depth
    : DEFAULT_SERVICE_PRESENTATION.depth;
  const columns = [2, 3, 4].includes(Number(value.columns))
    ? Number(value.columns)
    : DEFAULT_SERVICE_PRESENTATION.columns;

  return {
    ...DEFAULT_SERVICE_PRESENTATION,
    ...value,
    displayMode,
    motion,
    depth,
    columns,
    showImage: value.showImage !== false,
    showDescription: value.showDescription !== false,
    showPrice: value.showPrice !== false,
    showDuration: value.showDuration === true,
  };
};

const serviceGroups = [
  { title: 'Mecánica & mantenimiento', description: '', category: 'mecanica_mantenimiento', imageUrl: '' },
  { title: 'Diagnóstico & seguridad', description: '', category: 'diagnostico_seguridad', imageUrl: '' },
  { title: 'Carrocería & cuidado', description: '', category: 'carroceria_cuidado', imageUrl: '' },
];

export const SECTION_TEMPLATE_REGISTRY = [
  {
    key: 'hero-workshop',
    label: 'Hero · Workshop',
    family: 'hero',
    description: 'Entrada principal con media, CTA y autoridad de marca.',
    variant: 'gallo_workshop_hero',
    repeatable: false,
    block: {
      type: 'hero', enabled: true, frameHeight: 'viewport',
      layout: { variant: 'gallo_workshop_hero', media: 'background', align: 'left', density: 'comfortable' },
      data: {
        variant: 'gallo_workshop_hero', brandMode: 'business', eyebrow: 'Taller automotriz',
        title: 'Tu auto merece un taller que entienda lo que pasa antes de tocarlo.',
        subtitle: 'Explica la propuesta de valor de esta página.', supportingText: '',
        primaryCta: 'Contactar a Gallo', secondaryCta: 'Explorar servicios', heroMediaUrl: '', stats: [],
      },
    },
  },
  {
    key: 'partners-trust',
    label: 'Confianza · Marcas + Aseguradoras',
    family: 'trust',
    description: 'Escena editorial para relaciones verificadas.',
    variant: 'gallo_partners_scene',
    repeatable: false,
    block: {
      type: 'structured_content', enabled: true, frameHeight: 'viewport',
      layout: { variant: 'gallo_partners_scene', align: 'center', density: 'comfortable' },
      data: { eyebrow: 'Confianza', title: 'Marcas y aseguradoras', subtitle: '', brands: [], insurers: [] },
    },
  },
  {
    key: 'services-cards',
    label: 'Servicios · Cards',
    family: 'catalog',
    description: 'Catálogo con tarjetas visuales.',
    variant: 'gallo_services_scene',
    repeatable: false,
    block: {
      type: 'catalog', enabled: true, frameHeight: 'viewport',
      layout: { variant: 'gallo_services_scene', align: 'left', media: 'background', density: 'comfortable' },
      data: {
        eyebrow: 'Workshop', title: 'Servicios', subtitle: 'Oferta conectada al Catálogo de Servicios de Gallo.',
        serviceGroups,
        presentation: { ...DEFAULT_SERVICE_PRESENTATION, displayMode: 'cards' },
      },
    },
  },
  {
    key: 'services-carousel',
    label: 'Servicios · Carousel',
    family: 'catalog',
    description: 'Mismo catálogo, desplazamiento horizontal.',
    variant: 'gallo_services_scene',
    repeatable: false,
    block: {
      type: 'catalog', enabled: true, frameHeight: 'viewport',
      layout: { variant: 'gallo_services_scene', align: 'left', media: 'background', density: 'comfortable' },
      data: {
        eyebrow: 'Workshop', title: 'Servicios', subtitle: 'Oferta conectada al Catálogo de Servicios de Gallo.',
        serviceGroups,
        presentation: { ...DEFAULT_SERVICE_PRESENTATION, displayMode: 'carousel', columns: 3, depth: 'subtle' },
      },
    },
  },
  {
    key: 'services-list',
    label: 'Servicios · Lista',
    family: 'catalog',
    description: 'Lectura vertical con mínima fricción.',
    variant: 'gallo_services_scene',
    repeatable: false,
    block: {
      type: 'catalog', enabled: true, frameHeight: 'viewport',
      layout: { variant: 'gallo_services_scene', align: 'left', media: 'none', density: 'compact' },
      data: {
        eyebrow: 'Workshop', title: 'Servicios', subtitle: 'Oferta conectada al Catálogo de Servicios de Gallo.',
        serviceGroups,
        presentation: { ...DEFAULT_SERVICE_PRESENTATION, displayMode: 'list', showImage: false, depth: 'none' },
      },
    },
  },
  {
    key: 'diagnostic-split',
    label: 'Texto + media · Diagnóstico',
    family: 'split-media',
    description: 'Texto explicativo con imagen o video lateral.',
    variant: 'gallo_diagnostic_scene',
    repeatable: false,
    block: {
      type: 'structured_content', enabled: true, frameHeight: 'viewport',
      layout: { variant: 'gallo_diagnostic_scene', align: 'left', media: 'side', density: 'comfortable' },
      data: { eyebrow: 'Diagnóstico', title: 'Diagnóstico antes que suposición', subtitle: '', imageUrl: '', steps: [] },
    },
  },
  {
    key: 'process-grid',
    label: 'Proceso · Grid',
    family: 'process',
    description: 'Secuencia explicativa de pasos.',
    variant: 'gallo_process_scene',
    repeatable: false,
    block: {
      type: 'structured_content', enabled: true, frameHeight: 'viewport',
      layout: { variant: 'gallo_process_scene', align: 'center', density: 'comfortable' },
      data: { eyebrow: 'Así trabaja Gallo', title: 'Proceso', steps: [] },
    },
  },
  {
    key: 'about-depth',
    label: 'Historia · Media',
    family: 'about',
    description: 'Historia de marca con media y puntos de confianza.',
    variant: 'gallo_experience_scene',
    repeatable: false,
    block: {
      type: 'about', enabled: true, frameHeight: 'viewport',
      layout: { variant: 'gallo_experience_scene', align: 'left', media: 'background', density: 'comfortable' },
      data: { eyebrow: 'Gallo Autos', title: 'Nuestra experiencia', body: '', imageUrl: '', features: [] },
    },
  },
  {
    key: 'evidence-case',
    label: 'Evidencia · Caso',
    family: 'evidence',
    description: 'Espacio editorial reservado para evidencia aprobada.',
    variant: 'gallo_evidence_scene',
    repeatable: false,
    block: {
      type: 'testimonials', enabled: true, frameHeight: 'viewport',
      layout: { variant: 'gallo_evidence_scene', align: 'left', media: 'side', density: 'comfortable' },
      data: { eyebrow: 'Resultados que hablan', title: 'Evidencia', subtitle: '', imageUrl: '' },
    },
  },
  {
    key: 'contact-authority',
    label: 'Contacto · Datos Gallo',
    family: 'contact',
    description: 'CTA editorial con ubicación y horarios desde BusinessProfile.',
    variant: 'gallo_contact_scene',
    repeatable: false,
    block: {
      type: 'contact', enabled: true, frameHeight: 'viewport',
      layout: { variant: 'gallo_contact_scene', align: 'left', density: 'comfortable' },
      data: { eyebrow: 'Tu próximo paso', title: 'Cuéntanos qué está pasando con tu auto.', subtitle: '', primaryCta: 'Contactar a Gallo', note: 'Solicitud enviada ≠ cita confirmada.' },
    },
  },
];

export const templateByKey = (key) => SECTION_TEMPLATE_REGISTRY.find((template) => template.key === key) || null;

export const createSectionFromTemplate = (key, { id, order = 10 } = {}) => {
  const template = templateByKey(key);
  if (!template) return null;
  return {
    ...clone(template.block),
    id: id || `gallo-${template.family}-${Date.now()}`,
    order,
  };
};
