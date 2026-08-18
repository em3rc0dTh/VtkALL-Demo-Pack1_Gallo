'use client';

import { useMemo } from 'react';
import { GalloWorkshopExperience as GalloWorkshopExperienceV7 } from './GalloWorkshopExperienceV7';
import { normalizeServicePresentation } from '@/lib/landing/galloPresentationRegistry';

const variantFor = (block) => block?.layout?.variant || block?.data?.variant || '';
const findContent = (payload) => payload?.content || payload?.landingPage?.published || payload?.landingPage?.draft;

const servicePresentationFor = (payload) => {
  const content = findContent(payload);
  const serviceBlock = (content?.blocks || []).find((block) => variantFor(block) === 'gallo_services_scene');
  return normalizeServicePresentation(serviceBlock?.data?.presentation || {});
};

export function GalloWorkshopExperience({ payload }) {
  const presentation = useMemo(() => servicePresentationFor(payload), [payload]);

  return (
    <div
      className="contents"
      data-gallo-service-motion={presentation.motion}
      data-gallo-service-depth={presentation.depth}
    >
      <GalloWorkshopExperienceV7 payload={payload} />
      <style jsx global>{`
        [data-gallo-service-depth='subtle'] [data-semantic-family='catalog'] .gallo-depth-card {
          box-shadow: 0 28px 70px rgba(10,25,80,.14) !important;
          transition: transform 320ms ease, box-shadow 320ms ease;
        }
        [data-gallo-service-depth='subtle'] [data-semantic-family='catalog'] .gallo-depth-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 34px 88px rgba(10,25,80,.20) !important;
        }
        [data-gallo-service-depth='tilt'] [data-semantic-family='catalog'] .gallo-depth-card {
          transform-style: preserve-3d;
          transition: transform 360ms cubic-bezier(.22,1,.36,1), box-shadow 360ms ease;
        }
        [data-gallo-service-depth='tilt'] [data-semantic-family='catalog'] .gallo-depth-card:hover {
          transform: perspective(900px) rotateX(2deg) rotateY(-3deg) translateY(-6px);
          box-shadow: 0 38px 100px rgba(10,25,80,.22) !important;
        }
        [data-gallo-service-depth='layered'] [data-semantic-family='catalog'] .gallo-depth-card {
          box-shadow: 0 12px 0 rgba(23,65,255,.08), 0 28px 70px rgba(10,25,80,.14) !important;
          transition: transform 320ms ease, box-shadow 320ms ease;
        }
        [data-gallo-service-depth='layered'] [data-semantic-family='catalog'] .gallo-depth-card:hover {
          transform: translate(-3px,-6px);
          box-shadow: 6px 14px 0 rgba(23,65,255,.12), 0 36px 90px rgba(10,25,80,.20) !important;
        }

        [data-gallo-service-motion='fade'] [data-scene-state='active'] [data-semantic-family='catalog'] .gallo-depth-card {
          animation: gallo-service-v8-fade 560ms ease both;
        }
        [data-gallo-service-motion='rise'] [data-scene-state='active'] [data-semantic-family='catalog'] .gallo-depth-card,
        [data-gallo-service-motion='stagger'] [data-scene-state='active'] [data-semantic-family='catalog'] .gallo-depth-card {
          animation: gallo-service-v8-rise 620ms cubic-bezier(.22,1,.36,1) both;
        }
        [data-gallo-service-motion='slide'] [data-scene-state='active'] [data-semantic-family='catalog'] .gallo-depth-card {
          animation: gallo-service-v8-slide 620ms cubic-bezier(.22,1,.36,1) both;
        }
        [data-gallo-service-motion='scale'] [data-scene-state='active'] [data-semantic-family='catalog'] .gallo-depth-card {
          animation: gallo-service-v8-scale 560ms cubic-bezier(.22,1,.36,1) both;
        }
        [data-gallo-service-motion='blur-reveal'] [data-scene-state='active'] [data-semantic-family='catalog'] .gallo-depth-card {
          animation: gallo-service-v8-blur 650ms cubic-bezier(.22,1,.36,1) both;
        }
        [data-gallo-service-motion='stagger'] [data-scene-state='active'] [data-semantic-family='catalog'] [data-service-display] > div:nth-child(2) .gallo-depth-card { animation-delay: 90ms; }
        [data-gallo-service-motion='stagger'] [data-scene-state='active'] [data-semantic-family='catalog'] [data-service-display] > div:nth-child(3) .gallo-depth-card { animation-delay: 180ms; }
        [data-gallo-service-motion='stagger'] [data-scene-state='active'] [data-semantic-family='catalog'] [data-service-display] > div:nth-child(4) .gallo-depth-card { animation-delay: 270ms; }

        @keyframes gallo-service-v8-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes gallo-service-v8-rise { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes gallo-service-v8-slide { from { opacity: 0; transform: translateX(34px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes gallo-service-v8-scale { from { opacity: 0; transform: scale(.94); } to { opacity: 1; transform: scale(1); } }
        @keyframes gallo-service-v8-blur { from { opacity: 0; filter: blur(14px); transform: translateY(14px); } to { opacity: 1; filter: blur(0); transform: translateY(0); } }

        @media (prefers-reduced-motion: reduce) {
          [data-semantic-family='catalog'] .gallo-depth-card {
            animation: none !important;
            transition: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}
