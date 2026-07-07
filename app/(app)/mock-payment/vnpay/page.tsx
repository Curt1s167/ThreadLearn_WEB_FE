import { Suspense } from 'react';
import { PaymentResultPage } from '@/features/subscription/PaymentResultPage';

function PaymentResultFallback() {
  return (
    <div className="flex flex-col gap-4 max-w-xl mx-auto">
      {process.env.NODE_ENV !== 'production' ? (
        <p data-testid="pr-suspense" className="text-xs text-rose-400 font-mono">SUSPENSE-FALLBACK</p>
      ) : null}
      <div className="h-64 rounded-xl skeleton" />
    </div>
  );
}

export default function MockVNPayCallback() {
  return (
    <Suspense fallback={<PaymentResultFallback />}>
      <PaymentResultPage mode="mock" />
    </Suspense>
  );
}
