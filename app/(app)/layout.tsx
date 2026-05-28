'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store';
import { DashboardLayout } from '@/layouts/DashboardLayout';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.replace('/login');
    }
  }, [mounted, isAuthenticated, router]);

  // Admin route protection
  useEffect(() => {
    if (mounted && isAuthenticated && pathname.startsWith('/admin') && user?.role !== 'ADMIN') {
      router.replace('/403');
    }
  }, [mounted, isAuthenticated, pathname, user, router]);

  if (!mounted || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Double check admin route before rendering
  if (pathname.startsWith('/admin') && user?.role !== 'ADMIN') {
    return null; // Will redirect via useEffect
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
