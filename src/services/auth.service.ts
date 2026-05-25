import { apiClient } from './apiClient';
import type {
  ApiResponse,
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  User,
} from '../types';

export const authService = {
  // UC01 — Register
  register: async (payload: RegisterPayload) => {
    const { data } = await apiClient.post<ApiResponse<AuthResponse>>(
      '/auth/register',
      payload
    );
    return data.data;
  },

  // UC04, UC06 — Login with email/password
  login: async (payload: LoginPayload) => {
    const { data } = await apiClient.post<ApiResponse<AuthResponse>>(
      '/auth/login',
      payload
    );
    return data.data;
  },

  // UC05 — Google OAuth (redirects to BE NextAuth)
  loginWithGoogle: () => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '')}/api/auth/signin/google`;
  },

  // UC07 — Forgot password
  forgotPassword: async (email: string) => {
    const { data } = await apiClient.post<ApiResponse<null>>(
      '/auth/forgot-password',
      { email }
    );
    return data;
  },

  // UC08 — Reset password
  resetPassword: async (token: string, newPassword: string) => {
    const { data } = await apiClient.post<ApiResponse<null>>(
      '/auth/reset-password',
      { token, newPassword }
    );
    return data;
  },

  // UC03 — Verify email
  verifyEmail: async (token: string) => {
    const { data } = await apiClient.get<ApiResponse<null>>(
      `/auth/verify?token=${token}`
    );
    return data;
  },

  // Refresh token
  refreshToken: async (refreshToken: string) => {
    const { data } = await apiClient.post<ApiResponse<{ accessToken: string }>>(
      '/auth/refresh',
      { refreshToken }
    );
    return data.data;
  },

  // Get current user profile
  getMe: async () => {
    const { data } = await apiClient.get<ApiResponse<User>>('/users/me');
    return data.data;
  },

  // UC09 — Update avatar
  uploadAvatar: async (file: File) => {
    const form = new FormData();
    form.append('avatar', file);
    const { data } = await apiClient.post<ApiResponse<{ avatarUrl: string }>>(
      '/users/avatar',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data.data;
  },

  // Update profile
  updateProfile: async (payload: Partial<Pick<User, 'name'>>) => {
    const { data } = await apiClient.put<ApiResponse<User>>('/users/me', payload);
    return data.data;
  },
};
