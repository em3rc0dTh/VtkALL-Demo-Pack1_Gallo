'use client';

import { GalloLandingBuilderPageV2 } from '@/components/landing/GalloLandingBuilderPageV2';

export function LandingBuilderScreen() {
  return (
    <div className="h-full min-h-0 overflow-hidden rounded-xl [&>main]:!h-full [&>main]:!min-h-0">
      <GalloLandingBuilderPageV2 />
    </div>
  );
}
