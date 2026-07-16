'use client';

import React, { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowRight, CheckCircle, Mail, RefreshCw, ShieldCheck } from 'lucide-react';
import { authService } from '../../services/auth.service';
import { Button, Input } from '../../components/shared';
import { AuthShell } from './AuthShell';

type VerifyStatus = 'idle' | 'submitting' | 'success';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emptyCode = () => Array<string>(OTP_LENGTH).fill('');

export const VerifyEmailPage: React.FC = () => {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') ?? '';
  const hasLegacyToken = searchParams.has('token');
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const [email, setEmail] = useState(initialEmail);
  const [digits, setDigits] = useState<string[]>(emptyCode);
  const [status, setStatus] = useState<VerifyStatus>('idle');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [resendMessage, setResendMessage] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const trimmedEmail = email.trim();
  const code = digits.join('');
  const isEmailValid = EMAIL_PATTERN.test(trimmedEmail);
  const isCodeValid = /^\d{6}$/.test(code);
  const isSubmitting = status === 'submitting';
  const canSubmit = isEmailValid && isCodeValid && !isSubmitting;

  const subtitle = useMemo(() => {
    if (hasLegacyToken) {
      return 'Verification links are no longer used. Enter your email and the 6-digit code from your inbox.';
    }

    return 'Enter the 6-digit code sent to your email.';
  }, [hasLegacyToken]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timeoutId = window.setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timeoutId);
  }, [cooldown]);

  const validateForm = () => {
    const nextEmailError = isEmailValid ? '' : 'Enter a valid email address.';
    const nextCodeError = isCodeValid ? '' : 'Enter the 6-digit code from your email.';
    setEmailError(nextEmailError);
    setCodeError(nextCodeError);
    return !nextEmailError && !nextCodeError;
  };

  const focusInput = (index: number) => {
    inputsRef.current[index]?.focus();
    inputsRef.current[index]?.select();
  };

  const applyDigits = (startIndex: number, value: string) => {
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue) return;

    setDigits((current) => {
      const next = [...current];
      numericValue
        .slice(0, OTP_LENGTH - startIndex)
        .split('')
        .forEach((digit, offset) => {
          next[startIndex + offset] = digit;
        });
      return next;
    });

    setCodeError('');
    setError('');
    const nextFocusIndex = Math.min(startIndex + numericValue.length, OTP_LENGTH - 1);
    window.setTimeout(() => focusInput(nextFocusIndex), 0);
  };

  const handleDigitChange = (index: number, value: string) => {
    if (value.length > 1) {
      applyDigits(index, value);
      return;
    }

    const numericValue = value.replace(/\D/g, '');
    setDigits((current) => {
      const next = [...current];
      next[index] = numericValue;
      return next;
    });
    setCodeError('');
    setError('');

    if (numericValue && index < OTP_LENGTH - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      event.preventDefault();
      focusInput(index - 1);
      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      focusInput(index - 1);
      return;
    }

    if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      event.preventDefault();
      focusInput(index + 1);
    }
  };

  const handlePaste = (index: number, event: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedDigits = event.clipboardData.getData('text').replace(/\D/g, '');
    if (!pastedDigits) return;

    event.preventDefault();
    applyDigits(index, pastedDigits);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResendMessage('');
    setError('');

    if (!validateForm()) return;

    try {
      setStatus('submitting');
      await authService.verifyEmail({ email: trimmedEmail, code });
      setStatus('success');
    } catch {
      setStatus('idle');
      setError('We could not verify this code. Check the email and code, then try again.');
    }
  };

  const handleResend = async () => {
    setResendMessage('');
    setError('');

    if (!isEmailValid) {
      setEmailError('Enter a valid email address before requesting a new code.');
      return;
    }

    try {
      setResendLoading(true);
      await authService.resendVerification(trimmedEmail);
      setResendMessage('A new 6-digit code was sent to your email.');
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch {
      setResendMessage('');
      setError('We could not resend the code right now. Please try again shortly.');
    } finally {
      setResendLoading(false);
    }
  };

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

  return (
    <AuthShell
      footer={
        <>
          Already verified?{' '}
          <Link href="/login" className="font-medium text-ink hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <div className="mb-6">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-black/10 bg-black/[0.03]">
          <ShieldCheck size={22} className="text-ink" />
        </div>
        <h1 className="text-2xl font-light tracking-tight text-ink">Verify email</h1>
        <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>
      </div>

      {hasLegacyToken ? (
        <div className="mb-5 flex gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-left">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-700" />
          <p className="text-xs leading-5 text-amber-800">
            Old verification links are no longer supported. Use the OTP code from your email instead.
          </p>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          prefix={<Mail size={13} />}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setEmailError('');
            setError('');
          }}
          error={emailError}
          autoComplete="email"
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-ink-muted">Verification code</label>
          <div className="grid grid-cols-6 gap-2">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  inputsRef.current[index] = element;
                }}
                type="text"
                inputMode="numeric"
                pattern="\d*"
                maxLength={1}
                value={digit}
                onChange={(event) => handleDigitChange(index, event.target.value)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                onPaste={(event) => handlePaste(index, event)}
                disabled={isSubmitting}
                aria-label={`Verification code digit ${index + 1}`}
                className={`input-field h-12 px-0 text-center text-lg font-medium disabled:opacity-60 ${codeError ? 'border-rose-500/50 focus:ring-rose-500/20' : ''}`}
              />
            ))}
          </div>
          {codeError ? <p className="text-xs text-rose-600">{codeError}</p> : null}
        </div>

        {error ? (
          <div className="flex gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-left text-xs leading-5 text-rose-700">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {resendMessage ? (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs leading-5 text-emerald-700">
            {resendMessage}
          </div>
        ) : null}

        <Button type="submit" loading={isSubmitting} disabled={!canSubmit} className="mt-1 w-full justify-center">
          <span>Verify email</span>
          <ArrowRight size={14} />
        </Button>

        <button
          type="button"
          onClick={handleResend}
          disabled={resendLoading || cooldown > 0}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-ink-muted transition hover:border-black/25 hover:bg-black/[0.03] hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw size={14} className={resendLoading ? 'animate-spin' : ''} />
          {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
        </button>
      </form>
    </AuthShell>
  );
};
