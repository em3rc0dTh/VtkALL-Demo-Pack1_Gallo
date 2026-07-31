import { useQuery } from '@tanstack/react-query';
import { demoTestRepository } from '@/lib/api/demoTestRepository';
import { demoTestQueryKeys } from '@/lib/query/queryKeys';

export function useAvailabilityQuery(params) {
  const { businessSlug, teamId, date, durationMinutes, timezone } = params;
  
  const isEnabled = Boolean(businessSlug && teamId && date && durationMinutes && timezone);

  return useQuery({
    queryKey: demoTestQueryKeys.availability(params),
    queryFn: () => demoTestRepository.getAvailability(params),
    enabled: isEnabled,
    retry: (failureCount, error) => {
      // Solo reintentar en errores de red
      if (error?.kind === 'network' && failureCount < 1) {
        return true;
      }
      return false;
    },
  });
}
