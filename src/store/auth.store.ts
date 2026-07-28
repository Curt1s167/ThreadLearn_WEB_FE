'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserStats } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  stats: UserStats | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;

  // Actions
  setHasHydrated: (hasHydrated: boolean) => void;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;
  setStats: (stats: UserStats) => void;
  updateAccessToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      stats: null,
      isAuthenticated: false,
      hasHydrated: false,

      setHasHydrated: (hasHydrated) => set({ hasHydrated }),

      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },

      setUser: (user) => set({ user }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : state.user,
        })),

      setStats: (stats) => set({ stats }),

      updateAccessToken: (token) => {
        localStorage.setItem('accessToken', token);
        set({ accessToken: token });
      },

      logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, accessToken: null, refreshToken: null, stats: null, isAuthenticated: false });
      },
    }),
    {
      name: 'threadlearn-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
