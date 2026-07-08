'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { hasHydrated, user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  React.useEffect(() => {
    if (hasHydrated && user && !isAdmin) {
      router.replace('/403');
    }
  }, [hasHydrated, isAdmin, router, user]);

  if (!hasHydrated || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
