'use client';

import { GalloLandingBuilderPageV3 } from '@/components/landing/GalloLandingBuilderPageV3';

export function LandingBuilderScreen() {
  return (
    <div className="h-full min-h-0 overflow-hidden rounded-xl [&>main]:!h-full [&>main]:!min-h-0">
      <GalloLandingBuilderPageV3 />
    </div>
  );
}
