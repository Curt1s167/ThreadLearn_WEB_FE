import type { UserRole } from '../types';
import { isSafeInternalPath } from './safeNavigation';

const AUTH_PATHS = new Set(['/login', '/register', '/forgot-password', '/auth/callback']);

export const getRoleHomePath = (role: UserRole): string => {
  if (role === 'ADMIN') return '/admin';
  if (role === 'INSTRUCTOR') return '/instructor';
  return '/dashboard';
};

const isAuthPath = (path: string) => AUTH_PATHS.has(path.split(/[?#]/, 1)[0]);

export const getPostLoginPath = (role: UserRole, from?: string | null): string => {
  const candidate = from ?? undefined;
  if (isSafeInternalPath(candidate) && !isAuthPath(candidate)) return candidate;
  return getRoleHomePath(role);
};
