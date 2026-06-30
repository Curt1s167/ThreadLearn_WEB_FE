// ─── Notifications Page ───────────────────────────────────────────────────────
'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Zap, Trophy, BookOpen, Flame } from 'lucide-react';
import { notificationsService } from '../../services';
import { Card, Button } from '../../components/shared';
import type { NotificationType } from '../../types';

const notifIcons: Record<NotificationType, React.ReactNode> = {
  LEVEL_UP: <Zap size={14} className="text-violet-400" />,
  QUIZ_PASSED: <CheckCheck size={14} className="text-emerald-400" />,
  COURSE_COMPLETED: <BookOpen size={14} className="text-blue-400" />,
  STREAK_MILESTONE: <Flame size={14} className="text-amber-400" />,
  RANK_CHANGE: <Trophy size={14} className="text-amber-400" />,
};

export const NotificationsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsService.getAll,
  });

  const { mutate: markAll } = useMutation({
    mutationFn: notificationsService.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unread = notifications?.filter((n) => !n.read).length ?? 0;

  return (
    <div className="flex flex-col gap-4 animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-gray-400" />
          <h1 className="font-mono font-bold text-2xl text-gray-100">Notifications</h1>
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
            <div key={i} className="h-14 skeleton rounded-xl" />
          ))}
        </div>
      ) : notifications && notifications.length > 0 ? (
        <Card className="overflow-hidden divide-y divide-white/[0.04]">
          {notifications.map((notif) => (
            <div
              key={notif._id}
              className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-white/[0.02] ${
                !notif.read ? 'bg-violet-500/[0.03]' : ''
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                {notifIcons[notif.type]}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-mono ${notif.read ? 'text-gray-400' : 'text-gray-200 font-medium'}`}>
                  {notif.title}
                </p>
                <p className="text-xs text-gray-600 font-mono mt-0.5">{notif.message}</p>
                <p className="text-[10px] text-gray-700 font-mono mt-1">
                  {new Date(notif.createdAt).toLocaleString()}
                </p>
              </div>
              {!notif.read && (
                <div className="w-2 h-2 rounded-full bg-violet-500 mt-1.5 shrink-0" />
              )}
            </div>
          ))}
        </Card>
      ) : (
        <Card className="p-10 text-center">
          <Bell size={28} className="text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 font-mono text-sm">No notifications yet</p>
        </Card>
      )}
    </div>
  );
};
