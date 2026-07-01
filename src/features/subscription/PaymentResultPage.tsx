'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowRight, CheckCircle, CreditCard, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { subscriptionService } from '../../services';
import { Button, Card, EmptyState, Skeleton } from '../../components/shared';
import type { PaymentConfirmationPayload } from '../../types';

const isActiveSubscription = (status?: string) => status?.toLowerCase() === 'active';

const buildPaymentPayload = (
  searchParams: ReturnType<typeof useSearchParams>,
  inferredStatus?: string
): PaymentConfirmationPayload => {
  const payload: PaymentConfirmationPayload = {};
  searchParams.forEach((value, key) => {
    payload[key] = value;
  });

  if (inferredStatus && !payload.status && !payload.vnp_ResponseCode) {
    payload.status = inferredStatus;
  }

  return payload;
};

type PaymentResultMode = 'real' | 'mock';

const MAX_POLL_ATTEMPTS = 5;

export const PaymentResultPage: React.FC<{ mode?: PaymentResultMode }> = ({ mode = 'real' }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const hasSubmittedConfirmation = useRef(false);
  const pollAttempts = useRef(0);

  const isMockPayment = mode === 'mock';
  const purchaseId = searchParams.get('purchaseId');
  const transactionId = searchParams.get('transactionId') ?? searchParams.get('vnp_TxnRef');
  const responseCode = searchParams.get('vnp_ResponseCode');
  const rawStatus = searchParams.get('status')?.toLowerCase();
  const inferredMockStatus = isMockPayment && (purchaseId || transactionId) && !responseCode && !rawStatus
    ? 'success'
    : undefined;
  // SECURITY: Only the MOCK page may POST the webhook to simulate VNPay's signed, server-to-server IPN.
  // The REAL callback must NEVER call the webhook from the browser — it only polls getMyPlan(), which
  // reflects the subscription state the real IPN has already written server-side.
  const shouldConfirmPayment = isMockPayment && Boolean(
    (purchaseId || transactionId) && (responseCode || rawStatus || inferredMockStatus)
  );

  const paymentPayload = useMemo(
    () => buildPaymentPayload(searchParams, inferredMockStatus),
    [searchParams, inferredMockStatus]
  );

  const {
    data: myPlan,
    isLoading: isLoadingPlan,
    isError: isPlanError,
    isFetching: isFetchingPlan,
  } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: subscriptionService.getMyPlan,
    // On the real callback the browser may land before the IPN finished processing — poll a few
    // times until the plan turns active, then stop. Mock never polls (webhook confirm is synchronous).
    refetchInterval: (query) => {
      if (mode !== 'real') return false;
      if (isActiveSubscription(query.state.data?.status)) return false;
      if (pollAttempts.current >= MAX_POLL_ATTEMPTS) return false;
      pollAttempts.current += 1;
      return 2000;
    },
  });

  const {
    mutate: confirmPayment,
    isPending: isConfirmingPayment,
    isError: isConfirmError,
  } = useMutation({
    mutationFn: subscriptionService.confirmPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-subscription'] });
      toast.success('Payment result confirmed');
    },
    onError: () => toast.error('Failed to confirm payment result'),
  });

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['my-subscription'] });
  }, [queryClient]);

  useEffect(() => {
    if (!shouldConfirmPayment || hasSubmittedConfirmation.current) return;
    hasSubmittedConfirmation.current = true;
    confirmPayment(paymentPayload);
  }, [confirmPayment, paymentPayload, shouldConfirmPayment]);

  const hasActivePlan = isActiveSubscription(myPlan?.status);
  const hasGatewayFailure = Boolean(
    (responseCode && responseCode !== '00') ||
    (rawStatus && !['success', 'succeeded', 'paid'].includes(rawStatus))
  );
  const hasPaymentSignal = Boolean(purchaseId || transactionId || responseCode || rawStatus);
  const isPolling = mode === 'real'
    && isFetchingPlan
    && hasPaymentSignal
    && !hasActivePlan
    && pollAttempts.current < MAX_POLL_ATTEMPTS;
  const isChecking = isLoadingPlan || isConfirmingPayment || isPolling;

  if (isChecking) {
    return (
      <div className="flex flex-col gap-4 max-w-xl mx-auto animate-fade-in">
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if ((isPlanError || isConfirmError) && !hasActivePlan) {
    return (
      <Card className="max-w-xl mx-auto p-6">
        <EmptyState
          icon={<AlertCircle size={36} />}
          title="Could not verify payment"
          description="Please check your subscription again in a moment"
          action={(
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="outline" onClick={() => router.push('/pricing')}>
                <CreditCard size={14} />
                Về trang gói
              </Button>
              <Button onClick={() => router.push('/dashboard')}>
                Về dashboard
                <ArrowRight size={14} />
              </Button>
            </div>
          )}
        />
      </Card>
    );
  }

  if (!hasPaymentSignal && !hasActivePlan) {
    return (
      <Card className="max-w-xl mx-auto p-6">
        <EmptyState
          icon={<CreditCard size={36} />}
          title="No payment result found"
          description="Start from the pricing page to create a new payment request"
          action={(
            <Button onClick={() => router.push('/pricing')}>
              <CreditCard size={14} />
              Về trang gói
            </Button>
          )}
        />
      </Card>
    );
  }

  if (hasActivePlan) {
    return (
      <Card className="max-w-xl mx-auto p-6 border-emerald-500/25 bg-emerald-500/5">
        <EmptyState
          icon={<CheckCircle size={42} className="text-emerald-400" />}
          title="Payment successful"
          description="Your premium subscription is active"
          action={(
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="outline" onClick={() => router.push('/pricing')}>
                <CreditCard size={14} />
                Về trang gói
              </Button>
              <Button onClick={() => router.push('/dashboard')}>
                Về dashboard
                <ArrowRight size={14} />
              </Button>
            </div>
          )}
        />
      </Card>
    );
  }

  return (
    <Card className="max-w-xl mx-auto p-6 border-rose-500/25 bg-rose-500/5">
      <EmptyState
        icon={<XCircle size={42} className="text-rose-400" />}
        title="Payment failed"
        description={
          hasGatewayFailure
            ? 'The payment gateway did not approve this transaction'
            : 'We could not find an active subscription for this payment'
        }
        action={(
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="outline" onClick={() => router.push('/pricing')}>
              <CreditCard size={14} />
              Về trang gói
            </Button>
            <Button onClick={() => router.push('/dashboard')}>
              Về dashboard
              <ArrowRight size={14} />
            </Button>
          </div>
        )}
      />
    </Card>
  );
};
