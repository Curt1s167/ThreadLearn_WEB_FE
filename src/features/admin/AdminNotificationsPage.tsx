'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { adminNotificationsService } from '@/services';

export function AdminNotificationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const queryKey = ['admin-notifications', page];
  const notifications = useQuery({
    queryKey,
    queryFn: () => adminNotificationsService.getAdminNotifications({ page, limit: 20 }),
  });
  const unread = useQuery({ queryKey: ['admin-notifications-unread'], queryFn: adminNotificationsService.getAdminUnreadNotificationCount });
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    queryClient.invalidateQueries({ queryKey: ['admin-notifications-unread'] });
  };
  const markOne = useMutation({ mutationFn: adminNotificationsService.markAdminNotificationRead, onSuccess: refresh });
  const markAll = useMutation({ mutationFn: adminNotificationsService.markAllAdminNotificationsRead, onSuccess: refresh });

  return (
    <main className="max-w-5xl mx-auto px-5 py-8">
      <div className="flex items-start justify-between gap-4 mb-7">
        <div>
          <h1 className="text-2xl font-semibold text-ink flex items-center gap-2"><Bell size={24} /> Admin notifications</h1>
          <p className="text-sm text-ink-faint mt-1">{unread.data ?? 0} unread notification{unread.data === 1 ? '' : 's'}</p>
        </div>
        <button onClick={() => markAll.mutate()} disabled={markAll.isPending || !unread.data} className="inline-flex items-center gap-2 rounded-lg border border-black/10 px-3 py-2 text-sm hover:bg-black/[.04] disabled:opacity-50">
          <CheckCheck size={16} /> Mark all read
        </button>
      </div>
      {notifications.isLoading && <p className="text-sm text-ink-faint">Loading notifications…</p>}
      {notifications.isError && <p className="text-sm text-red-600">Unable to load notifications. Please try again.</p>}
      {!notifications.isLoading && !notifications.isError && notifications.data?.items.length === 0 && <p className="rounded-xl border border-dashed border-black/15 p-8 text-center text-sm text-ink-faint">No admin notifications yet.</p>}
      <div className="space-y-3">
        {notifications.data?.items.map((notification) => (
          <article key={notification._id} className={`rounded-xl border p-4 ${notification.isRead ? 'border-black/10 bg-white' : 'border-blue-200 bg-blue-50/40'}`}>
            <div className="flex gap-3 justify-between">
              <div>
                <p className="font-medium text-ink">{notification.title}</p>
                <p className="mt-1 text-sm text-ink-faint">{notification.message}</p>
                <p className="mt-2 text-xs text-ink-faint">{new Date(notification.createdAt).toLocaleString()}</p>
              </div>
              {!notification.isRead && <button aria-label="Mark as read" onClick={() => markOne.mutate(notification._id)} disabled={markOne.isPending} className="shrink-0 h-8 w-8 rounded-lg hover:bg-black/[.06] flex items-center justify-center"><Check size={16} /></button>}
            </div>
          </article>
        ))}
      </div>
      {(notifications.data?.meta?.totalPages ?? 1) > 1 ? (
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="rounded-lg border border-black/10 px-3 py-2 text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-ink-faint">
            Page {page} of {notifications.data?.meta?.totalPages ?? 1}
          </span>
          <button
            type="button"
            disabled={page >= (notifications.data?.meta?.totalPages ?? 1)}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-lg border border-black/10 px-3 py-2 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}
    </main>
  );
}
