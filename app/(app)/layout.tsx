'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { authService } from '@/services/auth.service';
import { useNotificationsSocket } from '@/hooks/useNotificationsSocket';

const FullPageSpinner = () => (
  <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, accessToken, setUser, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const hasUser = Boolean(user);
  const isAdminRoute = pathname.startsWith('/admin');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!isAuthenticated || !accessToken || !hasUser) {
      logout();
      setSessionChecked(true);
      router.replace('/login');
      return;
    }

    let cancelled = false;
    setSessionChecked(false);

    const validateSession = async () => {
      try {
        const sessionUser = await authService.getSession();
        if (cancelled) return;

        setUser(sessionUser);

        if (isAdminRoute && sessionUser.role !== 'ADMIN') {
          router.replace('/403');
          return;
        }

        setSessionChecked(true);
      } catch {
        if (cancelled) return;

        logout();
        setSessionChecked(true);
        router.replace('/login');
      }
    };

    void validateSession();

    return () => {
      cancelled = true;
    };
  }, [
    accessToken,
    hasUser,
    isAdminRoute,
    isAuthenticated,
    logout,
    mounted,
    pathname,
    router,
    setUser,
  ]);

  if (!mounted || !sessionChecked || !isAuthenticated || !accessToken || !user) {
    return <FullPageSpinner />;
  }

  if (isAdminRoute && user.role !== 'ADMIN') {
    return null;
  }

  return (
    <DashboardLayout>
      <NotificationsSocketBridge />
      {children}
    </DashboardLayout>
  );
}

/**
 * Tiny bridge component so the realtime hook only mounts once the user is
 * fully authenticated. Keeps the WS connection out of the unauthenticated
 * spinner path.
 */
function NotificationsSocketBridge() {
  useNotificationsSocket();
  return null;
}
