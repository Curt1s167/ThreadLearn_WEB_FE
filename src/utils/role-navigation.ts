import type { UserRole } from '../types';

export const roleHome = (role?: UserRole | string | null): string => {
  switch (String(role ?? '').toUpperCase()) {
    case 'ADMIN': return '/admin';
    case 'INSTRUCTOR': return '/instructor';
    default: return '/dashboard';
  }
};

export const canAccessPath = (role: UserRole | string | null | undefined, path: string): boolean => {
  const normalized = String(role ?? '').toUpperCase();
  if (path.startsWith('/admin')) return normalized === 'ADMIN';
  if (path.startsWith('/instructor')) return normalized === 'INSTRUCTOR';
  return normalized === 'STUDENT' || !path.startsWith('/');
};
