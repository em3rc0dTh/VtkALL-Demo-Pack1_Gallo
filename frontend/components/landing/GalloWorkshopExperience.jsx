'use client';

import { GalloWorkshopExperience as GalloWorkshopExperienceV3 } from './GalloWorkshopExperienceV3';

const sceneByVariant = {
  gallo_workshop_hero: 'inicio',
  gallo_partners_scene: 'confianza',
  gallo_services_scene: 'servicios',
  gallo_diagnostic_scene: 'diagnostico',
  gallo_process_scene: 'proceso',
  gallo_experience_scene: 'nosotros',
  gallo_evidence_scene: 'evidencia',
  gallo_contact_scene: 'contacto',
};

const navLabelByVariant = {
  gallo_workshop_hero: 'Inicio',
  gallo_partners_scene: 'Confianza',
  gallo_services_scene: 'Servicios',
  gallo_diagnostic_scene: 'Diagnóstico',
  gallo_process_scene: 'Proceso',
  gallo_experience_scene: 'Nosotros',
  gallo_contact_scene: 'Contacto',
};

const safeAlign = (value) => ['left', 'center', 'right'].includes(value) ? value : 'left';
const contentFrom = (payload) => payload?.content || payload?.landingPage?.published || payload?.landingPage?.draft;

function projectedPayload(payload) {
  const content = contentFrom(payload);
  if (!content) return payload;

  const visibleBlocks = [...(Array.isArray(content.blocks) ? content.blocks : [])]
    .filter((block) => block?.enabled !== false)
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));

  const navigation = visibleBlocks.flatMap((block) => {
    const variant = block?.layout?.variant || block?.data?.variant;
    const sceneId = sceneByVariant[variant];
    const label = navLabelByVariant[variant];
    return sceneId && label ? [{ label, href: `#${sceneId}` }] : [];
  });

  const projectedContent = { ...content, navigation };
  return {
    ...payload,
    content: projectedContent,
    landingPage: payload?.landingPage ? {
      ...payload.landingPage,
      draft: projectedContent,
      published: projectedContent,
    } : payload?.landingPage,
  };
}

function projectionCss(payload) {
  const content = contentFrom(payload);
  const blocks = Array.isArray(content?.blocks) ? content.blocks : [];

  return blocks.map((block) => {
    const variant = block?.layout?.variant || block?.data?.variant;
    const sceneId = sceneByVariant[variant];
    if (!sceneId) return '';

    const align = safeAlign(block?.layout?.align);
    const media = block?.layout?.media || 'background';
    const marginRule = align === 'center'
      ? 'margin-left:auto;margin-right:auto;'
      : align === 'right'
        ? 'margin-left:auto;margin-right:0;'
        : 'margin-left:0;margin-right:auto;';

    return `
      section#${sceneId} h1,
      section#${sceneId} h2,
      section#${sceneId} p {
        text-align:${align};
      }
      section#${sceneId} h1,
      section#${sceneId} h2 {
        ${marginRule}
      }
      ${media === 'none' ? `section#${sceneId} img { display:none !important; }` : ''}
    `;
  }).join('\n');
}

export function GalloWorkshopExperience({ payload }) {
  const projected = projectedPayload(payload);
  return (
    <>
      <style>{projectionCss(projected)}</style>
      <GalloWorkshopExperienceV3 payload={projected} />
    </>
  );
}
