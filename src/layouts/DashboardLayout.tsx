'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import {
  MAIN_COLLAPSED_PL,
  MAIN_EXPANDED_PL,
} from './shell-metrics';
import { useAuthStore, useUIStore } from '../store';
import { ErrorBoundary } from '../components/shared/ErrorBoundary';
import { useSocket } from '../hooks/useSocket';
import { useAuthBootstrap } from '../hooks';

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { sidebarCollapsed } = useUIStore();
  const { hasHydrated, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useAuthBootstrap();
  useSocket();

  React.useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.replace('/login');
    }
  }, [hasHydrated, isAuthenticated, router]);

  if (!hasHydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-canvas-cream p-6">
        <div className="h-14 rounded-lg border border-black/10 bg-white/80" />
        <div className="mx-auto mt-12 max-w-6xl space-y-6">
          <div className="h-12 w-72 rounded-lg skeleton" />
          <div className="grid gap-5 md:grid-cols-3">
            {[0, 1, 2].map((item) => <div key={item} className="h-36 rounded-lg skeleton" />)}
          </div>
          <div className="h-80 rounded-lg skeleton" />
        </div>
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
        <div className="p-6">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
};
