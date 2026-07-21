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
  Zap,
  ChevronLeft,
  ChevronRight,
  Shield,
  BarChart2,
  Users,
  CreditCard,
  CheckCircle,
  History,
} from 'lucide-react';
import { useAuthStore, useUIStore } from '../store';
import { Avatar } from '../components/shared';
import { coursesService, enrollmentsService, notificationsService } from '../services';
import { useQueryClient } from '@tanstack/react-query';
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
  const { sidebarCollapsed, toggleSidebarCollapse } = useUIStore();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'ADMIN';

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
    <aside
      className={`fixed left-0 top-0 h-full z-30 flex flex-col bg-white/90 backdrop-blur-xl border-r border-black/10 transition-all duration-200 ${
        sidebarCollapsed ? SIDEBAR_COLLAPSED_CLASS : SIDEBAR_EXPANDED_CLASS
      }`}
    >
      <div className="h-14 flex items-center justify-between px-3 border-b border-black/10 shrink-0">
        {!sidebarCollapsed && (
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-black text-white shrink-0">
              <Zap size={15} />
            </span>
            <span className="font-semibold text-sm text-ink tracking-tight truncate">
              ThreadLearn
            </span>
          </Link>
        )}
        {sidebarCollapsed && (
          <Link
            href="/"
            className="grid h-8 w-8 place-items-center rounded-lg bg-black text-white mx-auto"
            title="ThreadLearn"
          >
            <Zap size={15} />
          </Link>
        )}
        <button
          type="button"
          onClick={toggleSidebarCollapse}
          className={`text-ink-faint hover:text-ink hover:bg-black/[0.05] p-1 rounded-lg transition-colors ${sidebarCollapsed ? 'hidden' : ''}`}
          aria-label="Collapse sidebar"
        >
          <ChevronLeft size={14} />
        </button>
      </div>

      {sidebarCollapsed && (
        <button
          type="button"
          onClick={toggleSidebarCollapse}
          className="mx-auto mt-2 text-ink-faint hover:text-ink hover:bg-black/[0.05] p-1 rounded-lg transition-colors"
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
  );
};
