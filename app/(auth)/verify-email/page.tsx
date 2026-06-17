'use client';

import { Suspense } from 'react';
import { VerifyEmailPage } from '@/features/auth/PasswordPages';

export default function VerifyEmail() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center"><div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <VerifyEmailPage />
    </Suspense>
  );
}
