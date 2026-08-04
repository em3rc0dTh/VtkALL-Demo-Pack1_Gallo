'use client';

import { useEffect, useState } from 'react';
import { LandingPageRenderer } from './LandingPageRenderer';

export function LandingPreviewFrame() {
  const [payload, setPayload] = useState(null);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== 'landing-preview:update') return;
      setPayload(event.data.payload || null);
      event.source?.postMessage({
        type: 'landing-preview:ready',
        metrics: {
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        },
      }, event.origin);
    };

    window.addEventListener('message', handleMessage);
    window.parent?.postMessage({ type: 'landing-preview:ready' }, window.location.origin);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const sendToBuilder = (message) => {
    window.parent?.postMessage(message, window.location.origin);
  };

  return (
    <>
      <style jsx global>{`
        html,
        body {
          margin: 0;
          width: 100%;
          min-width: 0;
          overflow-x: hidden;
          background: #fff;
        }

        * {
          box-sizing: border-box;
        }
      `}</style>
      <div
        data-landing-preview-mode="draft"
        data-landing-renderer-version="turagua-frames-v2"
      >
        {payload ? (
          <LandingPageRenderer
            payload={payload}
            builderEditing={{
              enabled: true,
              onHeroDataChange: (patch) => sendToBuilder({ type: 'landing-preview:hero-data-change', patch }),
              onBlockDataChange: (blockType, patch) => sendToBuilder({ type: 'landing-preview:block-data-change', blockType, patch }),
              onSelectElement: (selection) => sendToBuilder({ type: 'landing-preview:element-selected', selection }),
            }}
          />
        ) : (
          <div className="flex min-h-screen items-center justify-center bg-white text-sm font-semibold text-slate-500">
            Preparando preview...
          </div>
        )}
      </div>
    </>
  );
}
