import { useMutation } from '@tanstack/react-query';
import { demoTestRepository } from '@/lib/api/demoTestRepository';

export function useCreateManagedEntity() {
  return useMutation({
    mutationFn: (payload) => demoTestRepository.createManagedEntity(payload),
    retry: false,
  });
}
