'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import { authService } from '../../services/auth.service';
import { AuthShell } from './AuthShell';

type VerifyStatus = 'loading' | 'success' | 'error' | 'missing-token';

export const VerifyEmailPage: React.FC = () => {
  const searchParams = useSearchParams();
  const processedRef = useRef(false);
  const [status, setStatus] = useState<VerifyStatus>('loading');

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const token = searchParams.get('token');
    if (!token) {
      setStatus('missing-token');
      return;
    }

    authService
      .verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [searchParams]);

  if (status === 'loading') {
    return (
      <AuthShell>
        <div className="flex flex-col items-center py-4 text-center">
          <Loader2 className="mb-4 animate-spin text-ink-muted" size={24} />
          <h1 className="text-xl font-light tracking-tight text-ink">
            Verifying your email
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            Please wait while we confirm your account.
          </p>
        </div>
      </AuthShell>
    );
  }

  if (status === 'success') {
    return (
      <AuthShell>
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
            <CheckCircle size={24} className="text-emerald-700" />
          </div>
          <div>
            <h1 className="text-xl font-light tracking-tight text-ink">
              Email verified
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              Your account is ready. You can now sign in and continue learning.
            </p>
          </div>
          <Link
            href="/login"
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-black/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas-cream"
          >
            Go to sign in
            <ArrowRight size={14} />
          </Link>
        </div>
      </AuthShell>
    );
  }

  const isMissingToken = status === 'missing-token';

  return (
    <AuthShell>
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10">
          <AlertCircle size={24} className="text-rose-700" />
        </div>
        <div>
          <h1 className="text-xl font-light tracking-tight text-ink">
            Email verification failed
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            {isMissingToken
              ? 'This verification link is missing required information.'
              : 'This verification link is invalid or has expired.'}
          </p>
        </div>
        <Link
          href="/login"
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-black/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas-cream"
        >
          Back to sign in
          <ArrowRight size={14} />
        </Link>
      </div>
    </AuthShell>
  );
};
