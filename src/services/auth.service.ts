import { apiClient } from './apiClient';
import type {
  ApiResponse,
  AuthTokens,
  AuthResponse,
  AuthUser,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResendVerificationRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
  VerifyEmailRequest,
} from '../types';

const getApiBaseUrl = () => process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

export const authService = {
  // UC01 — Register
  register: async (payload: RegisterRequest) => {
    const { data } = await apiClient.post<ApiResponse<AuthResponse>>(
      '/auth/register',
      payload
    );
    return data.data;
  },

  // UC04, UC06 — Login with email/password
  login: async (payload: LoginRequest) => {
    const { data } = await apiClient.post<ApiResponse<AuthResponse>>(
      '/auth/login',
      payload
    );
    return data.data;
  },

  // Log out current session
  logout: async (refreshToken?: string) => {
    const { data } = await apiClient.post<ApiResponse<null>>(
      '/auth/logout',
      refreshToken ? { refreshToken } : undefined
    );
    return data;
  },

  // Get current authenticated session
  getSession: async () => {
    const { data } = await apiClient.get<ApiResponse<AuthUser>>('/auth/session');
    return data.data;
  },

  getGoogleOAuthUrl: () => `${getApiBaseUrl()}/auth/google`,

  exchangeGoogleCallback: async (payload: {
    code?: string;
    sessionToken?: string;
    state?: string;
  }) => {
    const { data } = await apiClient.post<ApiResponse<AuthResponse>>(
      '/auth/google/callback',
      payload
    );
    return data.data;
  },

  // UC05 — Google OAuth
  loginWithGoogle: () => {
    window.location.href = authService.getGoogleOAuthUrl();
  },

  // UC07 — Forgot password
  forgotPassword: async (request: ForgotPasswordRequest | string) => {
    const payload = typeof request === 'string' ? { email: request } : request;
    const { data } = await apiClient.post<ApiResponse<null>>(
      '/auth/forgot-password',
      payload
    );
    return data;
  },

  // UC08 — Reset password
  resetPassword: async (
    request: ResetPasswordRequest | string,
    newPassword?: string
  ) => {
    const payload =
      typeof request === 'string'
        ? { token: request, newPassword: newPassword ?? '' }
        : request;
    const { data } = await apiClient.post<ApiResponse<null>>(
      '/auth/reset-password',
      payload
    );
    return data;
  },

  // UC03 — Verify email
  verifyEmail: async (request: VerifyEmailRequest | string) => {
    const token = typeof request === 'string' ? request : request.token;
    const { data } = await apiClient.get<ApiResponse<null>>(
      `/auth/verify?token=${encodeURIComponent(token)}`
    );
    return data;
  },

  resendVerification: async (payload: ResendVerificationRequest) => {
    const { data } = await apiClient.post<ApiResponse<null>>(
      '/auth/resend-verification',
      payload
    );
    return data;
  },

  // Refresh token
  refreshToken: async (refreshToken: string) => {
    const { data } = await apiClient.post<ApiResponse<AuthTokens>>(
      '/auth/refresh',
      { refreshToken }
    );
    return data.data;
  },

  // Get current user profile
  getProfile: async () => {
    const { data } = await apiClient.get<ApiResponse<AuthUser>>('/users/profile');
    return data.data;
  },

  getMe: async () => authService.getProfile(),

  // UC09 — Update avatar
  uploadAvatar: async (file: File) => {
    const form = new FormData();
    form.append('avatar', file);
    const { data } = await apiClient.post<ApiResponse<AuthUser | { avatarUrl: string }>>(
      '/users/avatar',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data.data;
  },

  // Update profile
  updateProfile: async (payload: UpdateProfileRequest) => {
    const { data } = await apiClient.patch<ApiResponse<AuthUser>>('/users/profile', payload);
    return data.data;
  },
};
