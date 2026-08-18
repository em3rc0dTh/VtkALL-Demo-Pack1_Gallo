import { DEPTH_PRESETS, MOTION_PRESETS } from './galloPresentationRegistry';

const clone = (value) => JSON.parse(JSON.stringify(value));

const LEGACY_SCENE_META = {
  gallo_workshop_hero: { family: 'hero', anchor: 'inicio', navLabel: 'Inicio', singleton: true },
  gallo_partners_scene: { family: 'trust', anchor: 'confianza', navLabel: 'Confianza', singleton: true },
  gallo_services_scene: { family: 'catalog', anchor: 'servicios', navLabel: 'Servicios', singleton: true },
  gallo_diagnostic_scene: { family: 'diagnostic', anchor: 'diagnostico', navLabel: 'Diagnóstico', singleton: true },
  gallo_process_scene: { family: 'process', anchor: 'proceso', navLabel: 'Proceso', singleton: true },
  gallo_experience_scene: { family: 'about', anchor: 'nosotros', navLabel: 'Nosotros', singleton: true },
  gallo_evidence_scene: { family: 'evidence', anchor: 'evidencia', navLabel: 'Evidencia', singleton: true },
  gallo_contact_scene: { family: 'contact', anchor: 'contacto', navLabel: 'Contacto', singleton: true },
};

const slugify = (value = '') => String(value || '')
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 56);

const token = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const safeMotion = (value) => MOTION_PRESETS.some((item) => item.value === value) ? value : 'rise';
const safeDepth = (value) => DEPTH_PRESETS.some((item) => item.value === value) ? value : 'none';

export const REPEATABLE_SECTION_TEMPLATES = [
  {
    key: 'repeatable-split-media',
    label: 'Texto + media',
    family: 'editorial',
    description: 'Bloque repetible con texto, CTA opcional e imagen o video.',
    repeatable: true,
    block: {
      type: 'structured_content', enabled: true, frameHeight: 'viewport',
      layout: { variant: 'gallo_repeatable_split', align: 'left', media: 'side', density: 'comfortable' },
      data: {
        eyebrow: 'Nueva sección', title: 'Cuenta una parte de la historia.', body: 'Edita este texto desde el Landing Builder.',
        mediaUrl: '', ctaLabel: '', ctaTarget: 'contacto',
      },
    },
  },
  {
    key: 'repeatable-editorial',
    label: 'Editorial / Texto',
    family: 'editorial',
    description: 'Bloque tipográfico para mensajes, manifiestos o explicaciones largas.',
    repeatable: true,
    block: {
      type: 'structured_content', enabled: true, frameHeight: 'content',
      layout: { variant: 'gallo_repeatable_editorial', align: 'left', media: 'none', density: 'comfortable' },
      data: {
        eyebrow: 'Editorial', title: 'Una idea que merece espacio.', body: 'Escribe aquí el contenido editorial de esta sección.', quote: '',
      },
    },
  },
  {
    key: 'repeatable-feature-cards',
    label: 'Cards / Beneficios',
    family: 'features',
    description: 'Grid repetible de tarjetas para beneficios, capacidades o argumentos.',
    repeatable: true,
    block: {
      type: 'structured_content', enabled: true, frameHeight: 'viewport',
      layout: { variant: 'gallo_repeatable_cards', align: 'left', media: 'none', density: 'comfortable' },
      data: {
        eyebrow: 'Por qué importa', title: 'Tres ideas claras.', subtitle: '',
        cards: [
          { title: 'Punto uno', body: 'Explica el primer argumento.' },
          { title: 'Punto dos', body: 'Explica el segundo argumento.' },
          { title: 'Punto tres', body: 'Explica el tercer argumento.' },
        ],
      },
    },
  },
  {
    key: 'repeatable-gallery',
    label: 'Galería',
    family: 'gallery',
    description: 'Galería repetible de imágenes o videos con captions editables.',
    repeatable: true,
    block: {
      type: 'gallery', enabled: true, frameHeight: 'viewport',
      layout: { variant: 'gallo_repeatable_gallery', align: 'left', media: 'none', density: 'comfortable' },
      data: {
        eyebrow: 'Galería', title: 'Muestra el trabajo.', subtitle: '',
        items: [
          { mediaUrl: '', caption: 'Elemento 1' },
          { mediaUrl: '', caption: 'Elemento 2' },
          { mediaUrl: '', caption: 'Elemento 3' },
        ],
      },
    },
  },
  {
    key: 'repeatable-cta',
    label: 'CTA / Banner',
    family: 'cta',
    description: 'Llamado a la acción repetible con fondo opcional.',
    repeatable: true,
    block: {
      type: 'call_to_action', enabled: true, frameHeight: 'compact',
      layout: { variant: 'gallo_repeatable_cta', align: 'center', media: 'background', density: 'comfortable' },
      data: {
        eyebrow: 'Siguiente paso', title: '¿Listo para conversar?', subtitle: '', ctaLabel: 'Contactar a Gallo', ctaTarget: 'contacto', backgroundUrl: '',
      },
    },
  },
];

export const repeatableTemplateByKey = (key) => REPEATABLE_SECTION_TEMPLATES.find((template) => template.key === key) || null;

export const sectionInstanceFor = (block = {}, index = 0) => {
  const variant = block?.layout?.variant || block?.data?.variant || '';
  const legacy = LEGACY_SCENE_META[variant] || {};
  const explicit = block?.data?.instance || {};
  const fallbackAnchor = legacy.anchor || slugify(block.id || explicit.navLabel || block?.data?.title || `seccion-${index + 1}`) || `seccion-${index + 1}`;
  return {
    schemaVersion: 1,
    templateKey: explicit.templateKey || legacy.family || variant || 'custom',
    semanticFamily: explicit.semanticFamily || legacy.family || 'custom',
    anchor: slugify(explicit.anchor || fallbackAnchor) || `seccion-${index + 1}`,
    navLabel: explicit.navLabel || legacy.navLabel || block?.data?.title || `Sección ${index + 1}`,
    showInNavigation: explicit.showInNavigation ?? Boolean(legacy.navLabel),
    repeatable: explicit.repeatable ?? !legacy.singleton,
    motion: safeMotion(explicit.motion),
    depth: safeDepth(explicit.depth),
  };
};

export const withSectionInstance = (block, patch = {}, index = 0) => {
  const current = sectionInstanceFor(block, index);
  return {
    ...block,
    data: {
      ...(block?.data || {}),
      instance: {
        ...current,
        ...patch,
        schemaVersion: 1,
        anchor: slugify(patch.anchor ?? current.anchor) || current.anchor,
        motion: safeMotion(patch.motion ?? current.motion),
        depth: safeDepth(patch.depth ?? current.depth),
      },
    },
  };
};

export const createRepeatableSection = (templateKey, { order = 10 } = {}) => {
  const template = repeatableTemplateByKey(templateKey);
  if (!template) return null;
  const unique = token();
  const id = `gallo-section-${template.family}-${unique}`;
  const anchor = `${slugify(template.family)}-${unique}`;
  return {
    ...clone(template.block),
    id,
    order,
    data: {
      ...clone(template.block.data || {}),
      instance: {
        schemaVersion: 1,
        templateKey: template.key,
        semanticFamily: template.family,
        anchor,
        navLabel: template.label,
        showInNavigation: false,
        repeatable: true,
        motion: 'rise',
        depth: template.family === 'features' ? 'subtle' : 'none',
      },
    },
  };
};

export const normalizeSectionInstances = (blocks = []) => {
  const seenIds = new Set();
  const seenAnchors = new Set();
  return (Array.isArray(blocks) ? blocks : []).map((source, index) => {
    const block = clone(source);
    let id = String(block.id || `gallo-section-${index + 1}`);
    while (seenIds.has(id)) id = `${id}-${index + 1}`;
    seenIds.add(id);
    block.id = id;

    const instance = sectionInstanceFor(block, index);
    let anchor = instance.anchor;
    let suffix = 2;
    while (seenAnchors.has(anchor)) {
      anchor = `${instance.anchor}-${suffix}`;
      suffix += 1;
    }
    seenAnchors.add(anchor);
    return withSectionInstance(block, { ...instance, anchor }, index);
  });
};

export const sectionNavigation = (blocks = []) => normalizeSectionInstances(blocks)
  .filter((block) => block.enabled !== false)
  .map((block, index) => ({ block, instance: sectionInstanceFor(block, index) }))
  .filter(({ instance }) => instance.showInNavigation)
  .map(({ instance }) => ({ label: instance.navLabel, href: `#${instance.anchor}` }));
