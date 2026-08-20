'use client';

import { useMemo } from 'react';
import { GalloWorkshopExperience as GalloWorkshopExperienceV5 } from './GalloWorkshopExperienceV5';
import { normalizeServicePresentation } from '@/lib/landing/galloPresentationRegistry';

const variantFor = (block) => block?.layout?.variant || block?.data?.variant || '';
const clone = (value) => JSON.parse(JSON.stringify(value || {}));
const findContent = (payload) => payload?.content || payload?.landingPage?.published || payload?.landingPage?.draft;

const servicePresentationFor = (payload) => {
  const content = findContent(payload);
  const serviceBlock = (content?.blocks || []).find((block) => variantFor(block) === 'gallo_services_scene');
  return normalizeServicePresentation(serviceBlock?.data?.presentation || {});
};

const projectPayloadForPresentation = (payload, presentation) => {
  const next = clone(payload);
  if (Array.isArray(next.catalogOfferings)) {
    next.catalogOfferings = next.catalogOfferings.map((offering) => {
      const baseName = offering.displayName || offering.name || offering.title || '';
      const durationSuffix = presentation.showDuration && Number(offering.durationMinutes) > 0
        ? ` · ${Number(offering.durationMinutes)} min`
        : '';
      return {
        ...offering,
        displayName: `${baseName}${durationSuffix}`,
        priceLabel: presentation.showPrice ? (offering.priceLabel || offering?.price?.display || '') : '',
        price: presentation.showPrice ? offering.price : undefined,
        durationMinutes: presentation.showDuration ? offering.durationMinutes : undefined,
      };
    });
  }

  const updateContent = (content) => {
    if (!content?.blocks) return content;
    return {
      ...content,
      blocks: content.blocks.map((block) => {
        if (variantFor(block) !== 'gallo_services_scene') return block;
        return {
          ...block,
          layout: {
            ...(block.layout || {}),
            media: presentation.showImage ? (block.layout?.media || 'background') : 'none',
          },
          data: {
            ...(block.data || {}),
            presentation,
          },
        };
      }),
    };
  };

  if (next.content) next.content = updateContent(next.content);
  if (next.landingPage?.published) next.landingPage.published = updateContent(next.landingPage.published);
  if (next.landingPage?.draft) next.landingPage.draft = updateContent(next.landingPage.draft);
  return next;
};

export function GalloWorkshopExperience({ payload }) {
  const presentation = useMemo(() => servicePresentationFor(payload), [payload]);
  const projectedPayload = useMemo(() => projectPayloadForPresentation(payload, presentation), [payload, presentation]);

  return (
    <div
      className="contents"
      data-gallo-service-display={presentation.displayMode}
      data-gallo-service-motion={presentation.motion}
      data-gallo-service-depth={presentation.depth}
      data-gallo-service-description={presentation.showDescription ? 'show' : 'hide'}
      style={{ '--gallo-service-columns': String(presentation.columns) }}
    >
      <GalloWorkshopExperienceV5 payload={projectedPayload} />
      <style jsx global>{`
        [data-gallo-service-display] section[data-gallo-scene='servicios'] div:has(> article) {
          scrollbar-width: thin;
          scrollbar-color: rgba(23, 65, 255, 0.4) transparent;
        }

        @media (min-width: 1024px) {
          [data-gallo-service-display='cards'] section[data-gallo-scene='servicios'] div:has(> article),
          [data-gallo-service-display='compact'] section[data-gallo-scene='servicios'] div:has(> article),
          [data-gallo-service-display='text'] section[data-gallo-scene='servicios'] div:has(> article),
          [data-gallo-service-display='featured-grid'] section[data-gallo-scene='servicios'] div:has(> article) {
            grid-template-columns: repeat(var(--gallo-service-columns), minmax(0, 1fr)) !important;
          }
        }

        [data-gallo-service-display='compact'] section[data-gallo-scene='servicios'] article {
          min-height: 145px !important;
          border-radius: 22px !important;
        }

        [data-gallo-service-display='compact'] section[data-gallo-scene='servicios'] article > div.relative {
          padding: 1rem !important;
        }

        [data-gallo-service-display='list'] section[data-gallo-scene='servicios'] div:has(> article) {
          display: flex !important;
          flex-direction: column !important;
          gap: 0.75rem !important;
          overflow-y: auto !important;
          padding-right: 0.25rem;
        }

        [data-gallo-service-display='list'] section[data-gallo-scene='servicios'] article {
          min-height: 112px !important;
          flex: 0 0 auto;
          border-radius: 22px !important;
        }

        [data-gallo-service-display='carousel'] section[data-gallo-scene='servicios'] div:has(> article),
        [data-gallo-service-display='rail'] section[data-gallo-scene='servicios'] div:has(> article) {
          display: flex !important;
          grid-template-columns: none !important;
          overflow-x: auto !important;
          overflow-y: hidden !important;
          scroll-snap-type: x mandatory;
          overscroll-behavior-x: contain;
          gap: 1rem !important;
          padding-bottom: 0.5rem;
        }

        [data-gallo-service-display='carousel'] section[data-gallo-scene='servicios'] article {
          flex: 0 0 min(78vw, 430px);
          scroll-snap-align: start;
        }

        [data-gallo-service-display='rail'] section[data-gallo-scene='servicios'] article {
          flex: 0 0 min(70vw, 320px);
          min-height: 165px !important;
          scroll-snap-align: start;
        }

        [data-gallo-service-display='text'] section[data-gallo-scene='servicios'] article {
          min-height: 0 !important;
          border: 1px solid rgba(23, 65, 255, 0.12) !important;
          background: white !important;
          box-shadow: 0 18px 45px rgba(30, 55, 120, 0.06) !important;
        }

        [data-gallo-service-display='text'] section[data-gallo-scene='servicios'] article img,
        [data-gallo-service-display='text'] section[data-gallo-scene='servicios'] article video,
        [data-gallo-service-display='text'] section[data-gallo-scene='servicios'] article > div.absolute {
          display: none !important;
        }

        [data-gallo-service-display='text'] section[data-gallo-scene='servicios'] article h3 { color: #080b19 !important; }
        [data-gallo-service-display='text'] section[data-gallo-scene='servicios'] article p { color: #64748b !important; }
        [data-gallo-service-display='text'] section[data-gallo-scene='servicios'] article div.relative > div:last-child span {
          border-color: rgba(23, 65, 255, 0.12) !important;
          background: rgba(23, 65, 255, 0.05) !important;
          color: #1741ff !important;
        }

        @media (min-width: 1024px) {
          [data-gallo-service-display='featured-grid'] section[data-gallo-scene='servicios'] article:first-child {
            grid-column: span 2;
            min-height: 240px !important;
          }
        }

        [data-gallo-service-description='hide'] section[data-gallo-scene='servicios'] article p { display: none !important; }

        [data-gallo-service-depth='subtle'] section[data-gallo-scene='servicios'] article {
          box-shadow: 0 28px 70px rgba(10, 25, 80, 0.14) !important;
          transition: transform 320ms ease, box-shadow 320ms ease;
        }
        [data-gallo-service-depth='subtle'] section[data-gallo-scene='servicios'] article:hover {
          transform: translateY(-5px);
          box-shadow: 0 34px 88px rgba(10, 25, 80, 0.2) !important;
        }

        [data-gallo-service-depth='tilt'] section[data-gallo-scene='servicios'] article {
          transform-style: preserve-3d;
          transition: transform 360ms cubic-bezier(.22,1,.36,1), box-shadow 360ms ease;
        }
        [data-gallo-service-depth='tilt'] section[data-gallo-scene='servicios'] article:hover {
          transform: perspective(900px) rotateX(2deg) rotateY(-3deg) translateY(-6px);
          box-shadow: 0 38px 100px rgba(10, 25, 80, 0.22) !important;
        }

        [data-gallo-service-depth='layered'] section[data-gallo-scene='servicios'] article {
          transform: translateZ(0);
          box-shadow: 0 14px 0 rgba(23, 65, 255, 0.08), 0 28px 70px rgba(10, 25, 80, 0.14) !important;
          transition: transform 320ms ease, box-shadow 320ms ease;
        }
        [data-gallo-service-depth='layered'] section[data-gallo-scene='servicios'] article:hover {
          transform: translate(-3px, -6px);
          box-shadow: 6px 14px 0 rgba(23, 65, 255, 0.12), 0 36px 90px rgba(10, 25, 80, 0.2) !important;
        }

        [data-gallo-service-motion='fade'] [data-scene-state='active'] section[data-gallo-scene='servicios'] article {
          animation: gallo-service-fade 560ms ease both;
        }
        [data-gallo-service-motion='rise'] [data-scene-state='active'] section[data-gallo-scene='servicios'] article,
        [data-gallo-service-motion='stagger'] [data-scene-state='active'] section[data-gallo-scene='servicios'] article {
          animation: gallo-service-rise 620ms cubic-bezier(.22,1,.36,1) both;
        }
        [data-gallo-service-motion='slide'] [data-scene-state='active'] section[data-gallo-scene='servicios'] article {
          animation: gallo-service-slide 620ms cubic-bezier(.22,1,.36,1) both;
        }
        [data-gallo-service-motion='scale'] [data-scene-state='active'] section[data-gallo-scene='servicios'] article {
          animation: gallo-service-scale 560ms cubic-bezier(.22,1,.36,1) both;
        }
        [data-gallo-service-motion='blur-reveal'] [data-scene-state='active'] section[data-gallo-scene='servicios'] article {
          animation: gallo-service-blur 650ms cubic-bezier(.22,1,.36,1) both;
        }

        [data-gallo-service-motion='stagger'] section[data-gallo-scene='servicios'] article:nth-child(2),
        [data-gallo-service-motion='rise'] section[data-gallo-scene='servicios'] article:nth-child(2),
        [data-gallo-service-motion='slide'] section[data-gallo-scene='servicios'] article:nth-child(2),
        [data-gallo-service-motion='scale'] section[data-gallo-scene='servicios'] article:nth-child(2),
        [data-gallo-service-motion='blur-reveal'] section[data-gallo-scene='servicios'] article:nth-child(2) { animation-delay: 90ms; }

        [data-gallo-service-motion='stagger'] section[data-gallo-scene='servicios'] article:nth-child(3),
        [data-gallo-service-motion='rise'] section[data-gallo-scene='servicios'] article:nth-child(3),
        [data-gallo-service-motion='slide'] section[data-gallo-scene='servicios'] article:nth-child(3),
        [data-gallo-service-motion='scale'] section[data-gallo-scene='servicios'] article:nth-child(3),
        [data-gallo-service-motion='blur-reveal'] section[data-gallo-scene='servicios'] article:nth-child(3) { animation-delay: 180ms; }

        @keyframes gallo-service-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes gallo-service-rise { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes gallo-service-slide { from { opacity: 0; transform: translateX(34px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes gallo-service-scale { from { opacity: 0; transform: scale(.94); } to { opacity: 1; transform: scale(1); } }
        @keyframes gallo-service-blur { from { opacity: 0; filter: blur(14px); transform: translateY(14px); } to { opacity: 1; filter: blur(0); transform: translateY(0); } }

        @media (prefers-reduced-motion: reduce) {
          [data-gallo-service-display] section[data-gallo-scene='servicios'] article {
            animation: none !important;
            transition: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}
