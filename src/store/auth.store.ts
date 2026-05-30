'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthTokens, AuthUser, UserStats } from '../types';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const AUTH_STORE_KEY = 'threadlearn-auth';

type StoredAuthTokens = {
  accessToken: string | null;
  refreshToken: string | null;
};

const canUseStorage = () => typeof window !== 'undefined';

export const getStoredAuthTokens = (): StoredAuthTokens => {
  if (!canUseStorage()) {
    return { accessToken: null, refreshToken: null };
  }

  return {
    accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
  };
};

export const persistAuthTokens = (tokens: Partial<AuthTokens>) => {
  if (!canUseStorage()) return;

  if (tokens.accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  }

  if (tokens.refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }
};

export const clearAuthStorage = () => {
  if (!canUseStorage()) return;

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(AUTH_STORE_KEY);
};

export const sanitizeAuthUser = (user: AuthUser): AuthUser => {
  const fallbackName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  const sanitized: AuthUser = {
    _id: user._id || user.id || '',
    id: user.id || user._id,
    email: user.email,
    name: user.name || fallbackName || user.email,
    role: user.role,
    planType: user.planType,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  if (user.firstName !== undefined) sanitized.firstName = user.firstName;
  if (user.lastName !== undefined) sanitized.lastName = user.lastName;
  if (user.avatarUrl !== undefined) sanitized.avatarUrl = user.avatarUrl;
  if (user.subscriptionExpiresAt !== undefined) {
    sanitized.subscriptionExpiresAt = user.subscriptionExpiresAt;
  }
  if (user.isLocked !== undefined) sanitized.isLocked = user.isLocked;
  if (user.isEmailVerified !== undefined) {
    sanitized.isEmailVerified = user.isEmailVerified;
  }
  if (user.isVerified !== undefined) sanitized.isVerified = user.isVerified;
  if (user.isActive !== undefined) sanitized.isActive = user.isActive;
  if (user.lastLoginAt !== undefined) sanitized.lastLoginAt = user.lastLoginAt;

  return sanitized;
};

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  stats: UserStats | null;
  isAuthenticated: boolean;

  // Actions
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  setUser: (user: AuthUser) => void;
  setStats: (stats: UserStats) => void;
  updateAccessToken: (token: string) => void;
  updateTokens: (tokens: Partial<AuthTokens>) => void;
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

      setAuth: (user, accessToken, refreshToken) => {
        persistAuthTokens({ accessToken, refreshToken });
        set({
          user: sanitizeAuthUser(user),
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      },

      setUser: (user) => set({ user: sanitizeAuthUser(user) }),

      setStats: (stats) => set({ stats }),

      updateAccessToken: (token) => {
        persistAuthTokens({ accessToken: token });
        set({ accessToken: token });
      },

      updateTokens: (tokens) => {
        persistAuthTokens(tokens);
        set((state) => ({
          accessToken: tokens.accessToken ?? state.accessToken,
          refreshToken: tokens.refreshToken ?? state.refreshToken,
        }));
      },

      logout: () => {
        clearAuthStorage();
        set({ user: null, accessToken: null, refreshToken: null, stats: null, isAuthenticated: false });
      },
    }),
    {
      name: AUTH_STORE_KEY,
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
