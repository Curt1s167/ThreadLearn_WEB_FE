'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { hasHydrated, isAuthenticated, user } = useAuthStore();
  const isInstructor = user?.role === 'INSTRUCTOR';

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated || !user) {
      router.replace('/login?from=/instructor');
      return;
    }
    if (!isInstructor) router.replace('/403');
  }, [hasHydrated, isAuthenticated, isInstructor, router, user]);

  if (!hasHydrated || !isAuthenticated || !user || !isInstructor) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas-cream">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-black/20 border-t-black" />
      </div>
    );
  }

  return <>{children}</>;
}
