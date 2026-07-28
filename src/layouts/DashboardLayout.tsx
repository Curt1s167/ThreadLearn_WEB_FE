'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MAIN_COLLAPSED_PL, MAIN_EXPANDED_PL } from './shell-metrics';
import { useAuthStore, useUIStore } from '../store';
import { ErrorBoundary } from '../components/shared/ErrorBoundary';
import { useSocket } from '../hooks/useSocket';
import { useAuthBootstrap } from '../hooks';

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { sidebarCollapsed } = useUIStore();
  const { hasHydrated, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const isFullWidthPage = pathname?.startsWith('/ai');

  useAuthBootstrap();
  useSocket();

  React.useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.replace('/login');
    }
  }, [hasHydrated, isAuthenticated, router]);

  if (!hasHydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-canvas-cream flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-black/20 border-t-black animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas-cream text-ink">
      <Sidebar />
      <Topbar />
      <main
        className={`pt-14 min-h-screen transition-all duration-200 ${
          sidebarCollapsed ? MAIN_COLLAPSED_PL : MAIN_EXPANDED_PL
        }`}
      >
        <div className={isFullWidthPage ? 'w-full p-4 sm:p-6 lg:py-9' : 'p-6'}>
          <ErrorBoundary>{children}</ErrorBoundary>
        </div>
      </main>
    </div>
  );
};
