'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(user?.role === 'ADMIN' ? '/admin' : '/dashboard');
    }
  }, [isAuthenticated, router, user]);

  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
