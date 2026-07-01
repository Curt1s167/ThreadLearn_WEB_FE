import { Suspense } from 'react';
import { PaymentResultPage } from '@/features/subscription/PaymentResultPage';

function PaymentResultFallback() {
  return (
    <div className="flex flex-col gap-4 max-w-xl mx-auto">
      <div className="h-64 rounded-xl skeleton" />
    </div>
  );
}

export default function PricingCallback() {
  return (
    <Suspense fallback={<PaymentResultFallback />}>
      <PaymentResultPage mode="real" />
    </Suspense>
  );
}
