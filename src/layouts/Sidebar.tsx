'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Trophy,
  Bot,
  User,
  Bell,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Shield,
  BarChart2,
  Users,
  CreditCard,
  CheckCircle,
  History,
  Code2,
} from 'lucide-react';
import { useAuthStore, useUIStore } from '../store';
import { Avatar } from '../components/shared';
import { coursesService, enrollmentsService, notificationsService } from '../services';
import { useQueryClient } from '@tanstack/react-query';
import { BrandLogo } from '../components/shared/BrandLogo';
import {
  SIDEBAR_COLLAPSED_CLASS,
  SIDEBAR_EXPANDED_CLASS,
} from './shell-metrics';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  /** Custom active matcher — avoid /quiz/[id] highlighting Quiz Attempts */
  isActive?: (pathname: string) => boolean;
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: <LayoutDashboard size={16} />, label: 'Dashboard' },
  { to: '/courses', icon: <BookOpen size={16} />, label: 'Courses' },
  { to: '/ide', icon: <Code2 size={16} />, label: 'Code Lab' },
  {
    to: '/quiz/history',
    icon: <History size={16} />,
    label: 'Quiz Attempts',
    isActive: (pathname) =>
      pathname === '/quiz/history' || pathname.startsWith('/quiz/attempts/'),
  },
  { to: '/leaderboard', icon: <Trophy size={16} />, label: 'Leaderboard' },
  { to: '/pricing', icon: <CreditCard size={16} />, label: 'Pricing' },
  { to: '/ai', icon: <Bot size={16} />, label: 'AI Advisor' },
  { to: '/bookmarks', icon: <Bookmark size={16} />, label: 'Bookmarks' },
  { to: '/notifications', icon: <Bell size={16} />, label: 'Notifications' },
  { to: '/profile', icon: <User size={16} />, label: 'Profile' },
];

const adminItems: NavItem[] = [
  { to: '/admin', icon: <BarChart2 size={16} />, label: 'Analytics' },
  { to: '/admin/users', icon: <Users size={16} />, label: 'Users' },
  { to: '/admin/courses', icon: <BookOpen size={16} />, label: 'Manage Courses' },
  { to: '/admin/quizzes', icon: <CheckCircle size={16} />, label: 'Quizzes' },
  { to: '/admin/plans', icon: <CreditCard size={16} />, label: 'Plans' },
];

function itemActive(item: NavItem, pathname: string): boolean {
  if (item.isActive) return item.isActive(pathname);
  if (item.to === '/admin') return pathname === '/admin';
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

export const Sidebar: React.FC = () => {
  const { user } = useAuthStore();
  const { sidebarCollapsed, sidebarOpen, setSidebarOpen, toggleSidebarCollapse } = useUIStore();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'ADMIN';

  React.useEffect(() => {
    // A route change should return a phone user to the content they selected.
    setSidebarOpen(false);
  }, [pathname, setSidebarOpen]);

  const warmRoute = (href: string) => {
    router.prefetch(href);

    if (href === '/courses') {
      void queryClient.prefetchQuery({
        queryKey: ['courses', '', ''],
        queryFn: () => coursesService.list({}),
      });
    }
    if (href === '/dashboard') {
      void queryClient.prefetchQuery({
        queryKey: ['my-enrollments'],
        queryFn: enrollmentsService.getMyEnrollments,
      });
    }
    if (href === '/notifications') {
      void queryClient.prefetchQuery({
        queryKey: ['notifications'],
        queryFn: notificationsService.getAll,
      });
    }
  };

  return (
    <>
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 cursor-default bg-black/35 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation"
        />
      )}
    <aside
      className={`shell-sidebar fixed left-0 top-0 z-40 flex h-[100dvh] flex-col border-r backdrop-blur-xl transition-[transform,width] duration-200 ${
        sidebarCollapsed ? SIDEBAR_COLLAPSED_CLASS : SIDEBAR_EXPANDED_CLASS
      } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      aria-label="Primary navigation"
    >
      <div className="flex h-[3.75rem] items-center justify-between border-b border-black/10 px-3 shrink-0">
        {!sidebarCollapsed && (
          <Link
            href="/"
            className="flex items-center min-w-0 flex-1 mr-1"
            aria-label="ThreadLearn home"
          >
            <BrandLogo variant="full" size="sm" priority className="max-w-[148px]" />
          </Link>
        )}
        {sidebarCollapsed && (
          <Link
            href="/"
            className="flex items-center justify-center mx-auto"
            title="ThreadLearn"
            aria-label="ThreadLearn home"
          >
            <BrandLogo variant="mark" size="sm" priority />
          </Link>
        )}
        <button
          type="button"
          onClick={toggleSidebarCollapse}
          className={`icon-button hidden h-8 w-8 lg:inline-flex ${sidebarCollapsed ? 'lg:hidden' : ''}`}
          aria-label="Collapse sidebar"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="icon-button h-8 w-8 lg:hidden"
          aria-label="Close navigation"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {sidebarCollapsed && (
        <button
          type="button"
          onClick={toggleSidebarCollapse}
          className="icon-button mx-auto mt-2 hidden h-8 w-8 lg:inline-flex"
          aria-label="Expand sidebar"
        >
          <ChevronRight size={14} />
        </button>
      )}

      <nav className="flex-1 py-3 px-2 flex flex-col gap-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = itemActive(item, pathname);
          return (
            <Link
              key={item.to}
              href={item.to}
              onClick={() => setSidebarOpen(false)}
              onMouseEnter={() => warmRoute(item.to)}
              onFocus={() => warmRoute(item.to)}
              className={`${active ? 'sidebar-item-active' : 'sidebar-item'} ${
                sidebarCollapsed ? 'justify-center px-0 py-2' : ''
              }`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              {item.icon}
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className={`my-2 border-t border-black/10 ${sidebarCollapsed ? '' : 'mx-1'}`} />
            {!sidebarCollapsed && (
              <div className="flex items-center gap-1.5 px-3 py-1 mb-1">
                <Shield size={10} className="text-ink-faint" />
                <span className="text-[10px] text-ink-faint uppercase tracking-widest">
                  Admin
                </span>
              </div>
            )}
            {adminItems.map((item) => {
              const active = itemActive(item, pathname);
              return (
                <Link
                  key={item.to}
                  href={item.to}
                  onClick={() => setSidebarOpen(false)}
                  onMouseEnter={() => warmRoute(item.to)}
                  onFocus={() => warmRoute(item.to)}
                  className={`${active ? 'sidebar-item-active' : 'sidebar-item'} ${
                    sidebarCollapsed ? 'justify-center px-0 py-2' : ''
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  {item.icon}
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="border-t border-black/10 p-2 shrink-0">
        <Link
          href="/profile"
          onClick={() => setSidebarOpen(false)}
          onMouseEnter={() => warmRoute('/profile')}
          onFocus={() => warmRoute('/profile')}
          className={`flex items-center gap-2.5 p-2 rounded-lg hover:bg-black/[0.04] transition-colors ${
            sidebarCollapsed ? 'justify-center' : ''
          }`}
        >
          <Avatar src={user?.avatarUrl} name={user?.name} size="sm" />
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="text-xs text-ink font-medium truncate">{user?.name}</p>
              <p className="text-[10px] text-ink-faint truncate">{user?.role}</p>
            </div>
          )}
        </Link>
      </div>
    </aside>
    </>
  );
};
