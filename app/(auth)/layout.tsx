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
    return null;
  }

  return <>{children}</>;
}
