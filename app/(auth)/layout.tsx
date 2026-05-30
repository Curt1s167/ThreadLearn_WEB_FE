'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';

const authRoutesAlwaysAccessible = new Set([
  '/verify-email',
  '/forgot-password',
  '/reset-password',
]);

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const isAlwaysAccessible = authRoutesAlwaysAccessible.has(pathname);

  useEffect(() => {
    if (isAuthenticated && !isAlwaysAccessible) {
      router.replace(user?.role === 'ADMIN' ? '/admin' : '/dashboard');
    }
  }, [isAlwaysAccessible, isAuthenticated, router, user]);

  if (isAuthenticated && !isAlwaysAccessible) {
    return null;
  }

  return <>{children}</>;
}
