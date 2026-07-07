'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';
import { useAuthStore, useUIStore } from '../store';
import { Avatar } from '../components/shared';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: <LayoutDashboard size={16} />, label: 'Dashboard' },
  { to: '/courses', icon: <BookOpen size={16} />, label: 'Courses' },
  { to: '/leaderboard', icon: <Trophy size={16} />, label: 'Leaderboard' },
  { to: '/ai', icon: <Bot size={16} />, label: 'AI Advisor' },
  { to: '/bookmarks', icon: <Bookmark size={16} />, label: 'Bookmarks' },
  { to: '/notifications', icon: <Bell size={16} />, label: 'Notifications' },
  { to: '/profile', icon: <User size={16} />, label: 'Profile' },
];

const adminItems: NavItem[] = [
  { to: '/admin', icon: <BarChart2 size={16} />, label: 'Analytics', adminOnly: true },
  { to: '/admin/users', icon: <Users size={16} />, label: 'Users', adminOnly: true },
  { to: '/admin/courses', icon: <BookOpen size={16} />, label: 'Manage Courses', adminOnly: true },
  { to: '/admin/quizzes', icon: <CheckCircle size={16} />, label: 'Quizzes', adminOnly: true },
  { to: '/admin/plans', icon: <CreditCard size={16} />, label: 'Plans', adminOnly: true },
];

export const Sidebar: React.FC = () => {
  const { user } = useAuthStore();
  const { sidebarCollapsed, toggleSidebarCollapse } = useUIStore();
  const pathname = usePathname();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-30 flex flex-col bg-[#0d0d14] border-r border-white/[0.06] transition-all duration-200 ${
        sidebarCollapsed ? 'w-14' : 'w-56'
      }`}
    >
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-3 border-b border-white/[0.06] shrink-0">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center">
              <Zap size={13} className="text-white" />
            </div>
            <span className="font-mono font-semibold text-sm text-gray-100 tracking-tight">
              ThreadLearn
            </span>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center mx-auto">
            <Zap size={13} className="text-white" />
          </div>
        )}
        <button
          onClick={toggleSidebarCollapse}
          className={`text-gray-600 hover:text-gray-300 hover:bg-white/5 p-1 rounded-lg transition-colors ${sidebarCollapsed ? 'hidden' : ''}`}
        >
          <ChevronLeft size={14} />
        </button>
      </div>

      {/* Expand button when collapsed */}
      {sidebarCollapsed && (
        <button
          onClick={toggleSidebarCollapse}
          className="mx-auto mt-2 text-gray-600 hover:text-gray-300 hover:bg-white/5 p-1 rounded-lg transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 flex flex-col gap-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.to}
            href={item.to}
            className={`${pathname === item.to || pathname.startsWith(item.to + '/') ? 'sidebar-item-active' : 'sidebar-item'} ${
              sidebarCollapsed ? 'justify-center px-0 py-2' : ''
            }`}
            title={sidebarCollapsed ? item.label : undefined}
          >
            {item.icon}
            {!sidebarCollapsed && <span>{item.label}</span>}
          </Link>
        ))}

        {/* Admin section */}
        {isAdmin && (
          <>
            <div className={`my-2 border-t border-white/[0.05] ${sidebarCollapsed ? '' : 'mx-1'}`} />
            {!sidebarCollapsed && (
              <div className="flex items-center gap-1.5 px-3 py-1 mb-1">
                <Shield size={10} className="text-violet-500" />
                <span className="text-[10px] text-violet-500 font-mono uppercase tracking-widest">
                  Admin
                </span>
              </div>
            )}
            {adminItems.map((item) => (
              <Link
                key={item.to}
                href={item.to}
                className={`${pathname === item.to || (item.to !== '/admin' && pathname.startsWith(item.to)) ? 'sidebar-item-active' : 'sidebar-item'} ${
                  sidebarCollapsed ? 'justify-center px-0 py-2' : ''
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                {item.icon}
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User footer */}
      <div className={`border-t border-white/[0.06] p-2 shrink-0`}>
        <Link
          href="/profile"
          className={`flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/5 transition-colors ${
            sidebarCollapsed ? 'justify-center' : ''
          }`}
        >
          <Avatar src={user?.avatarUrl} name={user?.name} size="sm" />
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="text-xs text-gray-200 font-mono truncate">{user?.name}</p>
              <p className="text-[10px] text-gray-600 font-mono truncate">{user?.role}</p>
            </div>
          )}
        </Link>
      </div>
    </aside>
  );
};
