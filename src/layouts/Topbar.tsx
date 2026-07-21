'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, LogOut, Menu, CheckCheck, BookOpen, Trophy, Zap, Moon, Sun } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useUIStore } from '../store';
import { Avatar, Badge } from '../components/shared';
import { notificationsService } from '../services';
import type { Notification, NotificationType } from '../types';
import {
  TOPBAR_COLLAPSED_LEFT,
  TOPBAR_EXPANDED_LEFT,
} from './shell-metrics';

const notificationIcon = (type: NotificationType) => {
  if (type === 'LEVEL_UP' || type === 'AI_FEEDBACK') return <Zap size={15} />;
  if (type === 'LEADERBOARD' || type === 'ACHIEVEMENT') return <Trophy size={15} />;
  if (type.includes('LESSON') || type.includes('COURSE') || type.includes('QUIZ')) return <BookOpen size={15} />;
  return <Bell size={15} />;
};

const notificationTone = (type: NotificationType) => {
  if (type === 'LEVEL_UP' || type === 'QUIZ_PASSED') return 'bg-brand-lime';
  if (type === 'LEADERBOARD' || type === 'ACHIEVEMENT') return 'bg-brand-pink';
  return 'bg-black/[0.05]';
};

const formatNotificationTime = (createdAt: string) => {
  const deltaMinutes = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 60_000));
  if (deltaMinutes < 1) return 'now';
  if (deltaMinutes < 60) return `${deltaMinutes}m`;
  if (deltaMinutes < 1_440) return `${Math.floor(deltaMinutes / 60)}h`;
  return `${Math.floor(deltaMinutes / 1_440)}d`;
};

export const Topbar: React.FC = () => {
  const { user, logout, stats } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar, theme, setTheme } = useUIStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const notificationMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsService.getAll,
    enabled: Boolean(user),
  });
  const unreadNotifications =
    notifications?.filter((notification) => !notification.isRead).length ?? 0;
  const visibleNotifications = notifications?.slice(0, 5) ?? [];

  const { mutate: markRead } = useMutation({
    mutationFn: notificationsService.markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const { mutate: markAllRead, isPending: isMarkingAllRead } = useMutation({
    mutationFn: notificationsService.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const level = stats?.level ?? 1;
  const xp = stats?.xp;

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const openNotification = (notification: Notification) => {
    if (!notification.isRead) markRead(notification._id);
    setShowNotificationMenu(false);
    if (notification.link) router.push(notification.link);
  };

  useEffect(() => {
    if (!showNotificationMenu) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!notificationMenuRef.current?.contains(event.target as Node)) {
        setShowNotificationMenu(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowNotificationMenu(false);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [showNotificationMenu]);

  return (
    <header
      className={`shell-topbar fixed top-0 right-0 z-20 flex items-center justify-between border-b px-3 sm:px-5 backdrop-blur-xl transition-all duration-200 ${
        sidebarCollapsed ? TOPBAR_COLLAPSED_LEFT : TOPBAR_EXPANDED_LEFT
      }`}
    >
      <div className="relative flex items-center gap-2">
        <button
          type="button"
          onClick={toggleSidebar}
          className="icon-button lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={18} />
        </button>
      </div>

      <div className="flex items-center gap-1">
        {user && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-lime/80 border border-black/5 mr-2">
            <span className="text-ink/70 text-xs">Lv.</span>
            <span className="text-ink text-xs font-semibold">{level}</span>
            {xp != null && (
              <>
                <span className="text-ink/30 text-xs">·</span>
                <span className="text-ink/70 text-xs">{xp.toLocaleString()} XP</span>
              </>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="icon-button"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <div ref={notificationMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setShowNotificationMenu((value) => !value)}
            className="icon-button relative"
            aria-label="Notifications"
            aria-expanded={showNotificationMenu}
            aria-haspopup="dialog"
          >
            <Bell size={17} />
            {unreadNotifications > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[10px] leading-4 text-white">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </button>

          {showNotificationMenu && (
            <section
              className="shell-popover absolute right-0 top-12 z-50 w-[min(23rem,calc(100vw-1.5rem))] overflow-hidden animate-fade-in"
              role="dialog"
              aria-label="Notifications"
            >
              <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
                <div>
                  <h2 className="text-sm font-semibold text-ink">Notifications</h2>
                  <p className="mt-0.5 text-xs text-ink-faint">
                    {unreadNotifications > 0 ? `${unreadNotifications} unread` : 'You are all caught up'}
                  </p>
                </div>
                {unreadNotifications > 0 && (
                  <button
                    type="button"
                    onClick={() => markAllRead()}
                    disabled={isMarkingAllRead}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-ink-muted transition-colors hover:bg-black/[0.05] hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CheckCheck size={14} />
                    Mark all read
                  </button>
                )}
              </div>

              {visibleNotifications.length > 0 ? (
                <div className="max-h-[22rem] overflow-y-auto p-1.5">
                  {visibleNotifications.map((notification) => (
                    <button
                      key={notification._id}
                      type="button"
                      onClick={() => openNotification(notification)}
                      className={`flex w-full gap-3 rounded-xl p-3 text-left transition-colors hover:bg-black/[0.04] focus-visible:outline-none ${
                        !notification.isRead ? 'bg-brand-lime/25' : ''
                      }`}
                    >
                      <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${notificationTone(notification.type)}`}>
                        {notificationIcon(notification.type)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-3">
                          <span className="line-clamp-1 text-sm font-medium text-ink">{notification.title}</span>
                          <span className="shrink-0 text-[11px] text-ink-faint">{formatNotificationTime(notification.createdAt)}</span>
                        </span>
                        <span className="mt-1 line-clamp-2 block text-xs leading-5 text-ink-muted">{notification.message}</span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-5 py-10 text-center">
                  <Bell size={20} className="mx-auto text-ink-faint" />
                  <p className="mt-3 text-sm font-medium text-ink">No notifications yet</p>
                  <p className="mt-1 text-xs leading-5 text-ink-muted">Learning updates and quiz results will appear here.</p>
                </div>
              )}

              <div className="border-t border-black/10 p-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowNotificationMenu(false);
                    router.push('/notifications');
                  }}
                  className="w-full rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-black/[0.05] hover:text-ink"
                >
                  View all notifications
                </button>
              </div>
            </section>
          )}
        </div>

        <div className="relative ml-1">
          <button
            type="button"
            onClick={() => setShowUserMenu((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full p-0 transition-colors hover:bg-black/[0.05]"
          >
            <Avatar src={user?.avatarUrl} name={user?.name} size="sm" />
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-10 z-20 w-52 bg-white border border-black/10 rounded-xl panel-shadow py-1 animate-fade-in">
                <div className="px-3 py-2.5 border-b border-black/10">
                  <p className="text-xs text-ink font-medium truncate">
                    {user?.name}
                  </p>
                  <p className="text-[11px] text-ink-faint truncate">
                    {user?.email}
                  </p>
                  <div className="mt-1">
                    <Badge color={user?.planType === 'PREMIUM' ? 'amber' : 'gray'}>
                      {user?.planType}
                    </Badge>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { router.push('/profile'); setShowUserMenu(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-ink-muted hover:text-ink hover:bg-black/[0.04] transition-colors"
                >
                  Profile settings
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:text-rose-700 hover:bg-rose-500/5 transition-colors flex items-center gap-2"
                >
                  <LogOut size={13} />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
