import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Zap, Mail, Lock, User, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '../../services/auth.service';
import { extractApiError } from '../../services/apiClient';
import { useAuthStore } from '../../store';
import { Button, Input } from '../../components/shared';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});
type FormData = z.infer<typeof schema>;

export const RegisterPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const { logout } = useAuthStore();

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async ({ firstName, lastName, email, password }: FormData) => {
    try {
      await authService.register({
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim(),
        email,
        password,
      });
      logout();
      setRegisteredEmail(email);
      toast.success('Account created. Please verify your email before signing in.');
    } catch (error) {
      toast.error(extractApiError(error) || 'Registration failed. Email may already be in use.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4" style={{
      backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 .5H31.5V32' fill='none' stroke='%23ffffff06' stroke-width='1'/%3E%3C/svg%3E\")"
    }}>
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-mono font-bold text-lg text-gray-100 tracking-tight">ThreadLearn</span>
        </div>

        <div className="bg-[#111118] border border-white/[0.07] rounded-2xl p-6 panel-shadow">
          {registeredEmail ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle size={24} className="text-emerald-400" />
              </div>
              <div className="text-center">
                <h1 className="font-mono font-semibold text-xl text-gray-100">Check your email</h1>
                <p className="text-sm text-gray-600 font-mono mt-2">
                  We sent a verification link to {registeredEmail}. Verify your email before signing in.
                </p>
                <p className="text-xs text-gray-700 font-mono mt-2">
                  If the link expires, use the verify email page to request a new one.
                </p>
              </div>
              <div className="w-full flex flex-col gap-2">
                <Link
                  href="/verify-email"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-mono font-medium rounded-lg border border-transparent bg-violet-600 hover:bg-violet-500 text-white transition-all duration-150"
                >
                  Verify email
                  <ArrowRight size={14} />
                </Link>
                <Link
                  href="/login"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-mono font-medium rounded-lg border border-white/10 text-gray-400 hover:text-gray-100 hover:bg-white/5 transition-all duration-150"
                >
                  Go to sign in
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="font-mono font-semibold text-xl text-gray-100">Create account</h1>
                <p className="text-sm text-gray-600 font-mono mt-1">Start your learning journey today</p>
              </div>

              <button
                type="button"
                onClick={authService.loginWithGoogle}
                className="w-full flex items-center justify-center gap-3 py-2.5 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all font-mono text-sm text-gray-300 mb-5"
              >
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[11px] text-gray-700 font-mono">or</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="First name"
                type="text"
                placeholder="First"
                prefix={<User size={13} />}
                error={errors.firstName?.message}
                {...register('firstName')}
              />
              <Input
                label="Last name"
                type="text"
                placeholder="Last"
                prefix={<User size={13} />}
                error={errors.lastName?.message}
                {...register('lastName')}
              />
            </div>
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
                <button type="button" onClick={() => setShowPassword(v => !v)} className="hover:text-gray-400 transition-colors">
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
            <Button type="submit" loading={isSubmitting} className="w-full justify-center mt-1">
              <span>Create account</span>
              <ArrowRight size={14} />
            </Button>
          </form>
          </>
          )}
        </div>

        <p className="text-center text-sm text-gray-700 font-mono mt-5">
          Already have an account?{' '}
          <Link href="/login" className="text-violet-400 hover:text-violet-300 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
