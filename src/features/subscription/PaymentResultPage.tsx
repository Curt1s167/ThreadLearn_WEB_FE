'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowRight, CheckCircle, CreditCard, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { subscriptionService } from '../../services';
import { authService } from '../../services/auth.service';
import { Skeleton } from '../../components/shared';
import { useAuthStore } from '../../store';
import type { PaymentConfirmationPayload } from '../../types';
import {
  DemoDisplayTitle,
  DemoMuted,
  DemoPageRoot,
  DemoPill,
} from '../ui-reskin/demo-ui';

const isActiveSubscription = (status?: string) => status?.toLowerCase() === 'active';
const FAILURE_STATUSES = ['cancelled', 'failed'];

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

const MAX_POLL_ATTEMPTS = 8;

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
  const { user, setUser } = useAuthStore();
  const hasSubmittedConfirmation = useRef(false);
  const purchasePollAttempts = useRef(0);
  const subscriptionPollAttempts = useRef(0);
  const hasSyncedProfile = useRef(false);

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

  const hasPaymentSignal = Boolean(purchaseId || transactionId || responseCode || rawStatus);
  const hasGatewayFailure = Boolean(
    (responseCode && responseCode !== '00') ||
      (rawStatus && FAILURE_STATUSES.includes(rawStatus))
  );
  const returnTo = useMemo(() => {
    if (typeof window === 'undefined') return '/pricing';
    const savedPath = sessionStorage.getItem('threadlearn-payment-return-to');
    return savedPath === '/pricing' ? savedPath : '/pricing';
  }, []);

  const {
    data: purchase,
    isLoading: isLoadingPurchase,
    isError: isPurchaseError,
    isFetching: isFetchingPurchase,
    refetch: refetchPurchase,
  } = useQuery({
    queryKey: ['subscription-purchase', purchaseId],
    queryFn: () => subscriptionService.getPurchase(purchaseId!),
    enabled: Boolean(purchaseId),
    refetchInterval: (query) => {
      if (!purchaseId || query.state.data?.status !== 'pending') return false;
      if (purchasePollAttempts.current >= MAX_POLL_ATTEMPTS) return false;
      purchasePollAttempts.current += 1;
      return 2000;
    },
  });

  const purchaseSucceeded = purchase?.status === 'succeeded';

  const {
    data: myPlan,
    isLoading: isLoadingPlan,
    isError: isPlanError,
    isFetching: isFetchingPlan,
    refetch: refetchMyPlan,
  } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: subscriptionService.getMyPlan,
    enabled: !purchaseId || purchaseSucceeded,
    refetchInterval: (query) => {
      if (!purchaseSucceeded || mode !== 'real') return false;
      if (isActiveSubscription(query.state.data?.status)) return false;
      if (subscriptionPollAttempts.current >= MAX_POLL_ATTEMPTS) return false;
      subscriptionPollAttempts.current += 1;
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
      queryClient.invalidateQueries({ queryKey: ['subscription-purchase', purchaseId] });
      toast.success('Đã xác nhận kết quả thanh toán');
    },
    onError: () => toast.error('Không thể xác nhận kết quả thanh toán'),
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
  const paymentSucceeded = purchaseSucceeded && hasActivePlan && !hasGatewayFailure;
  const isPurchasePending = purchase?.status === 'pending';
  const isWaitingForSubscription = purchaseSucceeded && !hasActivePlan;
  const isPollingPurchase = isPurchasePending && purchasePollAttempts.current < MAX_POLL_ATTEMPTS;
  const isPollingSubscription =
    isWaitingForSubscription && subscriptionPollAttempts.current < MAX_POLL_ATTEMPTS;
  const isChecking =
    !hasGatewayFailure &&
    Boolean(purchaseId) &&
    (isLoadingPurchase ||
      isConfirmingPayment ||
      isPollingPurchase ||
      (isPollingSubscription && (isLoadingPlan || isFetchingPlan)) ||
      (isFetchingPurchase && !purchase));

  useEffect(() => {
    if (!paymentSucceeded || !user || !myPlan || hasSyncedProfile.current) return;
    hasSyncedProfile.current = true;
    void authService.getMe()
      .then((profile) => {
        setUser(profile);
        queryClient.setQueryData(['auth-me'], profile);
      })
      .catch(() => {
        hasSyncedProfile.current = false;
        toast.error('Thanh toán đã hoàn tất nhưng chưa thể đồng bộ hồ sơ. Hãy thử tải lại trang.');
      });
  }, [myPlan, paymentSucceeded, queryClient, setUser, user]);

  useEffect(() => {
    if (!paymentSucceeded) return;
    const timeout = window.setTimeout(() => router.replace(returnTo), 4000);
    return () => window.clearTimeout(timeout);
  }, [paymentSucceeded, returnTo, router]);

  const ResultShell = ({
    tone,
    pill,
    title,
    description,
    icon,
    onRetry,
  }: {
    tone: 'success' | 'fail' | 'neutral';
    pill: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    onRetry?: () => void;
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
          Kết quả thanh toán qua {gatewayLabel}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-white/80 px-5 py-2.5 text-sm font-medium text-ink hover:bg-white"
            >
              Kiểm tra lại
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => router.replace(returnTo)}
            className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-white/80 px-5 py-2.5 text-sm font-medium text-ink hover:bg-white"
          >
            <CreditCard size={14} />
            Quay lại gói dịch vụ
          </button>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-black/90"
          >
            Về trang chủ
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
        <p className="text-center text-sm text-black/50">Đang kiểm tra trạng thái thanh toán...</p>
      </DemoPageRoot>
    );
  }

  if (purchase?.status === 'failed' || hasGatewayFailure) {
    return (
      <ResultShell
        tone="fail"
        pill="Không thành công"
        title="Thanh toán không thành công"
        description={
          hasGatewayFailure
            ? 'Cổng thanh toán không phê duyệt giao dịch này.'
            : 'Giao dịch không được xác nhận. Gói hiện tại của bạn không bị thay đổi.'
        }
        icon={<XCircle size={36} className="text-[#7f1d1d]" />}
      />
    );
  }

  if ((isPurchaseError || isPlanError || isConfirmError) && !paymentSucceeded) {
    return (
      <ResultShell
        tone="fail"
        pill="Lỗi xác minh"
        title="Không thể kiểm tra thanh toán"
        description="Hãy kiểm tra lại gói dịch vụ của bạn sau ít phút."
        icon={<AlertCircle size={36} className="text-[#7f1d1d]" />}
        onRetry={() => {
          refetchPurchase();
          refetchMyPlan();
        }}
      />
    );
  }

  if (!purchaseId && !hasPaymentSignal) {
    return (
      <ResultShell
        tone="neutral"
        pill="Chưa có kết quả"
        title="Không tìm thấy yêu cầu thanh toán"
        description="Hãy bắt đầu từ trang gói dịch vụ để tạo yêu cầu thanh toán mới."
        icon={<CreditCard size={36} className="text-black/40" />}
      />
    );
  }

  if (paymentSucceeded) {
    return (
      <ResultShell
        tone="success"
        pill="Thành công"
        title="Thanh toán thành công"
        description="Gói Premium và quyền truy cập của bạn đã được cập nhật. Bạn sẽ quay lại trang gói dịch vụ sau vài giây."
        icon={<CheckCircle size={36} className="text-black" />}
      />
    );
  }

  if (purchaseId && !hasGatewayFailure) {
    return (
      <ResultShell
        tone="neutral"
        pill="Đang xử lý"
        title="Thanh toán đang được xử lý"
        description="Hệ thống đã nhận kết quả trả về và đang chờ xác thực an toàn từ cổng thanh toán để kích hoạt gói của bạn."
        icon={<CreditCard size={36} className="text-black/40" />}
        onRetry={() => {
          refetchPurchase();
          refetchMyPlan();
        }}
      />
    );
  }

  return null;
};
