'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from 'sonner';
import { LoadingProvider } from '@/components/providers/loading-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <LoadingProvider>
        {children}
        <Toaster position="top-center" richColors />
      </LoadingProvider>
    </QueryClientProvider>
  );
}
