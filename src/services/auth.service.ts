import { apiClient } from './apiClient';
import type {
  ApiResponse,
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  User,
} from '../types';

/**
 * BE returns user with: { id, email, firstName, lastName, role, isPremium, avatarUrl }
 * FE consumes: { _id, email, name, role, planType, avatarUrl }
 * This adapter bridges the two shapes — single source of truth.
 */
function mapUserFromBE(beUser: any): User {
  return {
    _id:       beUser._id ?? beUser.id ?? '',
    email:     beUser.email,
    name:      beUser.name ?? `${beUser.firstName ?? ''} ${beUser.lastName ?? ''}`.trim(),
    avatarUrl: beUser.avatarUrl,
    role:      beUser.role ?? 'STUDENT',
    planType:  beUser.planType ?? (beUser.isPremium ? 'PREMIUM' : 'FREE'),
    subscriptionExpiresAt: beUser.subscriptionExpiresAt,
    isLocked:        beUser.isLocked,
    isEmailVerified: beUser.isEmailVerified,
    googleId:        beUser.googleId,
    createdAt:       beUser.createdAt,
    updatedAt:       beUser.updatedAt,
  };
}

function mapAuthResponse(raw: any): AuthResponse {
  return {
    user:         mapUserFromBE(raw.user),
    accessToken:  raw.accessToken,
    refreshToken: raw.refreshToken,
  };
}

export const authService = {
  register: async (payload: RegisterPayload) => {
    const { data } = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', payload);
    return mapAuthResponse(data.data);
  },

  login: async (payload: LoginPayload) => {
    const { data } = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', payload);
    return mapAuthResponse(data.data);
  },

  loginWithGoogle: () => {
    const base = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') ?? 'http://localhost:5000';
    window.location.href = `${base}/api/v1/auth/google`;
  },

  forgotPassword: async (email: string) => {
    const { data } = await apiClient.post<ApiResponse<null>>('/auth/forgot-password', { email });
    return data;
  },

  resetPassword: async (token: string, newPassword: string) => {
    const { data } = await apiClient.post<ApiResponse<null>>('/auth/reset-password', { token, newPassword });
    return data;
  },

  verifyEmail: async (token: string) => {
    const { data } = await apiClient.get<ApiResponse<null>>(`/auth/verify?token=${token}`);
    return data;
  },

  refreshToken: async (refreshToken: string) => {
    const { data } = await apiClient.post<ApiResponse<{ accessToken: string }>>('/auth/refresh', { refreshToken });
    return data.data;
  },

  getMe: async () => {
    // BE returns { user: {...} } or the user directly — handle both.
    const { data } = await apiClient.get<ApiResponse<any>>('/auth/me');
    const raw = data.data?.user ?? data.data;
    return mapUserFromBE(raw);
  },

  uploadAvatar: async (file: File) => {
    const form = new FormData();
    form.append('avatar', file);
    const { data } = await apiClient.post<ApiResponse<{ avatarUrl: string }>>(
      '/users/avatar', form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data.data;
  },

  updateProfile: async (payload: Partial<Pick<User, 'name'>>) => {
    const { data } = await apiClient.put<ApiResponse<User>>('/users/me', payload);
    return data.data;
  },
};
