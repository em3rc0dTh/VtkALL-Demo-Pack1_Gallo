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

const safeAlign = (value) => ['left', 'center', 'right'].includes(value) ? value : 'left';

function projectionCss(payload) {
  const content = payload?.content || payload?.landingPage?.published || payload?.landingPage?.draft;
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
  return (
    <>
      <style>{projectionCss(payload)}</style>
      <GalloWorkshopExperienceV3 payload={payload} />
    </>
  );
}
