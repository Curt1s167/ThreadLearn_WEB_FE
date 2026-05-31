import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store';
import type { NotificationV2 } from '../types';

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:5000';

export function useNotificationSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { user, isAuthenticated, accessToken } = useAuthStore();
  const qc = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated || !user?._id || !accessToken) return;

    // BE gateway is mounted at namespace `/notifications` and authenticates via JWT.
    const socket = io(`${SOCKET_URL}/notifications`, {
      auth: { token: accessToken },
      transports:           ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay:    3000,
    });

    socketRef.current = socket;

    socket.on('notification', (notif: NotificationV2) => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      toast(notif.title, { description: notif.message, icon: '🔔' });
    });

    socket.on('connect_error', (err) => {
      console.warn('[NotifSocket] connect_error:', err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user?._id, accessToken, qc]);
}
