import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUnreadCount, useMarkAllAsRead, useNotifications } from '../../hooks/useNotifications';
import { useMarkAsRead } from '../../hooks/useNotifications';
import { useNotificationSocket } from '../../hooks/useNotificationSocket';

export const NotificationBell: React.FC = () => {
  useNotificationSocket();

  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: countData } = useUnreadCount();
  const { data: notifData } = useNotifications();
  const { mutate: markAllAsRead } = useMarkAllAsRead();
  const { mutate: markRead } = useMarkAsRead();

  const unreadCount = countData?.data?.count ?? 0;
  const latest = notifData?.data?.slice(0, 5) ?? [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/5 transition-colors"
      >
        <Bell size={15} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 flex items-center justify-center text-[9px] font-mono font-bold bg-violet-500 text-white rounded-full px-0.5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-20 w-80 bg-[#111118] border border-white/[0.08] rounded-xl shadow-2xl animate-fade-in overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <span className="text-xs font-mono font-medium text-gray-300">Thông báo</span>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className="text-[10px] font-mono text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
                >
                  <CheckCheck size={11} />
                  Đọc tất cả
                </button>
              )}
            </div>

            {/* Notification list */}
            {latest.length > 0 ? (
              <div className="divide-y divide-white/[0.04]">
                {latest.map((notif) => (
                  <button
                    key={notif._id}
                    onClick={() => {
                      if (!notif.isRead) markRead(notif._id);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-white/[0.03] transition-colors ${
                      !notif.isRead ? 'bg-violet-500/[0.03]' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-mono truncate ${notif.isRead ? 'text-gray-400' : 'text-gray-200 font-medium'}`}>
                        {notif.title}
                      </p>
                      <p className="text-[10px] text-gray-600 font-mono truncate mt-0.5">
                        {notif.message}
                      </p>
                      <p className="text-[9px] text-gray-700 font-mono mt-0.5">
                        {new Date(notif.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-6 text-center">
                <Bell size={20} className="text-gray-700 mx-auto mb-2" />
                <p className="text-xs text-gray-600 font-mono">Chưa có thông báo</p>
              </div>
            )}

            {/* Footer */}
            <button
              onClick={() => { navigate('/notifications'); setOpen(false); }}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-[11px] font-mono text-gray-500 hover:text-violet-400 border-t border-white/[0.06] transition-colors"
            >
              Xem tất cả
              <ArrowRight size={10} />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

