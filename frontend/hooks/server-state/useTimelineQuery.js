import { useQuery } from '@tanstack/react-query';
import { demoTestRepository } from '@/lib/api/demoTestRepository';
import { demoTestQueryKeys } from '@/lib/query/queryKeys';

export function useTimelineQuery(params) {
  const { businessSlug, caseId } = params;

  const isEnabled = Boolean(businessSlug && caseId);

  return useQuery({
    queryKey: demoTestQueryKeys.timeline(params),
    queryFn: () => demoTestRepository.getTimeline(caseId, params),
    enabled: isEnabled,
    retry: (failureCount, error) => {
      // Reintentar solo en errores de red
      if (error?.kind === 'network' && failureCount < 1) {
        return true;
      }
      return false;
    },
  });
}
