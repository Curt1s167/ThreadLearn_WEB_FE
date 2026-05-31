
import React, { useState } from 'react';
import {
  Bell, CheckCheck, Zap, Trophy, BookOpen, GraduationCap,
  CreditCard, Star, AlertCircle, Settings,
} from 'lucide-react';
import { Card, Button } from '../../components/shared';
import { useNotifications, useMarkAllAsRead, useMarkAsRead } from '../../hooks/useNotifications';
import type { NotificationTypeV2 } from '../../types';

const notifIcons: Partial<Record<NotificationTypeV2, React.ReactNode>> = {
  LEVEL_UP: <Zap size={14} className="text-violet-400" />,
  QUIZ_PASSED: <CheckCheck size={14} className="text-emerald-400" />,
  QUIZ_FAILED: <CheckCheck size={14} className="text-rose-400" />,
  COURSE_COMPLETED: <BookOpen size={14} className="text-blue-400" />,
  COURSE_ENROLLED: <GraduationCap size={14} className="text-blue-400" />,
  LEADERBOARD: <Trophy size={14} className="text-amber-400" />,
  ACHIEVEMENT: <Star size={14} className="text-amber-400" />,
  PAYMENT_SUCCESS: <CreditCard size={14} className="text-emerald-400" />,
  SYSTEM: <Settings size={14} className="text-gray-400" />,
  SYSTEM_ERROR: <AlertCircle size={14} className="text-rose-400" />,
};

const getIcon = (type: NotificationTypeV2) =>
  notifIcons[type] ?? <Bell size={14} className="text-gray-400" />;

export const NotificationsPage: React.FC = () => {
  const [onlyUnread, setOnlyUnread] = useState(false);

  const { data, isLoading } = useNotifications(onlyUnread);
  const { mutate: markAll } = useMarkAllAsRead();
  const { mutate: markOne } = useMarkAsRead();

  const notifications = data?.data ?? [];
  const unread = data?.meta?.unreadCount ?? notifications.filter((n) => !n.isRead).length;

  return (
    <div className="flex flex-col gap-4 animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-gray-400" />
          <h1 className="font-mono font-bold text-2xl text-gray-100">Thông báo</h1>
          {unread > 0 && (
            <span className="text-xs font-mono bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full border border-violet-500/20">
              {unread} mới
            </span>
          )}
        </div>
        {unread > 0 && (
          <Button variant="ghost" onClick={() => markAll()}>
            <CheckCheck size={14} />
            Đọc tất cả
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1">
        {[
          { key: false, label: 'Tất cả' },
          { key: true, label: 'Chưa đọc' },
        ].map((tab) => (
          <button
            key={String(tab.key)}
            onClick={() => setOnlyUnread(tab.key)}
            className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-colors ${
              onlyUnread === tab.key
                ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20'
                : 'text-gray-600 hover:text-gray-400 border border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 skeleton rounded-xl" />
          ))}
        </div>
      ) : notifications.length > 0 ? (
        <Card className="overflow-hidden divide-y divide-white/[0.04]">
          {notifications.map((notif) => (
            <button
              key={notif._id}
              onClick={() => { if (!notif.isRead) markOne(notif._id); }}
              className={`w-full text-left flex items-start gap-3 px-4 py-3 transition-colors hover:bg-white/[0.02] ${
                !notif.isRead ? 'bg-violet-500/[0.03]' : ''
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                {getIcon(notif.type)}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className={`text-sm font-mono ${notif.isRead ? 'text-gray-400' : 'text-gray-200 font-medium'}`}>
                  {notif.title}
                </p>
                <p className="text-xs text-gray-600 font-mono mt-0.5 line-clamp-2">{notif.message}</p>
                <p className="text-[10px] text-gray-700 font-mono mt-1">
                  {new Date(notif.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
              {!notif.isRead && (
                <div className="w-2 h-2 rounded-full bg-violet-500 mt-1.5 shrink-0" />
              )}
            </button>
          ))}
        </Card>
      ) : (
        <Card className="p-10 text-center">
          <Bell size={28} className="text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 font-mono text-sm">
            {onlyUnread ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo'}
          </p>
        </Card>
      )}
    </div>
  );
};

