'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ApiError } from '@/lib/api/http';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Socket events keep data fresh, so don't refetch on every focus.
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        // Retry network/5xx errors, never 4xx (they won't fix themselves).
        retry: (failureCount, error) => {
          if (error instanceof ApiError && error.status !== null && error.status < 500) return false;
          return failureCount < 2;
        },
      },
    },
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={300}>
        {children}
        <Toaster position="top-center" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
