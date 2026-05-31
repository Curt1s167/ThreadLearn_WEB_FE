
import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store';
import type { Notification } from '../types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

/**
 * Socket.IO hook — connects when authenticated, auto-joins user room.
 * Listens for realtime events pushed by BE server.ts:
 *  - 'notification' (UC32, UC45) — new notification
 *  - 'leaderboard:update' (UC46) — rank changes
 *  - 'xp:awarded' (UC44) — XP gain
 */
export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { user, accessToken, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const socket = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
    });

    // ─── UC32, UC45: Realtime notifications (level-up, quiz pass, etc.) ─────
    socket.on('notification', (notif: Notification) => {
      // Invalidate cache so notification list refreshes
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      // Show toast
      const icons: Record<string, string> = {
        LEVEL_UP: '⚡',
        QUIZ_PASSED: '✅',
        COURSE_COMPLETED: '📚',
        STREAK_MILESTONE: '🔥',
        RANK_CHANGE: '🏆',
      };
      toast(notif.title, {
        description: notif.message,
        icon: icons[notif.type] || '🔔',
      });
    });

    // ─── UC46: Leaderboard real-time update ─────────────────────────────────
    socket.on('leaderboard:update', () => {
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['my-rank'] });
    });

    // ─── UC44: XP awarded event ─────────────────────────────────────────────
    socket.on('xp:awarded', (payload: { xp: number; totalXp: number; level: number }) => {
      queryClient.invalidateQueries({ queryKey: ['gamification-stats'] });
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, accessToken, queryClient]);

  const emit = useCallback(
    (event: string, data?: unknown) => {
      socketRef.current?.emit(event, data);
    },
    []
  );

  return { socket: socketRef.current, emit };
}

