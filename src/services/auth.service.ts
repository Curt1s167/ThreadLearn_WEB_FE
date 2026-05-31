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

const getBackendOrigin = () => {
  try {
    return new URL(getApiBaseUrl()).origin;
  } catch {
    return getApiBaseUrl().replace(/\/api\/v\d+\/?$/, '');
  }
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const hasOwn = (value: Record<string, unknown>, key: string) =>
  Object.prototype.hasOwnProperty.call(value, key);

const getNested = (value: unknown, path: string[]) =>
  path.reduce<unknown>((current, key) => (
    isObject(current) ? current[key] : undefined
  ), value);

const looksLikeUser = (value: unknown): value is AuthUser =>
  isObject(value) &&
  typeof value.email === 'string' &&
  (typeof value.id === 'string' || typeof value._id === 'string');

const extractUser = (response: unknown): AuthUser => {
  const candidates = [
    getNested(response, ['data', 'user']),
    getNested(response, ['data', 'data', 'user']),
    getNested(response, ['data', 'data', 'data', 'user']),
    getNested(response, ['data', 'data']),
    getNested(response, ['data']),
    getNested(response, ['user']),
    response,
  ];

  const user = candidates.find(looksLikeUser);
  if (!user) {
    throw new Error('Profile response did not include a valid user object');
  }

  return user;
};

const unwrapApiData = <T>(response: unknown): T => {
  if (!isObject(response) || !hasOwn(response, 'data')) return response as T;

  const firstData = response.data;
  if (isObject(firstData) && hasOwn(firstData, 'data')) {
    return firstData.data as T;
  }

  return firstData as T;
};

export const normalizeAvatarUrl = (avatarUrl?: string) => {
  if (!avatarUrl) return avatarUrl;
  if (/^https?:\/\//i.test(avatarUrl)) return avatarUrl;

  const backendOrigin = getBackendOrigin();
  if (avatarUrl.startsWith('/uploads/')) {
    return `${backendOrigin}${avatarUrl}`;
  }
  if (avatarUrl.startsWith('uploads/')) {
    return `${backendOrigin}/${avatarUrl}`;
  }

  return avatarUrl;
};

const normalizeAuthUser = (user: AuthUser): AuthUser => {
  const fallbackName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();

  return {
    ...user,
    _id: user._id || user.id || '',
    id: user.id || user._id,
    name: user.name || fallbackName || user.email,
    ...(user.avatarUrl !== undefined ? { avatarUrl: normalizeAvatarUrl(user.avatarUrl) } : {}),
  };
};

const extractAndNormalizeUser = (response: unknown) => normalizeAuthUser(extractUser(response));

const normalizeAuthResponse = (response: unknown): AuthResponse => {
  const payload = unwrapApiData<AuthResponse>(response);
  return {
    ...payload,
    user: extractAndNormalizeUser(payload.user ?? payload),
  };
};

type AvatarUploadResponse = AuthUser | { avatarUrl: string };

const normalizeAvatarUploadResponse = (response: unknown): AvatarUploadResponse => {
  try {
    return extractAndNormalizeUser(response);
  } catch {
    const payload = unwrapApiData<AvatarUploadResponse>(response);
    if (!isObject(payload) || typeof payload.avatarUrl !== 'string') {
      throw new Error('Avatar upload response did not include a valid avatar URL or user object');
    }
    return { avatarUrl: normalizeAvatarUrl(payload.avatarUrl) || payload.avatarUrl };
  }
};

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
    return normalizeAuthResponse(data);
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
    return extractAndNormalizeUser(data);
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
    return normalizeAuthResponse(data);
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
    const { data } = await apiClient.post<ApiResponse<null>>(
      '/auth/verify-email',
      { token }
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
    return extractAndNormalizeUser(data);
  },

  getMe: async () => authService.getProfile(),

  // UC09 — Update avatar
  uploadAvatar: async (file: File) => {
    const form = new FormData();
    form.append('avatar', file);
    const { data } = await apiClient.post<ApiResponse<AvatarUploadResponse>>(
      '/users/avatar',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return normalizeAvatarUploadResponse(data);
  },

  // Update profile
  updateProfile: async (payload: UpdateProfileRequest) => {
    const { data } = await apiClient.patch<ApiResponse<AuthUser>>('/users/profile', payload);
    return extractAndNormalizeUser(data);
  },
};
