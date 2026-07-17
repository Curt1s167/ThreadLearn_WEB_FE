import { Suspense } from 'react';
import { AuthCallbackPage } from '@/features/auth/AuthCallbackPage';

export default function GoogleAuthCallback() {
  return (
    <Suspense fallback={null}>
      <AuthCallbackPage />
    </Suspense>
  );
}
