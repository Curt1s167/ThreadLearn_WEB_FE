'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '../store';

interface RealtimePayload {
  id: string;
  title: string;
  message: string;
  type: string;
  metadata?: Record<string, unknown>;
  link?: string;
  createdAt: string;
}

/**
 * Connects to the backend `/notifications` Socket.IO namespace using the
 * authenticated user's access token. On every realtime `notification` event:
 *  - shows a toast
 *  - invalidates the React Query caches that drive the notifications list and
 *    unread-count badge so they refetch fresh data
 *
 * Reconnects automatically when the token rotates. Cleans up on unmount.
 */
export function useNotificationsSocket() {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.accessToken);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    // Derive WS base from the existing API base URL (strip trailing /api/v1).
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000/api/v1';
    const wsBase = apiBase.replace(/\/api\/v\d+\/?$/, '');

    const socket = io(`${wsBase}/notifications`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      // eslint-disable-next-line no-console
      console.debug('[ws] notifications connected', socket.id);
    });

    socket.on('auth_error', (data: { message: string }) => {
      console.warn('[ws] notifications auth error:', data.message);
    });

    socket.on('notification', (payload: RealtimePayload) => {
      toast(payload.title, {
        description: payload.message,
        action: payload.link
          ? { label: 'Open', onClick: () => { if (typeof window !== 'undefined') window.location.href = payload.link!; } }
          : undefined,
      });
      // Refresh paginated list + badge.
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    });

    socket.on('disconnect', (reason) => {
      // eslint-disable-next-line no-console
      console.debug('[ws] notifications disconnected:', reason);
    });

    return () => {
      socket.disconnect();
    };
  }, [token, queryClient]);
}
