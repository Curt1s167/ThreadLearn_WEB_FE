// ─── Notifications Page ───────────────────────────────────────────────────────
'use client';

import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Zap, Trophy, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { notificationsService } from '../../services';
import { Card, Button, EmptyState, Skeleton } from '../../components/shared';
import type { NotificationType } from '../../types';

const notifIcons: Partial<Record<NotificationType, React.ReactNode>> = {
  LEVEL_UP: <Zap size={14} className="text-violet-400" />,
  QUIZ_PASSED: <CheckCheck size={14} className="text-emerald-400" />,
  COURSE_COMPLETED: <BookOpen size={14} className="text-blue-400" />,
  LESSON_COMPLETED: <BookOpen size={14} className="text-blue-400" />,
  LEADERBOARD: <Trophy size={14} className="text-amber-400" />,
  ACHIEVEMENT: <Trophy size={14} className="text-amber-400" />,
  ENROLLMENT: <BookOpen size={14} className="text-blue-400" />,
  COURSE_ENROLLED: <BookOpen size={14} className="text-blue-400" />,
};

export const NotificationsPage: React.FC = () => {
  const queryClient = useQueryClient();

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

  const unread = notifications?.filter((n) => !n.isRead).length ?? 0;

  useEffect(() => {
    if (isError) toast.error('Failed to load notifications');
  }, [isError]);

  return (
    <div className="flex flex-col gap-4 animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-ink-muted" />
          <h1 className="font-mono font-bold text-2xl text-ink">Notifications</h1>
          {unread > 0 && (
            <span className="text-xs font-mono bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full border border-violet-500/20">
              {unread} new
            </span>
          )}
        </div>
        {unread > 0 && (
          <Button variant="ghost" onClick={() => markAll()}>
            <CheckCheck size={14} />
            Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : notifications && notifications.length > 0 ? (
        <Card className="overflow-hidden divide-y divide-black/10">
          {notifications.map((notif) => (
            <div
              key={notif._id}
              role={!notif.isRead ? 'button' : undefined}
              tabIndex={!notif.isRead ? 0 : undefined}
              onClick={() => !notif.isRead && markRead(notif._id)}
              onKeyDown={(event) => {
                if (!notif.isRead && (event.key === 'Enter' || event.key === ' ')) {
                  event.preventDefault();
                  markRead(notif._id);
                }
              }}
              className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-black/[0.03] ${
                !notif.isRead ? 'bg-violet-500/[0.03] cursor-pointer' : ''
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-black/[0.04] flex items-center justify-center shrink-0 mt-0.5">
                {notifIcons[notif.type] ?? <Bell size={14} className="text-ink-muted" />}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-mono ${notif.isRead ? 'text-ink-muted' : 'text-ink font-medium'}`}>
                  {notif.title}
                </p>
                <p className="text-xs text-ink-faint font-mono mt-0.5">{notif.message}</p>
                <p className="text-[10px] text-ink-faint font-mono mt-1">
                  {new Date(notif.createdAt).toLocaleString()}
                </p>
              </div>
              {!notif.isRead && (
                <div className="w-2 h-2 rounded-full bg-violet-500 mt-1.5 shrink-0" />
              )}
            </div>
          ))}
        </Card>
      ) : (
        <EmptyState
          icon={<Bell size={36} />}
          title="No notifications yet"
          description="Learning activity updates will appear here"
        />
      )}
    </div>
  );
};
