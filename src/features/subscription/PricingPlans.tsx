'use client';

import React, { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Check, CreditCard, ExternalLink, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { subscriptionService } from '../../services';
import { EmptyState } from '../../components/shared';
import { Modal } from '../../components/shared/Modal';
import { useUIStore } from '../../store';
import type { PlanType, SubscriptionPlan, UserSubscription } from '../../types';

const getPlanId = (plan: SubscriptionPlan) => plan.id ?? plan._id;
const PURCHASE_CONFIRM_MODAL = 'subscription-purchase-confirmation';

const formatPrice = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat(currency.toUpperCase() === 'VND' ? 'vi-VN' : 'en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
};

/**
 * PR7 — plan cards in demo light language.
 * Purchase mutation + paymentUrl redirect unchanged.
 */
export function PricingPlans({
  plans,
  myPlan,
  userPlanType,
  isSignedIn,
}: {
  plans: SubscriptionPlan[];
  myPlan?: UserSubscription | null;
  userPlanType?: PlanType;
  isSignedIn: boolean;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { openModal, closeModal } = useUIStore();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const freePlanId = useMemo(
    () => plans.find((plan) => plan.price === 0 || plan.name.trim().toLowerCase() === 'free')
      ? getPlanId(plans.find((plan) => plan.price === 0 || plan.name.trim().toLowerCase() === 'free')!)
      : null,
    [plans],
  );
  const currentPlanId = myPlan?.status === 'active'
    ? myPlan.planId
    : userPlanType === 'FREE'
      ? freePlanId
      : null;
  const selectedPlan = useMemo(
    () => plans.find((plan) => getPlanId(plan) === selectedPlanId) ?? null,
    [plans, selectedPlanId]
  );
  const currentPlan = useMemo(
    () => plans.find((plan) => getPlanId(plan) === currentPlanId) ?? null,
    [plans, currentPlanId]
  );

  const { mutate: purchase, isPending, variables } = useMutation({
    mutationFn: subscriptionService.purchase,
    onSuccess: (purchaseResult) => {
      queryClient.invalidateQueries({ queryKey: ['my-subscription'] });
      if (purchaseResult.paymentUrl) {
        toast.success('Đã tạo yêu cầu thanh toán');
        sessionStorage.setItem('threadlearn-payment-return-to', '/pricing');
        sessionStorage.setItem('threadlearn-payment-plan-name', selectedPlan?.name ?? 'gói đã chọn');
        window.location.assign(purchaseResult.paymentUrl);
        return;
      }
      toast.success('Đã tạo yêu cầu mua gói');
    },
    onError: () => toast.error('Không thể tạo yêu cầu thanh toán'),
  });

  if (plans.length === 0) {
    return (
      <EmptyState
        icon={<Crown size={36} />}
        title="Chưa có gói dịch vụ khả dụng"
        description="Vui lòng quay lại sau hoặc liên hệ quản trị viên."
      />
    );
  }

  const requestPurchase = (plan: SubscriptionPlan) => {
    if (!isSignedIn) {
      router.push('/login');
      return;
    }
    setSelectedPlanId(getPlanId(plan));
    openModal(PURCHASE_CONFIRM_MODAL);
  };

  const confirmPurchase = () => {
    if (!selectedPlan) return;
    purchase({ planId: getPlanId(selectedPlan) });
    closeModal();
  };

  const isChangingPlan = Boolean(currentPlanId && selectedPlan && getPlanId(selectedPlan) !== currentPlanId);

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {plans.map((plan, index) => {
        const planId = getPlanId(plan);
        const isCurrentPlan = currentPlanId === planId;
        const isPurchasing = isPending && variables?.planId === planId;
        const isFeatured = !isCurrentPlan && index === Math.min(1, plans.length - 1);

        return (
          <motion.div
            key={planId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: Math.min(index * 0.05, 0.2) }}
            className={`flex flex-col rounded-lg border bg-white p-6 shadow-sm ${
              isCurrentPlan
                ? 'pricing-plan-current border-[#0b7668] ring-2 ring-[#d9f99d]/70'
                : isFeatured
                  ? 'border-black/20'
                  : 'border-black/10'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {isFeatured && !isCurrentPlan ? (
                  <span className="inline-flex rounded-full bg-[#d9f99d] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-black">
                    Phổ biến
                  </span>
                ) : null}
                <h2 className={`text-xl font-semibold text-ink truncate ${isFeatured && !isCurrentPlan ? 'mt-2' : ''}`}>
                  {plan.name}
                </h2>
                {plan.description ? (
                  <p className="mt-1 line-clamp-2 text-sm text-black/55">{plan.description}</p>
                ) : null}
              </div>
              {isCurrentPlan ? (
                <span className="shrink-0 rounded-full bg-[#d9f99d] px-3 py-1 text-xs font-semibold text-black">
                  Đang dùng
                </span>
              ) : null}
            </div>

            <div className="mt-6">
              <p className="text-4xl font-light tracking-tight text-ink">
                {formatPrice(plan.price, plan.currency)}
              </p>
              <p className="mt-1 text-sm text-black/50">Quyền truy cập trong {plan.durationDays} ngày</p>
            </div>

            <ul className="mt-6 flex flex-1 flex-col gap-2.5">
              {plan.features.length > 0 ? (
                plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-black/70">
                    <Check size={15} className="mt-0.5 shrink-0 text-black" />
                    <span>{feature}</span>
                  </li>
                ))
              ) : (
                <li className="text-sm text-black/50">Quyền truy cập Premium trong thời hạn gói.</li>
              )}
            </ul>

            <button
              type="button"
              onClick={() => requestPurchase(plan)}
              disabled={isPending || isCurrentPlan}
              className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-medium transition disabled:cursor-not-allowed ${
                isCurrentPlan
                  ? 'pricing-current-action'
                  : 'bg-black text-white hover:bg-black/90'
              }`}
            >
              {isPurchasing ? (
                'Đang tạo thanh toán...'
              ) : isCurrentPlan ? (
                <>
                  <Check size={14} />
                  Đang sử dụng
                </>
              ) : !isSignedIn ? (
                <>
                  <CreditCard size={14} />
                  Đăng nhập để mua
                </>
              ) : (
                <>
                  <CreditCard size={14} />
                  Chọn gói này
                  <ExternalLink size={13} />
                </>
              )}
            </button>
          </motion.div>
        );
      })}

      <Modal
        name={PURCHASE_CONFIRM_MODAL}
        title={isChangingPlan ? 'Xác nhận chuyển gói' : 'Xác nhận thanh toán'}
        description="Bạn sẽ được chuyển đến cổng thanh toán PayOS để hoàn tất giao dịch."
        size="md"
        onClose={() => setSelectedPlanId(null)}
      >
        {selectedPlan ? (
          <div className="space-y-5">
            <div className="rounded-lg border border-black/10 bg-[#f7f4ee] p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-black/45">Gói được chọn</p>
              <p className="mt-1 text-lg font-semibold text-ink">{selectedPlan.name}</p>
              <p className="mt-1 text-sm text-black/60">
                {formatPrice(selectedPlan.price, selectedPlan.currency)} · {selectedPlan.durationDays} ngày
              </p>
            </div>

            {currentPlanId && myPlan ? (
              <div className="rounded-lg border border-[#d9f99d] bg-[#d9f99d]/35 p-4 text-sm text-black/75">
                <p className="font-semibold text-ink">
                  {isChangingPlan ? 'Gói hiện tại sẽ được thay thế sau khi thanh toán được xác nhận.' : 'Bạn đang gia hạn gói hiện tại.'}
                </p>
                <p className="mt-1">
                  Thời hạn đến {new Date(myPlan.expiresAt).toLocaleDateString('vi-VN')} được giữ lại và cộng thêm {selectedPlan.durationDays} ngày.
                </p>
                {isChangingPlan ? (
                  <p className="mt-1">
                    Quyền lợi sẽ chuyển từ {currentPlan?.name ?? 'gói hiện tại'} sang {selectedPlan.name} ngay sau khi PayOS xác nhận giao dịch.
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-black/60">
                Gói Premium sẽ được kích hoạt ngay sau khi PayOS xác nhận thanh toán.
              </p>
            )}

            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => closeModal()}
                className="rounded-full border border-black/15 px-4 py-2.5 text-sm font-medium text-ink hover:bg-black/[0.04]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmPurchase}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CreditCard size={15} />
                Xác nhận và thanh toán
                <ExternalLink size={14} />
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
