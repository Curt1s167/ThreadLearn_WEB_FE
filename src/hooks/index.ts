import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store';
import { authService } from '../services/auth.service';
import { gamificationService } from '../services';

// ─── Debounce ─────────────────────────────────────────────────────────────────
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ─── Media Query ──────────────────────────────────────────────────────────────
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);
  return matches;
}

// ─── Auth bootstrap hook — restores session on mount ──────────────────────────
export function useAuthBootstrap() {
  const { isAuthenticated, setUser, setStats, logout } = useAuthStore();

  // Revalidate current user on mount if we have a token
  useQuery({
    queryKey: ['auth-me'],
    queryFn: async () => {
      try {
        const user = await authService.getMe();
        setUser(user);
        return user;
      } catch {
        logout();
        return null;
      }
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60_000, // 5 min
    retry: false,
  });

  // Fetch gamification stats
  useQuery({
    queryKey: ['gamification-stats-bootstrap'],
    queryFn: async () => {
      const stats = await gamificationService.getStats();
      setStats(stats);
      return stats;
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

// ─── Logout helper ────────────────────────────────────────────────────────────
export function useLogout() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  return () => {
    logout();
    navigate('/login', { replace: true });
  };
}
