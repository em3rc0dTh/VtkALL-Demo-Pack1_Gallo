import { useQuery } from '@tanstack/react-query';
import { businessProfileRepository } from '@/lib/businessProfile/businessProfileRepository';
import { demoTestQueryKeys } from '@/lib/query/queryKeys';

export function useBusinessProfileQuery({ businessSlug }) {
  return useQuery({
    queryKey: demoTestQueryKeys.businessProfile({ businessSlug }),
    queryFn: () => businessProfileRepository.getBusinessProfile({ businessSlug }),
    enabled: Boolean(businessSlug),
    retry: (failureCount, error) => error?.kind === 'network' && failureCount < 1,
    staleTime: 1000 * 60 * 5,
  });
}
