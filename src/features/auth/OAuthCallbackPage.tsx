import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, CheckCircle, Zap } from 'lucide-react';
import { authService } from '../../services/auth.service';
import { extractApiError } from '../../services/apiClient';
import { useAuthStore } from '../../store';
import type { AuthResponse, AuthUser } from '../../types';

type CallbackStatus = 'loading' | 'success' | 'error';

const parseUserParam = (value: string | null): AuthUser | null => {
  if (!value) return null;

  const candidates = [value];
  const base64Candidate = value.replace(/-/g, '+').replace(/_/g, '/');

  try {
    candidates.push(atob(base64Candidate));
  } catch {
    // User may already be plain JSON.
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as AuthUser;
    } catch {
      // Try the next supported encoding.
    }
  }

  return null;
};

const getRoleRedirect = (user: AuthUser) =>
  user.role === 'ADMIN' ? '/admin' : '/dashboard';

export const OAuthCallbackPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const handledRef = useRef(false);
  const { setAuth, updateTokens } = useAuthStore();
  const [status, setStatus] = useState<CallbackStatus>('loading');
  const [message, setMessage] = useState('Completing Google sign in...');

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const cleanCallbackUrl = () => {
      window.history.replaceState({}, '', '/auth/callback');
    };

    const finishAuth = (auth: AuthResponse) => {
      setAuth(auth.user, auth.accessToken, auth.refreshToken);
      cleanCallbackUrl();
      setStatus('success');
      setMessage('Google sign in successful. Redirecting...');
      window.setTimeout(() => {
        router.replace(getRoleRedirect(auth.user));
      }, 400);
    };

    const complete = async () => {
      const providerError = searchParams.get('error') || searchParams.get('message');
      if (providerError) {
        cleanCallbackUrl();
        setStatus('error');
        setMessage(providerError);
        return;
      }

      // Supported DEV 1 redirects:
      // token + user, token + session, or code/session token exchange.
      const accessToken =
        searchParams.get('accessToken') ||
        searchParams.get('access_token') ||
        searchParams.get('token');
      const refreshToken =
        searchParams.get('refreshToken') ||
        searchParams.get('refresh_token') ||
        searchParams.get('sessionToken') ||
        searchParams.get('session_token') ||
        searchParams.get('session');
      const user = parseUserParam(
        searchParams.get('user') || searchParams.get('userData')
      );

      try {
        if (accessToken && refreshToken && user) {
          finishAuth({ user, accessToken, refreshToken });
          return;
        }

        if (accessToken && refreshToken) {
          updateTokens({ accessToken, refreshToken });
          const sessionUser = await authService.getSession();
          finishAuth({ user: sessionUser, accessToken, refreshToken });
          return;
        }

        const code = searchParams.get('code') || undefined;
        const sessionToken =
          searchParams.get('sessionToken') ||
          searchParams.get('session_token') ||
          searchParams.get('session') ||
          undefined;
        const state = searchParams.get('state') || undefined;

        if (code || sessionToken) {
          const auth = await authService.exchangeGoogleCallback({
            code,
            sessionToken,
            state,
          });
          finishAuth(auth);
          return;
        }

        throw new Error('Google sign in did not return a frontend session. Please try again.');
      } catch (error) {
        cleanCallbackUrl();
        setStatus('error');
        const apiMessage = extractApiError(error);
        setMessage(
          apiMessage !== 'An unexpected error occurred'
            ? apiMessage
            : error instanceof Error
              ? error.message
              : 'Google sign in could not be completed.'
        );
      }
    };

    void complete();
  }, [router, searchParams, setAuth, updateTokens]);

  return (
    <div
      className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 .5H31.5V32' fill='none' stroke='%23ffffff06' stroke-width='1'/%3E%3C/svg%3E\")",
      }}
    >
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-mono font-bold text-lg text-gray-100 tracking-tight">
            ThreadLearn
          </span>
        </div>

        <div className="bg-[#111118] border border-white/[0.07] rounded-2xl p-6 panel-shadow">
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div
              className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${
                status === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20'
                  : status === 'error'
                    ? 'bg-rose-500/10 border-rose-500/20'
                    : 'bg-violet-500/10 border-violet-500/20'
              }`}
            >
              {status === 'success' ? (
                <CheckCircle size={24} className="text-emerald-400" />
              ) : status === 'error' ? (
                <AlertCircle size={24} className="text-rose-400" />
              ) : (
                <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              )}
            </div>

            <div>
              <h1 className="font-mono font-semibold text-xl text-gray-100">
                {status === 'success'
                  ? 'Signed in'
                  : status === 'error'
                    ? 'Google sign in failed'
                    : 'Signing you in'}
              </h1>
              <p className="text-sm text-gray-600 font-mono mt-2">{message}</p>
            </div>

            {status === 'error' && (
              <Link
                href="/login"
                className="text-sm text-violet-400 hover:text-violet-300 font-mono transition-colors flex items-center gap-1"
              >
                <ArrowLeft size={13} />
                Back to sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
