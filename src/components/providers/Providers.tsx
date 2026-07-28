'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster, toast } from 'sonner';
import { useAuthStore, useUIStore } from '@/store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // A failed API must be visible quickly. Screen-specific retry actions are
      // preferable to silently waiting through a second full timeout.
      retry: false,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: 0 },
  },
});

export const Providers = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const theme = useUIStore((state) => state.theme);

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

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
        theme={theme}
        toastOptions={{
          style: {
            background: theme === 'dark' ? '#10231f' : '#ffffff',
            border: theme === 'dark' ? '1px solid rgba(217,249,157,0.16)' : '1px solid rgba(0,0,0,0.1)',
            color: theme === 'dark' ? '#edf7ef' : '#10231f',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '13px',
            boxShadow: '0 8px 28px rgba(0,0,0,0.08)',
          },
        }}
      />
    </QueryClientProvider>
  );
};
