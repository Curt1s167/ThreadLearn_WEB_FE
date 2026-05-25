import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Zap, Mail, Lock, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '../../services/auth.service';
import { Button, Input } from '../../components/shared';

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
      setSent(true);
    } catch {
      toast.error('Failed to send reset email');
    }
  };

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
                  We sent a password reset link to your email address. The link expires in 1 hour.
                </p>
              </div>
              <Link
                to="/login"
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
                  Enter your email and we'll send you a reset link
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
                  to="/login"
                  className="text-sm text-gray-600 hover:text-gray-400 font-mono transition-colors flex items-center gap-1 justify-center"
                >
                  <ArrowLeft size={13} />
                  Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
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

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ newPassword: string; confirmPassword: string }>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async ({ newPassword }: { newPassword: string }) => {
    try {
      await authService.resetPassword(token, newPassword);
      setDone(true);
    } catch {
      toast.error('Reset link is invalid or expired');
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 font-mono">Invalid reset link</p>
          <Link
            to="/login"
            className="text-violet-400 hover:text-violet-300 font-mono text-sm mt-3 inline-block"
          >
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

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
              <Button onClick={() => navigate('/login')} className="mt-2">
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
        </div>
      </div>
    </div>
  );
};
