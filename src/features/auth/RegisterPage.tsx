import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Zap, Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store';
import { Button, Input } from '../../components/shared';

const schema = z.object({
  name:            z.string().min(2, 'Họ tên cần ≥ 2 ký tự'),
  email:           z.string().email('Email không hợp lệ'),
  password:        z.string().min(6, 'Mật khẩu cần ≥ 6 ký tự'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Mật khẩu nhập lại không khớp',
  path: ['confirmPassword'],
});
type FormData = z.infer<typeof schema>;

export const RegisterPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema), mode: 'onBlur' });

  const password = watch('password') ?? '';
  const strength = (() => {
    let s = 0;
    if (password.length >= 6)  s++;
    if (password.length >= 10) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s; // 0..5
  })();
  const strengthLabel = ['Rất yếu', 'Yếu', 'Trung bình', 'Khá', 'Mạnh', 'Rất mạnh'][strength];
  const strengthColor = ['bg-rose-500', 'bg-rose-500', 'bg-amber-500', 'bg-amber-400', 'bg-emerald-500', 'bg-emerald-400'][strength];

  const onSubmit = async ({ name, email, password }: FormData) => {
    try {
      const result = await authService.register({ name, email, password });
      setAuth(result.user, result.accessToken, result.refreshToken);
      toast.success('Tạo tài khoản thành công 🎉');
      navigate('/');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Đăng ký thất bại. Email có thể đã được dùng.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-72 h-72 rounded-full bg-violet-600/15 blur-[120px]"/>
        <div className="absolute bottom-1/4 right-1/3 w-72 h-72 rounded-full bg-emerald-500/10 blur-[120px]"/>
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
            <h1 className="font-mono font-semibold text-xl text-gray-100">Tạo tài khoản</h1>
            <p className="text-sm text-gray-600 font-mono mt-1">
              Bắt đầu hành trình học lập trình đa luồng
            </p>
          </div>

          <button
            type="button"
            onClick={authService.loginWithGoogle}
            className="w-full flex items-center justify-center gap-3 py-2.5 rounded-lg border border-white/10
                       hover:border-white/20 hover:bg-white/5 transition-all
                       font-mono text-sm text-gray-300 mb-5"
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Tiếp tục với Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-white/[0.06]"/>
            <span className="text-[11px] text-gray-700 font-mono">hoặc</span>
            <div className="flex-1 h-px bg-white/[0.06]"/>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <Input
              label="Họ tên" type="text" placeholder="Nguyễn Văn A" autoComplete="name"
              prefix={<User size={13}/>} error={errors.name?.message} {...register('name')}
            />
            <Input
              label="Email" type="email" placeholder="you@example.com" autoComplete="email"
              prefix={<Mail size={13}/>} error={errors.email?.message} {...register('email')}
            />
            <div>
              <Input
                label="Mật khẩu"
                type={showPassword ? 'text' : 'password'}
                placeholder="Tối thiểu 6 ký tự"
                autoComplete="new-password"
                prefix={<Lock size={13}/>}
                suffix={
                  <button
                    type="button"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    onClick={() => setShowPassword((v) => !v)}
                    className="hover:text-gray-400 transition-colors"
                  >
                    {showPassword ? <EyeOff size={13}/> : <Eye size={13}/>}
                  </button>
                }
                error={errors.password?.message}
                {...register('password')}
              />
              {password.length > 0 && (
                <div className="mt-1.5">
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: i < strength ? 1 : 0.15 }}
                        transition={{ duration: 0.2 }}
                        className={`h-1 flex-1 rounded-full origin-left ${i < strength ? strengthColor : 'bg-white/[0.05]'}`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] font-mono text-gray-600 mt-1">{strengthLabel}</p>
                </div>
              )}
            </div>
            <Input
              label="Nhập lại mật khẩu"
              type={showPassword ? 'text' : 'password'}
              placeholder="Lặp lại mật khẩu"
              autoComplete="new-password"
              prefix={<Lock size={13}/>}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
            <Button type="submit" loading={isSubmitting} className="w-full justify-center mt-1">
              <span>Tạo tài khoản</span>
              <ArrowRight size={14}/>
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-700 font-mono mt-5">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-violet-400 hover:text-violet-300 transition-colors">
            Đăng nhập
          </Link>
        </p>
      </motion.div>
    </div>
  );
};
