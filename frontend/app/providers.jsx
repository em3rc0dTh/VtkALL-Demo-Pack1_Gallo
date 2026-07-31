'use client';

import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query/queryClient';
import { BusinessProfileProvider } from '@/contexts/BusinessProfileContext';

export function Providers({ children }) {
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <BusinessProfileProvider>
        {children}
      </BusinessProfileProvider>
    </QueryClientProvider>
  );
}
