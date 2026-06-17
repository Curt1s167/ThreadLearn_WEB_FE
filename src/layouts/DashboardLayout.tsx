import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useUIStore } from '../store';
import { ErrorBoundary } from '../components/shared/ErrorBoundary';
import { useAuthBootstrap } from '../hooks';

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { sidebarCollapsed } = useUIStore();

  // Bootstrap: revalidate user session + load stats
  useAuthBootstrap();

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Sidebar />
      <Topbar />
      <main
        className={`pt-14 min-h-screen transition-all duration-200 ${
          sidebarCollapsed ? 'pl-14' : 'pl-56'
        }`}
      >
        <div className="p-6 max-w-7xl mx-auto">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
};
