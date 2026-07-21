import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';
const UNAUTHORIZED_EVENT = 'threadlearn:unauthorized';
const DEFAULT_API_TIMEOUT_MS = 5_000;

const configuredTimeout = Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS);
const API_TIMEOUT_MS = Number.isFinite(configuredTimeout)
  ? Math.min(Math.max(configuredTimeout, 1_000), 30_000)
  : DEFAULT_API_TIMEOUT_MS;

const isBrowser = typeof window !== 'undefined';

const getLocalStorageItem = (key: string): string | null => {
  if (!isBrowser) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const setLocalStorageItem = (key: string, value: string): void => {
  if (!isBrowser) return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignored
  }
};

const removeLocalStorageItem = (key: string): void => {
  if (!isBrowser) return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignored
  }
};

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor — attach Bearer token ────────────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getLocalStorageItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor — handle 401 + token refresh ───────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
};

const notifyUnauthorized = () => {
  removeLocalStorageItem('accessToken');
  removeLocalStorageItem('refreshToken');
  if (isBrowser) {
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  }
};

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getLocalStorageItem('refreshToken');
      if (!refreshToken) {
        isRefreshing = false;
        notifyUnauthorized();
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(
          `${BASE_URL}/auth/refresh`,
          { refreshToken },
          { timeout: API_TIMEOUT_MS }
        );
        const { accessToken } = response.data.data;
        setLocalStorageItem('accessToken', accessToken);
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        notifyUnauthorized();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const extractApiError = (
  error: unknown,
  fallback = 'An unexpected error occurred'
): string => {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.response?.data?.error ||
      fallback
    );
  }
  return error instanceof Error && error.message ? error.message : fallback;
};
