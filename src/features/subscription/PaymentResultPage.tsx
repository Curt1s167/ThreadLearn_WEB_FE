'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowRight, CheckCircle, CreditCard, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { subscriptionService } from '../../services';
import { Skeleton } from '../../components/shared';
import type { PaymentConfirmationPayload } from '../../types';
import {
  DemoDisplayTitle,
  DemoMuted,
  DemoPageRoot,
  DemoPill,
} from '../ui-reskin/demo-ui';

const isActiveSubscription = (status?: string) => status?.toLowerCase() === 'active';
const SUCCESS_STATUSES = ['success', 'succeeded', 'paid'];

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
type PaymentGateway = 'mock' | 'payos' | 'vnpay' | 'live';

const MAX_POLL_ATTEMPTS = 5;

const getPaymentGateway = (
  mode: PaymentResultMode,
  gatewayParam: string | null,
  hasVnpaySignal: boolean
): PaymentGateway => {
  if (mode === 'mock') return 'mock';
  const gateway = gatewayParam?.toLowerCase();
  if (gateway === 'payos') return 'payos';
  if (gateway === 'vnpay' || hasVnpaySignal) return 'vnpay';
  return 'live';
};

const getGatewayLabel = (gateway: PaymentGateway) => {
  if (gateway === 'mock') return 'Mock VNPay';
  if (gateway === 'payos') return 'PayOS';
  if (gateway === 'vnpay') return 'VNPay';
  return 'Live';
};

/**
 * PR7 — payment result visual polish only.
 * LOGIC LOCK: mock webhook confirm, real poll getMyPlan, security split real/mock.
 */
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
  const gateway = getPaymentGateway(mode, searchParams.get('gateway'), Boolean(responseCode));
  const gatewayLabel = getGatewayLabel(gateway);
  const rawStatus = searchParams.get('status')?.toLowerCase();
  const inferredMockStatus =
    isMockPayment && (purchaseId || transactionId) && !responseCode && !rawStatus
      ? 'success'
      : undefined;
  // SECURITY: Only the MOCK page may POST the webhook to simulate VNPay's signed, server-to-server IPN.
  // The REAL callback must NEVER call the webhook from the browser — it only polls getMyPlan().
  const shouldConfirmPayment =
    isMockPayment &&
    Boolean((purchaseId || transactionId) && (responseCode || rawStatus || inferredMockStatus));

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
    data: confirmResult,
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
  const mockPaymentSucceeded = isMockPayment && confirmResult?.status === 'succeeded';
  const paymentSucceeded = hasActivePlan || mockPaymentSucceeded;
  const hasGatewayFailure = Boolean(
    (responseCode && responseCode !== '00') ||
      (rawStatus && !SUCCESS_STATUSES.includes(rawStatus))
  );
  const hasPaymentSignal = Boolean(purchaseId || transactionId || responseCode || rawStatus);
  const isPolling =
    mode === 'real' &&
    isFetchingPlan &&
    hasPaymentSignal &&
    !hasActivePlan &&
    pollAttempts.current < MAX_POLL_ATTEMPTS;
  const isChecking = !paymentSucceeded && (isLoadingPlan || isConfirmingPayment || isPolling);

  const ResultShell = ({
    tone,
    pill,
    title,
    description,
    icon,
  }: {
    tone: 'success' | 'fail' | 'neutral';
    pill: string;
    title: string;
    description: string;
    icon: React.ReactNode;
  }) => (
    <DemoPageRoot className="max-w-xl mx-auto">
      <section
        className={`rounded-lg p-6 sm:p-8 ${
          tone === 'success'
            ? 'bg-[#d9f99d]'
            : tone === 'fail'
              ? 'bg-[#fecaca]'
              : 'bg-white border border-black/10'
        }`}
      >
        <DemoPill tone={tone === 'success' ? 'default' : tone === 'fail' ? 'pink' : 'blue'}>
          {pill}
        </DemoPill>
        <div className="mt-5">{icon}</div>
        <DemoDisplayTitle>{title}</DemoDisplayTitle>
        <DemoMuted className={tone === 'success' || tone === 'fail' ? '!text-black/65' : ''}>
          {description}
        </DemoMuted>
        <p className="mt-3 text-xs uppercase tracking-[0.14em] text-black/40">
          {gatewayLabel} payment result
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => router.push('/pricing')}
            className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-white/80 px-5 py-2.5 text-sm font-medium text-ink hover:bg-white"
          >
            <CreditCard size={14} />
            Pricing
          </button>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-black/90"
          >
            Dashboard
            <ArrowRight size={14} />
          </button>
        </div>
      </section>
    </DemoPageRoot>
  );

  if (isChecking) {
    return (
      <DemoPageRoot className="max-w-xl mx-auto">
        <Skeleton className="h-64 rounded-lg" />
        <p className="text-center text-sm text-black/50">Verifying payment…</p>
      </DemoPageRoot>
    );
  }

  if ((isPlanError || isConfirmError) && !paymentSucceeded) {
    return (
      <ResultShell
        tone="fail"
        pill="Error"
        title="Could not verify payment"
        description="Please check your subscription again in a moment."
        icon={<AlertCircle size={36} className="text-[#7f1d1d]" />}
      />
    );
  }

  if (!hasPaymentSignal && !paymentSucceeded) {
    return (
      <ResultShell
        tone="neutral"
        pill="No result"
        title="No payment result found"
        description="Start from the pricing page to create a new payment request."
        icon={<CreditCard size={36} className="text-black/40" />}
      />
    );
  }

  if (paymentSucceeded) {
    return (
      <ResultShell
        tone="success"
        pill="Succeeded"
        title="Payment successful"
        description="Your premium subscription is active. Gamification and plan access will use the updated subscription."
        icon={<CheckCircle size={36} className="text-black" />}
      />
    );
  }

  if (mode === 'real' && hasPaymentSignal && !hasGatewayFailure) {
    return (
      <ResultShell
        tone="neutral"
        pill="Processing"
        title="Payment is being processed"
        description="Your payment gateway callback was received. We are waiting for the secure server webhook to activate your subscription."
        icon={<CreditCard size={36} className="text-black/40" />}
      />
    );
  }

  return (
    <ResultShell
      tone="fail"
      pill="Failed"
      title="Payment failed"
      description={
        hasGatewayFailure
          ? 'The payment gateway did not approve this transaction.'
          : 'We could not find an active subscription for this payment.'
      }
      icon={<XCircle size={36} className="text-[#7f1d1d]" />}
    />
  );
};
