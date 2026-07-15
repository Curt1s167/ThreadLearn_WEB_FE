'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster, toast } from 'sonner';
import { useAuthStore } from '@/store';

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
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  React.useEffect(() => {
    const handleUnauthorized = () => {
      logout();
      queryClient.clear();
      router.replace('/login');
      toast.error('Session expired. Please sign in again.');
    };

    window.addEventListener('threadlearn:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('threadlearn:unauthorized', handleUnauthorized);
    };
  }, [logout, router]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#ffffff',
            border: '1px solid rgba(0,0,0,0.1)',
            color: '#111111',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '13px',
            boxShadow: '0 8px 28px rgba(0,0,0,0.08)',
          },
        }}
      />
    </QueryClientProvider>
  );
};
