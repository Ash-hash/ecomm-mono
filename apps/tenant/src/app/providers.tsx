'use client';
// app/providers.tsx
// Wrap your root layout with this.

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Never retry on auth errors
            retry: (count, err: any) => {
              if ([401, 403].includes(err?.status)) return false;
              return count < 2;
            },
            refetchOnWindowFocus: false,
            staleTime:            30_000, // 30s default
          },
          mutations: {
            retry: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}

      {/* Toast notifications — all API success/error messages appear here */}
      <Toaster
        position="top-right"
        richColors
        toastOptions={{
          style: {
            background: '#0f0f18',
            border:     '1px solid #1e1e2e',
            color:      '#d0d0e0',
            fontFamily: "'DM Mono', monospace",
            fontSize:   13,
          },
        }}
      />

      {/* React Query DevTools — only visible in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      )}
    </QueryClientProvider>
  );
}
