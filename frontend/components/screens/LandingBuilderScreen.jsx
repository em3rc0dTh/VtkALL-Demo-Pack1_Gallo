'use client';

import { GalloLandingBuilderPageV4 } from '@/components/landing/GalloLandingBuilderPageV4';

export function LandingBuilderScreen() {
  return (
    <div className="h-full min-h-0 overflow-hidden rounded-xl [&>main]:!h-full [&>main]:!min-h-0">
      <GalloLandingBuilderPageV4 />
    </div>
  );
}
