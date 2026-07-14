'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Crown, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { subscriptionService } from '../../services';
import { Badge, Card, EmptyState, Skeleton } from '../../components/shared';

const PricingPlans = dynamic(
  () => import('./PricingPlans').then((module) => module.PricingPlans),
  {
    loading: () => (
      <div className="grid md:grid-cols-3 gap-4">
        <Skeleton className="h-72 rounded-xl" count={3} />
      </div>
    ),
  }
);

export const PricingPage: React.FC = () => {
  const {
    data: plans,
    isLoading: plansLoading,
    isError: plansError,
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
      <div className="flex flex-col gap-5 animate-fade-in max-w-4xl mx-auto">
        <Skeleton className="h-12 w-52 rounded-xl" />
        <div className="grid md:grid-cols-3 gap-4">
          <Skeleton className="h-72 rounded-xl" count={3} />
        </div>
      </div>
    );
  }

  if (plansError) {
    return (
      <EmptyState
        icon={<AlertCircle size={36} />}
        title="Could not load pricing"
        description="Please try again in a moment"
      />
    );
  }

  const activePlans = plans?.filter((plan) => plan.isActive) ?? [];

  return (
    <div className="flex flex-col gap-5 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Crown size={20} className="text-amber-400" />
            <h1 className="font-mono font-bold text-2xl text-ink">Pricing</h1>
          </div>
          <p className="text-ink-faint font-mono text-sm mt-1">
            Choose a subscription plan to unlock premium learning features
          </p>
        </div>
        {myPlan ? (
          <Badge color={myPlan.status === 'active' ? 'green' : 'gray'}>
            {myPlan.status.toUpperCase()}
          </Badge>
        ) : null}
      </div>

      {myPlan && (
        <Card className="p-4 flex items-center justify-between gap-4 border-violet-500/20 bg-violet-500/5">
          <div>
            <p className="text-xs text-ink-faint font-mono">Current subscription</p>
            <p className="text-sm text-ink font-mono">
              Plan #{myPlan.planId.slice(-6)} · expires {new Date(myPlan.expiresAt).toLocaleDateString()}
            </p>
          </div>
          <Sparkles size={18} className="text-violet-300 shrink-0" />
        </Card>
      )}

      <PricingPlans plans={activePlans} myPlan={myPlan} />
    </div>
  );
};
