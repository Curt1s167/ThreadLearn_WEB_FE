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

let notificationsSocket: Socket | null = null;
let socketToken: string | null = null;

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
      notificationsSocket?.disconnect();
      notificationsSocket = null;
      socketToken = null;
      socketRef.current = null;
      return;
    }

    // Derive WS base from the existing API base URL (strip trailing /api/v1).
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000/api/v1';
    const wsBase = apiBase.replace(/\/api\/v\d+\/?$/, '');

    if (!notificationsSocket || socketToken !== token) {
      notificationsSocket?.disconnect();
      notificationsSocket = io(`${wsBase}/notifications`, {
        auth: { token },
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
      socketToken = token;
    }

    const socket = notificationsSocket;
    socketRef.current = socket;

    const handleConnect = () => {
      // eslint-disable-next-line no-console
      console.debug('[ws] notifications connected', socket.id);
    };

    const handleAuthError = (data: { message: string }) => {
      console.warn('[ws] notifications auth error:', data.message);
    };

    const handleNotification = (payload: RealtimePayload) => {
      toast(payload.title, {
        description: payload.message,
        action: payload.link
          ? { label: 'Open', onClick: () => { if (typeof window !== 'undefined') window.location.href = payload.link!; } }
          : undefined,
      });
      // Refresh paginated list + badge.
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    };

    const handleLeaderboardUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['my-rank'] });
    };

    const handleXpAwarded = () => {
      queryClient.invalidateQueries({ queryKey: ['gamification-stats'] });
    };

    const handleDisconnect = (reason: string) => {
      // eslint-disable-next-line no-console
      console.debug('[ws] notifications disconnected:', reason);
    };

    socket.on('connect', handleConnect);
    socket.on('auth_error', handleAuthError);
    socket.on('notification', handleNotification);
    socket.on('leaderboard:update', handleLeaderboardUpdate);
    socket.on('xp:awarded', handleXpAwarded);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('auth_error', handleAuthError);
      socket.off('notification', handleNotification);
      socket.off('leaderboard:update', handleLeaderboardUpdate);
      socket.off('xp:awarded', handleXpAwarded);
      socket.off('disconnect', handleDisconnect);

      if (useAuthStore.getState().accessToken !== token) {
        socket.disconnect();
        if (notificationsSocket === socket) {
          notificationsSocket = null;
          socketToken = null;
        }
      }
    };
  }, [token, queryClient]);
}
