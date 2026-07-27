// ─── Notifications Page ───────────────────────────────────────────────────────
'use client';

import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, Zap, Trophy, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { notificationsService } from '../../services';
import { formatNotificationMessage, normalizeMojibakeText } from '../../utils';
import { Button, EmptyState, Skeleton } from '../../components/shared';
import type { Notification, NotificationType } from '../../types';
import {
  DemoDisplayTitle,
  DemoHeroWhite,
  DemoPageRoot,
  DemoPill,
  DemoWhitePanel,
} from '../ui-reskin/demo-ui';

const notifIcons: Partial<Record<NotificationType, React.ReactNode>> = {
  LEVEL_UP: <Zap size={18} />,
  QUIZ_PASSED: <CheckCheck size={18} />,
  COURSE_COMPLETED: <BookOpen size={18} />,
  LESSON_COMPLETED: <BookOpen size={18} />,
  LEADERBOARD: <Trophy size={18} />,
  ACHIEVEMENT: <Trophy size={18} />,
  ENROLLMENT: <BookOpen size={18} />,
  COURSE_ENROLLED: <BookOpen size={18} />,
};

const notifTone = (type: NotificationType) => {
  if (type === 'LEVEL_UP' || type === 'QUIZ_PASSED') return 'bg-[#d9f99d]';
  if (type === 'LEADERBOARD' || type === 'ACHIEVEMENT') return 'bg-[#f5d0fe]';
  if (type === 'PAYMENT_SUCCESS') return 'bg-[#bfdbfe]';
  return 'bg-black/[0.04]';
};

export const NotificationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const {
    data: notifications,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsService.getAll,
  });

  const { mutate: markAll } = useMutation({
    mutationFn: notificationsService.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read');
    },
    onError: () => toast.error('Failed to mark notifications as read'),
  });

  const { mutate: markRead } = useMutation({
    mutationFn: notificationsService.markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    onError: () => toast.error('Failed to mark notification as read'),
  });

  const visibleNotifications = notifications ?? [];
  const unread = visibleNotifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    if (isError) toast.error('Failed to load notifications');
  }, [isError]);

  const openNotification = (notification: Notification) => {
    if (!notification.isRead) markRead(notification._id);
    if (notification.link?.startsWith('/')) router.push(notification.link);
  };

  return (
    <DemoPageRoot className="mx-auto max-w-4xl">
      <DemoHeroWhite>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <DemoPill tone="blue">Notifications</DemoPill>
            <DemoDisplayTitle>Events emitted by learning activity.</DemoDisplayTitle>
            <p className="mt-3 max-w-2xl text-black/60">
              Live records from the notification service, including quiz, gamification, course, and payment events.
            </p>
          </div>
          {unread > 0 && (
            <Button variant="outline" onClick={() => markAll()} className="rounded-full">
              <CheckCheck size={14} />
              Mark all read
            </Button>
          )}
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <DemoPill tone={unread > 0 ? 'lime' : 'default'}>{unread} unread</DemoPill>
          <DemoPill tone="pink">{visibleNotifications.length} total</DemoPill>
        </div>
      </DemoHeroWhite>

      {isLoading ? (
        <div className="grid gap-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={<Bell size={36} />}
          title="Could not load notifications"
          description="Please try again in a moment."
        />
      ) : visibleNotifications.length > 0 ? (
        <DemoWhitePanel className="divide-y divide-black/10">
          {visibleNotifications.map((notif) => (
            <div
              key={notif._id}
              role={!notif.isRead || notif.link?.startsWith('/') ? 'button' : undefined}
              tabIndex={!notif.isRead || notif.link?.startsWith('/') ? 0 : undefined}
              onClick={() => openNotification(notif)}
              onKeyDown={(event) => {
                if (
                  (!notif.isRead || notif.link?.startsWith('/')) &&
                  (event.key === 'Enter' || event.key === ' ')
                ) {
                  event.preventDefault();
                  openNotification(notif);
                }
              }}
              className={`grid gap-4 p-5 transition hover:bg-black/[0.025] sm:grid-cols-[44px_1fr_auto] ${
                !notif.isRead || notif.link?.startsWith('/')
                  ? 'cursor-pointer'
                  : ''
              } ${
                !notif.isRead ? 'bg-[#d9f99d]/20' : ''
              }`}
            >
              <span className={`grid h-11 w-11 place-items-center rounded-full ${notifTone(notif.type)}`}>
                {notifIcons[notif.type] ?? <Bell size={18} />}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{normalizeMojibakeText(notif.title)}</h2>
                  <span className="rounded bg-black/[0.05] px-2 py-1 text-xs text-black/45">{notif.type}</span>
                  {!notif.isRead && <span className="rounded-full bg-black px-2 py-0.5 text-[10px] font-medium text-white">new</span>}
                </div>
                <p className="mt-1 text-sm text-black/60">{formatNotificationMessage(notif)}</p>
              </div>
              <p className="text-xs text-black/40 sm:text-right">
                {new Date(notif.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </DemoWhitePanel>
      ) : (
        <EmptyState
          icon={<Bell size={36} />}
          title="No notifications yet"
          description="Learning and account updates will appear here."
        />
      )}
    </DemoPageRoot>
  );
};
