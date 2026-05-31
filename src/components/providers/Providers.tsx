
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: 0 },
  },
});

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#111118',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#e8e8f0',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '13px',
          },
        }}
      />
    </QueryClientProvider>
  );
};

