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
        <div className="h-9 w-9 rounded-full border-2 border-black/20 border-t-black animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-9 w-9 rounded-full border-2 border-black/20 border-t-black animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
