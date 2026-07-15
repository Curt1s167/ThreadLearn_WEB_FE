'use client';

import { Suspense } from 'react';
import { ResetPasswordPage } from '@/features/auth/PasswordPages';

export default function ResetPassword() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-canvas-cream"><div className="h-8 w-8 animate-spin rounded-full border-2 border-black/20 border-t-black" /></div>}>
      <ResetPasswordPage />
    </Suspense>
  );
}
