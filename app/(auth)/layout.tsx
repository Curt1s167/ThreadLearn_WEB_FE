'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { hasHydrated, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [hasHydrated, isAuthenticated, router]);

  if (!hasHydrated || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas-cream">
        <div className="h-10 w-10 rounded-full border-2 border-black/20 border-t-black animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
