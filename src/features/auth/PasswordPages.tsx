import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Zap, Mail, Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '../../services/auth.service';
import { Button, Input } from '../../components/shared';

// ─── UC07: Forgot Password ────────────────────────────────────────────────────
const forgotSchema = z.object({ email: z.string().email('Please enter a valid email') });

export const ForgotPasswordPage: React.FC = () => {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<{ email: string }>({ resolver: zodResolver(forgotSchema) });

  const onSubmit = async ({ email }: { email: string }) => {
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch {
      toast.error('Failed to send reset email. Please try again.');
    }
  };

  if (sent) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <CheckCircle size={48} className="text-emerald-400 mx-auto mb-4"/>
        <h1 className="font-mono font-bold text-2xl text-gray-100 mb-2">Email sent!</h1>
        <p className="text-gray-600 font-mono text-sm">Check your inbox for the reset link.</p>
        <Link to="/login" className="inline-block mt-6 text-violet-400 hover:text-violet-300 font-mono text-sm transition-colors">
          Back to sign in
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center">
            <Zap size={16} className="text-white"/>
          </div>
          <span className="font-mono font-bold text-lg text-gray-100">ThreadLearn</span>
        </div>
        <div className="bg-[#111118] border border-white/[0.07] rounded-2xl p-6">
          <div className="mb-6">
            <h1 className="font-mono font-semibold text-xl text-gray-100">Forgot password</h1>
            <p className="text-sm text-gray-600 font-mono mt-1">Enter your email and we will send a reset link.</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input label="Email" type="email" placeholder="you@example.com"
              prefix={<Mail size={13}/>} error={errors.email?.message} {...register('email')}/>
            <Button type="submit" loading={isSubmitting} className="w-full justify-center">Send reset link</Button>
          </form>
        </div>
        <div className="text-center mt-5">
          <Link to="/login" className="text-sm text-gray-700 hover:text-violet-400 font-mono transition-colors flex items-center gap-1 justify-center">
            <ArrowLeft size={13}/> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

// ─── UC08: Reset Password ─────────────────────────────────────────────────────
const resetSchema = z.object({
  newPassword:     z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match', path: ['confirmPassword'],
});

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [done, setDone] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<{ newPassword: string; confirmPassword: string }>({ resolver: zodResolver(resetSchema) });

  const onSubmit = async ({ newPassword }: { newPassword: string; confirmPassword: string }) => {
    try {
      await authService.resetPassword(token, newPassword);
      setDone(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch {
      toast.error('Reset failed. The link may have expired.');
    }
  };

  if (!token) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <p className="text-gray-600 font-mono">Invalid or missing reset token.</p>
    </div>
  );

  if (done) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-center">
        <CheckCircle size={48} className="text-emerald-400 mx-auto mb-4"/>
        <h1 className="font-mono font-bold text-2xl text-gray-100">Password reset!</h1>
        <p className="text-gray-600 font-mono text-sm mt-2">Redirecting to sign in...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-[#111118] border border-white/[0.07] rounded-2xl p-6">
          <div className="mb-6">
            <h1 className="font-mono font-semibold text-xl text-gray-100">Set new password</h1>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input label="New password" type="password" placeholder="••••••••"
              prefix={<Lock size={13}/>} error={errors.newPassword?.message} {...register('newPassword')}/>
            <Input label="Confirm password" type="password" placeholder="••••••••"
              prefix={<Lock size={13}/>} error={errors.confirmPassword?.message} {...register('confirmPassword')}/>
            <Button type="submit" loading={isSubmitting} className="w-full justify-center">Reset password</Button>
          </form>
        </div>
      </div>
    </div>
  );
};
