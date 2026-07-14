'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '../../services/auth.service';
import { Button, Input } from '../../components/shared';
import { AuthShell } from './AuthShell';

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
    <AuthShell>
      {sent ? (
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
            <CheckCircle size={24} className="text-emerald-700" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-ink">Check your email</h2>
            <p className="mt-1 text-sm text-ink-muted">
              We sent a password reset link to your email address. The link expires in 1 hour.
            </p>
          </div>
          <Link
            href="/login"
            className="flex items-center gap-1 text-sm font-medium text-ink-muted hover:text-ink"
          >
            <ArrowLeft size={13} />
            Back to sign in
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-light tracking-tight text-ink">Forgot password?</h1>
            <p className="mt-1 text-sm text-ink-muted">
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
            <Button type="submit" loading={isSubmitting} className="w-full justify-center">
              Send reset link
              <ArrowRight size={14} />
            </Button>
          </form>

          <div className="mt-5 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-sm text-ink-faint hover:text-ink"
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
  const searchParams = useSearchParams();
  const router = useRouter();
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
      <div className="flex min-h-screen items-center justify-center bg-canvas-cream p-4 text-ink">
        <div className="text-center">
          <p className="text-ink-muted">Invalid reset link</p>
          <Link href="/login" className="mt-3 inline-block text-sm font-medium text-ink hover:underline">
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AuthShell>
      {done ? (
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
            <CheckCircle size={24} className="text-emerald-700" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-ink">Password reset!</h2>
            <p className="mt-1 text-sm text-ink-muted">
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
            <h1 className="text-2xl font-light tracking-tight text-ink">Reset password</h1>
            <p className="mt-1 text-sm text-ink-muted">Choose a new password for your account</p>
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
            <Button type="submit" loading={isSubmitting} className="w-full justify-center">
              Update password
              <ArrowRight size={14} />
            </Button>
          </form>
        </>
      )}
    </AuthShell>
  );
};
