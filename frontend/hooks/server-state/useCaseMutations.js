import { useMutation } from '@tanstack/react-query';
import { demoTestRepository } from '@/lib/api/demoTestRepository';

export function useCreateCase() {
  return useMutation({
    mutationFn: (payload) => demoTestRepository.createCase(payload),
    retry: false,
  });
}
