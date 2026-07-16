'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '../../services/auth.service';
import { Button, Input } from '../../components/shared';
import { AuthShell } from './AuthShell';

const schema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });
type FormData = z.infer<typeof schema>;

export const RegisterPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async ({ firstName, lastName, email, password }: FormData) => {
    try {
      await authService.register({ firstName, lastName, email, password });
      toast.success('Account created. Check your email for the 6-digit code.');
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch {
      toast.error('Registration failed. Email may already be in use.');
    }
  };

  return (
    <AuthShell
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-ink hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <div className="mb-6">
        <h1 className="text-2xl font-light tracking-tight text-ink">Create account</h1>
        <p className="mt-1 text-sm text-ink-muted">Start your learning journey today</p>
      </div>

      <button
        type="button"
        onClick={authService.loginWithGoogle}
        className="mb-5 flex w-full items-center justify-center gap-3 rounded-full border border-black/10 py-2.5 text-sm text-ink transition hover:bg-black/[0.03]"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continue with Google
      </button>

      <div className="mb-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-black/10" />
        <span className="text-[11px] text-ink-faint">or</span>
        <div className="h-px flex-1 bg-black/10" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="First name"
          type="text"
          placeholder="First name"
          prefix={<User size={13} />}
          error={errors.firstName?.message}
          {...register('firstName')}
        />
        <Input
          label="Last name"
          type="text"
          placeholder="Last name"
          prefix={<User size={13} />}
          error={errors.lastName?.message}
          {...register('lastName')}
        />
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          prefix={<Mail size={13} />}
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Min. 6 characters"
          prefix={<Lock size={13} />}
          suffix={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-ink-faint hover:text-ink transition-colors"
            >
              {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          }
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirm password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Repeat password"
          prefix={<Lock size={13} />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button type="submit" loading={isSubmitting} className="mt-1 w-full justify-center">
          <span>Create account</span>
          <ArrowRight size={14} />
        </Button>
      </form>
    </AuthShell>
  );
};
