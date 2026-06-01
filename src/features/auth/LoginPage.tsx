import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Zap, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store';
import { Button, Input } from '../../components/shared';

const schema = z.object({
  email:    z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu cần ≥ 6 ký tự'),
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
      const result = await authService.login(data);
      setAuth(result.user, result.accessToken, result.refreshToken);
      toast.success(`Chào mừng trở lại, ${result.user.name?.split(' ').slice(-1)[0] ?? ''}!`);
      navigate(from, { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Email hoặc mật khẩu không đúng.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background atmosphere */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-72 h-72 rounded-full bg-violet-600/20 blur-[120px]"/>
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 rounded-full bg-emerald-500/10 blur-[120px]"/>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm"
      >
        <Link to="/" className="flex items-center gap-2.5 mb-8 justify-center group">
          <motion.div
            whileHover={{ rotate: -10 }}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-lg shadow-violet-500/30"
          >
            <Zap size={17} className="text-white"/>
          </motion.div>
          <span className="font-mono font-bold text-lg text-gray-100 tracking-tight group-hover:text-violet-300 transition-colors">
            ThreadLearn
          </span>
        </Link>

        <div className="bg-[#111118] border border-white/[0.08] rounded-2xl p-6 shadow-2xl shadow-violet-900/10">
          <div className="mb-6">
            <h1 className="font-mono font-semibold text-xl text-gray-100">Đăng nhập</h1>
            <p className="text-sm text-gray-600 font-mono mt-1">
              Tiếp tục hành trình học của bạn
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <Input
              label="Email" type="email" placeholder="you@example.com" autoComplete="email"
              prefix={<Mail size={13}/>} error={errors.email?.message} {...register('email')}
            />
            <Input
              label="Mật khẩu"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              prefix={<Lock size={13}/>}
              suffix={
                <button
                  type="button"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff size={13}/> : <Eye size={13}/>}
                </button>
              }
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-xs text-violet-400 hover:text-violet-300 font-mono transition-colors"
              >
                Quên mật khẩu?
              </Link>
            </div>

            <Button type="submit" loading={isSubmitting} className="w-full justify-center">
              <span>Đăng nhập</span>
              <ArrowRight size={14}/>
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-700 font-mono mt-5">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-violet-400 hover:text-violet-300 transition-colors">
            Đăng ký ngay
          </Link>
        </p>
      </motion.div>
    </div>
  );
};
