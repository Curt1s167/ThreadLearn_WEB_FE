import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Zap, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store';
import { Button, Input } from '../../components/shared';

const schema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type FormData = z.infer<typeof schema>;

export const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const from = searchParams.get('from') || '/';

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const result = await authService.login(data as { email: string; password: string });
      setAuth(result.user, result.accessToken, result.refreshToken);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch {
      toast.error('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-mono font-bold text-lg text-gray-100 tracking-tight">ThreadLearn</span>
        </div>

        <div className="bg-[#111118] border border-white/[0.07] rounded-2xl p-6">
          <div className="mb-6">
            <h1 className="font-mono font-semibold text-xl text-gray-100">Sign in</h1>
            <p className="text-sm text-gray-600 font-mono mt-1">Continue your learning journey</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input label="Email" type="email" placeholder="you@example.com"
              prefix={<Mail size={13}/>} error={errors.email?.message} {...register('email')} />
            <Input label="Password" type={showPassword ? 'text' : 'password'} placeholder="••••••••"
              prefix={<Lock size={13}/>}
              suffix={<button type="button" onClick={() => setShowPassword(v => !v)}>
                {showPassword ? <EyeOff size={13}/> : <Eye size={13}/>}
              </button>}
              error={errors.password?.message} {...register('password')} />

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-violet-400 hover:text-violet-300 font-mono transition-colors">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" loading={isSubmitting} className="w-full justify-center">
              <span>Sign in</span>
              <ArrowRight size={14}/>
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-700 font-mono mt-5">
          No account?{' '}
          <Link to="/register" className="text-violet-400 hover:text-violet-300 transition-colors">Create one</Link>
        </p>
      </div>
    </div>
  );
};

