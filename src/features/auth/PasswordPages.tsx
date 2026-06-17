import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Zap, Mail, Lock, ArrowLeft, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '../../services/auth.service';
import { extractApiError } from '../../services/apiClient';
import { Button, Input } from '../../components/shared';

const AuthShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
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
        {children}
      </div>
    </div>
  </div>
);

const InlineError: React.FC<{ message: string }> = ({ message }) => (
  <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 flex gap-2">
    <AlertCircle size={14} className="text-rose-400 mt-0.5 shrink-0" />
    <p className="text-xs text-rose-300 font-mono">{message}</p>
  </div>
);

// ─── UC07: Forgot Password ───────────────────────────────────────────────────
const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

export const ForgotPasswordPage: React.FC = () => {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ email: string }>({ resolver: zodResolver(forgotSchema) });

  const onSubmit = async ({ email }: { email: string }) => {
    try {
      await authService.forgotPassword(email);
    } catch {
      // Keep the response generic so account existence is not revealed.
    } finally {
      setSent(true);
    }
  };

  return (
    <AuthShell>
          {sent ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle size={24} className="text-emerald-400" />
              </div>
              <div className="text-center">
                <h2 className="font-mono font-semibold text-lg text-gray-100">
                  Check your email
                </h2>
                <p className="text-sm text-gray-600 font-mono mt-1">
                  If an account exists for that email, we sent a password reset link.
                </p>
              </div>
              <Link
                href="/login"
                className="text-sm text-violet-400 hover:text-violet-300 font-mono transition-colors flex items-center gap-1"
              >
                <ArrowLeft size={13} />
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="font-mono font-semibold text-xl text-gray-100">
                  Forgot password?
                </h1>
                <p className="text-sm text-gray-600 font-mono mt-1">
                  Enter your email and we&apos;ll send you a reset link
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  prefix={<Mail size={13} />}
                  error={errors.email?.message}
                  {...register('email')}
                />
                <Button
                  type="submit"
                  loading={isSubmitting}
                  className="w-full justify-center"
                >
                  Send reset link
                  <ArrowRight size={14} />
                </Button>
              </form>

              <div className="mt-5 text-center">
                <Link
                  href="/login"
                  className="text-sm text-gray-600 hover:text-gray-400 font-mono transition-colors flex items-center gap-1 justify-center"
                >
                  <ArrowLeft size={13} />
                  Back to sign in
                </Link>
              </div>
            </>
          )}
    </AuthShell>
  );
};

// ─── UC08: Reset Password ────────────────────────────────────────────────────
const resetSchema = z
  .object({
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

const resendVerificationSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

type ResendVerificationForm = z.infer<typeof resendVerificationSchema>;

export const ResetPasswordPage: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';
  const [done, setDone] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ newPassword: string; confirmPassword: string }>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async ({ newPassword }: { newPassword: string }) => {
    setResetError(null);

    try {
      await authService.resetPassword(token, newPassword);
      setDone(true);
    } catch (error) {
      setResetError(extractApiError(error) || 'Reset link is invalid or expired');
      toast.error('Reset link is invalid or expired');
    }
  };

  if (!token) {
    return (
      <AuthShell>
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <AlertCircle size={24} className="text-rose-400" />
          </div>
          <div>
            <h1 className="font-mono font-semibold text-xl text-gray-100">Invalid reset link</h1>
            <p className="text-sm text-gray-600 font-mono mt-2">
              Request a new password reset email to continue.
            </p>
          </div>
          <Link
            href="/forgot-password"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-mono font-medium rounded-lg border border-transparent bg-violet-600 hover:bg-violet-500 text-white transition-all duration-150"
          >
            Request reset link
            <ArrowRight size={14} />
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
          {done ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle size={24} className="text-emerald-400" />
              </div>
              <div className="text-center">
                <h2 className="font-mono font-semibold text-lg text-gray-100">
                  Password reset!
                </h2>
                <p className="text-sm text-gray-600 font-mono mt-1">
                  Your password has been updated. You can now sign in.
                </p>
              </div>
              <Button onClick={() => router.push('/login')} className="mt-2">
                Sign in
                <ArrowRight size={14} />
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="font-mono font-semibold text-xl text-gray-100">
                  Reset password
                </h1>
                <p className="text-sm text-gray-600 font-mono mt-1">
                  Choose a new password for your account
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                {resetError && <InlineError message={resetError} />}

                <Input
                  label="New password"
                  type="password"
                  placeholder="Min. 6 characters"
                  prefix={<Lock size={13} />}
                  error={errors.newPassword?.message}
                  {...register('newPassword')}
                />
                <Input
                  label="Confirm new password"
                  type="password"
                  placeholder="Repeat password"
                  prefix={<Lock size={13} />}
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />
                <Button
                  type="submit"
                  loading={isSubmitting}
                  className="w-full justify-center"
                >
                  Update password
                  <ArrowRight size={14} />
                </Button>
              </form>
            </>
          )}
    </AuthShell>
  );
};

export const VerifyEmailPage: React.FC = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const hasVerifiedRef = useRef(false);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    token ? 'loading' : 'error'
  );
  const [message, setMessage] = useState(
    token ? 'Verifying your email...' : 'Verification token is missing or invalid.'
  );
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResendVerificationForm>({
    resolver: zodResolver(resendVerificationSchema),
  });

  useEffect(() => {
    if (!token || hasVerifiedRef.current) return;

    hasVerifiedRef.current = true;

    const verify = async () => {
      try {
        await authService.verifyEmail(token);
        setStatus('success');
        setMessage('Your email has been verified. You can now sign in.');
      } catch (error) {
        setStatus('error');
        setMessage(extractApiError(error) || 'Verification link is invalid or expired.');
      }
    };

    void verify();
  }, [token]);

  const onResend = async ({ email }: ResendVerificationForm) => {
    setResendMessage(null);
    setResendError(null);

    try {
      await authService.resendVerification({ email });
      setResendMessage('If the account exists and still needs verification, we sent a new email.');
    } catch (error) {
      setResendError(extractApiError(error) || 'Could not resend verification email.');
    }
  };

  return (
    <AuthShell>
      <div className="flex flex-col items-center gap-4 py-4">
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

        <div className="text-center">
          <h1 className="font-mono font-semibold text-xl text-gray-100">
            {status === 'success'
              ? 'Email verified'
              : status === 'error'
                ? 'Verification failed'
                : 'Verifying email'}
          </h1>
          <p className="text-sm text-gray-600 font-mono mt-2">{message}</p>
        </div>

        {status === 'success' && (
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-mono font-medium rounded-lg border border-transparent bg-violet-600 hover:bg-violet-500 text-white transition-all duration-150"
          >
            Go to sign in
            <ArrowRight size={14} />
          </Link>
        )}

        {status === 'error' && (
          <form onSubmit={handleSubmit(onResend)} className="w-full flex flex-col gap-4 mt-2">
            <div className="text-left">
              <h2 className="font-mono font-semibold text-sm text-gray-200">
                Resend verification
              </h2>
              <p className="text-xs text-gray-600 font-mono mt-1">
                Enter your email and we&apos;ll send a fresh verification link.
              </p>
            </div>

            {resendMessage && (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5">
                <p className="text-xs text-emerald-300 font-mono">{resendMessage}</p>
              </div>
            )}
            {resendError && <InlineError message={resendError} />}

            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              prefix={<Mail size={13} />}
              error={errors.email?.message}
              {...register('email')}
            />
            <Button type="submit" loading={isSubmitting} className="w-full justify-center">
              Resend verification
              <ArrowRight size={14} />
            </Button>
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-gray-400 font-mono transition-colors flex items-center gap-1 justify-center"
            >
              <ArrowLeft size={13} />
              Back to sign in
            </Link>
          </form>
        )}
      </div>
    </AuthShell>
  );
};
