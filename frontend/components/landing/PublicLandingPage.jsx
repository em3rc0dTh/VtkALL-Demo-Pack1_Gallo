'use client';

import { useQuery } from '@tanstack/react-query';
import { landingRepository } from '@/lib/landing/landingRepository';
import { LandingPageRenderer } from './LandingPageRenderer';
import { GalloWorkshopExperience as GalloWorkshopExperienceV7 } from './GalloWorkshopExperienceV7';

export function PublicLandingPage({ businessSlug = 'turagua', pageSlug = 'home' }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['landing-page', 'public', businessSlug, pageSlug],
    queryFn: () => landingRepository.getPublicLandingPage({ businessSlug, pageSlug }),
  });

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-surface-app text-text-secondary">Cargando landing...</div>;
  }

  if (error) {
    return <div className="flex min-h-screen items-center justify-center bg-surface-app p-6 text-center text-text-secondary">No se pudo cargar la landing publica.</div>;
  }

  if (businessSlug === 'gallo') {
    return <GalloWorkshopExperienceV7 payload={data} />;
  }

  return <LandingPageRenderer payload={data} />;
}
