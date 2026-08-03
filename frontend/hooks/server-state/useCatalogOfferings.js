import { useQuery } from '@tanstack/react-query';
import { catalogRepository } from '@/lib/catalog/catalogRepository';
import { demoTestQueryKeys } from '@/lib/query/queryKeys';

export function useCatalogOfferings(params) {
  const { businessSlug, verticalType } = params;
  
  const isEnabled = Boolean(businessSlug && verticalType);

  return useQuery({
    queryKey: demoTestQueryKeys.catalog(params),
    queryFn: async () => {
      const result = await catalogRepository.getOfferings(params);
      return result.catalogOfferings;
    },
    enabled: isEnabled,
    retry: (failureCount, error) => {
      if (error?.kind === 'network' && failureCount < 1) {
        return true;
      }
      return false;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos de cache para el catalogo
  });
}
