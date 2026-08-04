'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  const { hasHydrated, user } = useAuthStore(); const router = useRouter();
  useEffect(() => { if (hasHydrated && user?.role !== 'INSTRUCTOR') router.replace('/403'); }, [hasHydrated, user?.role, router]);
  if (!hasHydrated || !user || user.role !== 'INSTRUCTOR') return <div className="min-h-[50vh]" />;
  return children;
}
