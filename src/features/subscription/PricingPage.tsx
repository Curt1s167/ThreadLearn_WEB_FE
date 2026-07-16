'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Crown, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { subscriptionService } from '../../services';
import { Skeleton } from '../../components/shared';
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
  });

  useEffect(() => {
    if (plansError) {
      toast.error('Failed to load subscription plans');
    }
    if (myPlanError) {
      toast.error('Failed to load current subscription');
    }
  }, [plansError, myPlanError]);

  if (plansLoading || myPlanLoading) {
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
          <DemoPill tone="lime">Subscription</DemoPill>
          <Crown size={18} className="text-black/50" />
        </div>
        <DemoDisplayTitle>Service plans for ThreadLearn</DemoDisplayTitle>
        <DemoMuted>
          Choose a plan to unlock premium learning features. Purchase creates a payment session
          via the subscription API (UC51–UC52).
        </DemoMuted>
      </DemoHeroWhite>

      {myPlan ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-black/10 bg-[#d9f99d] p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-black/45">Current subscription</p>
            <p className="mt-1 text-sm font-medium text-ink">
              Plan #{myPlan.planId.slice(-6)} · {myPlan.status}
            </p>
            <p className="mt-0.5 text-sm text-black/60">
              Expires {new Date(myPlan.expiresAt).toLocaleDateString()}
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
                <h2 className="font-semibold text-black">Could not load subscription plans</h2>
                <p className="mt-1 text-sm text-black/55">
                  Check the subscription plan API or create active plans from the admin screen.
                </p>
              </div>
            </div>
            <DemoPrimaryButton onClick={() => refetchPlans()}>Retry</DemoPrimaryButton>
          </div>
        </DemoWhitePanel>
      ) : (
        <PricingPlans plans={activePlans} myPlan={myPlan} />
      )}
    </DemoPageRoot>
  );
};
