'use client';

import { GalloLandingBuilderPage } from '@/components/landing/GalloLandingBuilderPage';

export function LandingBuilderScreen() {
  return (
    <div className="h-full min-h-0 overflow-hidden rounded-xl [&>main]:!h-full [&>main]:!min-h-0">
      <GalloLandingBuilderPage />
    </div>
  );
}
