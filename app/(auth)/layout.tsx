'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import { getRoleHomePath } from '@/utils/roleNavigation';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { hasHydrated, isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      router.replace(getRoleHomePath(user?.role ?? 'STUDENT'));
    }
  }, [hasHydrated, isAuthenticated, router, user?.role]);

  if (!hasHydrated || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas-cream">
        <div className="h-10 w-10 rounded-full border-2 border-black/20 border-t-black animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
