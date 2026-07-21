'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Crown, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { subscriptionService } from '../../services';
import { Skeleton } from '../../components/shared';
import { useAuthStore } from '../../store';
import {
  DemoDisplayTitle,
  DemoHeroWhite,
  DemoMuted,
  DemoPageRoot,
  DemoPrimaryButton,
  DemoPill,
  DemoWhitePanel,
} from '../ui-reskin/demo-ui';

const PricingPlans = dynamic(
  () => import('./PricingPlans').then((module) => module.PricingPlans),
  {
    loading: () => (
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-80 rounded-lg" count={3} />
      </div>
    ),
  }
);

/**
 * PR7 — pricing page demo-light layout.
 * Queries: getPlans / getMyPlan only — no purchase logic here.
 */
export const PricingPage: React.FC = () => {
  const { user } = useAuthStore();
  const {
    data: plans,
    isLoading: plansLoading,
    isError: plansError,
    refetch: refetchPlans,
  } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: subscriptionService.getPlans,
  });

  const {
    data: myPlan,
    isLoading: myPlanLoading,
    isError: myPlanError,
  } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: subscriptionService.getMyPlan,
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (plansError) {
      toast.error('Failed to load subscription plans');
    }
    if (user && myPlanError) {
      toast.error('Failed to load current subscription');
    }
  }, [plansError, myPlanError, user]);

  if (plansLoading || (Boolean(user) && myPlanLoading)) {
    return (
      <DemoPageRoot>
        <Skeleton className="h-40 rounded-lg" />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-80 rounded-lg" count={3} />
        </div>
      </DemoPageRoot>
    );
  }

  const activePlans = plans?.filter((plan) => plan.isActive) ?? [];

  return (
    <DemoPageRoot>
      <DemoHeroWhite>
        <div className="flex flex-wrap items-center gap-2">
          <DemoPill tone="lime">Gói dịch vụ</DemoPill>
          <Crown size={18} className="text-black/50" />
        </div>
        <DemoDisplayTitle>Nâng cấp trải nghiệm học tập</DemoDisplayTitle>
        <DemoMuted>
          Chọn gói phù hợp để mở khóa nội dung nâng cao và trợ lý AI chuyên sâu.
        </DemoMuted>
      </DemoHeroWhite>

      {myPlan ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-black/10 bg-[#d9f99d] p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-black/45">Gói đang sử dụng</p>
            <p className="mt-1 text-sm font-medium text-ink">
              Mã gói #{myPlan.planId.slice(-6)} · Đang hoạt động
            </p>
            <p className="mt-0.5 text-sm text-black/60">
              Hết hạn ngày {new Date(myPlan.expiresAt).toLocaleDateString('vi-VN')}
            </p>
          </div>
          <Sparkles size={22} className="text-black/50 shrink-0" />
        </div>
      ) : null}

      {plansError ? (
        <DemoWhitePanel className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 text-rose-600" size={20} />
              <div>
                <h2 className="font-semibold text-black">Không thể tải danh sách gói</h2>
                <p className="mt-1 text-sm text-black/55">
                  Kết nối đang gián đoạn. Hãy thử lại sau ít phút.
                </p>
              </div>
            </div>
            <DemoPrimaryButton onClick={() => refetchPlans()}>Thử lại</DemoPrimaryButton>
          </div>
        </DemoWhitePanel>
      ) : (
        <PricingPlans plans={activePlans} myPlan={myPlan} isSignedIn={Boolean(user)} />
      )}
    </DemoPageRoot>
  );
};
