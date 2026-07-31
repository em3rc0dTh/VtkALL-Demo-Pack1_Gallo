import { useMutation } from '@tanstack/react-query';
import { demoTestRepository } from '@/lib/api/demoTestRepository';

export function useCreateCustomer() {
  return useMutation({
    mutationFn: (payload) => demoTestRepository.createCustomer(payload),
    retry: false,
  });
}
