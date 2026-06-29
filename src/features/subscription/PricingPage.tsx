'use client';

import React, { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Check, CreditCard, Crown, ExternalLink, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { subscriptionService } from '../../services';
import { Badge, Button, Card, EmptyState, Skeleton } from '../../components/shared';
import type { SubscriptionPlan } from '../../types';

const getPlanId = (plan: SubscriptionPlan) => plan.id ?? plan._id;

const formatPrice = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
};

export const PricingPage: React.FC = () => {
  const queryClient = useQueryClient();

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

  const { mutate: purchase, isPending, variables } = useMutation({
    mutationFn: subscriptionService.purchase,
    onSuccess: (purchaseResult) => {
      queryClient.invalidateQueries({ queryKey: ['my-subscription'] });
      if (purchaseResult.paymentUrl) {
        toast.success('Payment request created');
        window.location.assign(purchaseResult.paymentUrl);
        return;
      }
      toast.success('Purchase request created');
    },
    onError: () => toast.error('Failed to create purchase request'),
  });

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
  const currentPlanId = myPlan?.status === 'active' ? myPlan.planId : null;

  return (
    <div className="flex flex-col gap-5 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Crown size={20} className="text-amber-400" />
            <h1 className="font-mono font-bold text-2xl text-gray-100">Pricing</h1>
          </div>
          <p className="text-gray-600 font-mono text-sm mt-1">
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
            <p className="text-xs text-gray-600 font-mono">Current subscription</p>
            <p className="text-sm text-gray-200 font-mono">
              Plan #{myPlan.planId.slice(-6)} · expires {new Date(myPlan.expiresAt).toLocaleDateString()}
            </p>
          </div>
          <Sparkles size={18} className="text-violet-300 shrink-0" />
        </Card>
      )}

      {activePlans.length > 0 ? (
        <div className="grid md:grid-cols-3 gap-4">
          {activePlans.map((plan) => {
            const planId = getPlanId(plan);
            const isCurrentPlan = currentPlanId === planId;
            const isPurchasing = isPending && variables?.planId === planId;

            return (
              <Card key={planId} className="p-5 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-mono font-bold text-lg text-gray-100 truncate">{plan.name}</h2>
                    {plan.description && (
                      <p className="text-xs text-gray-600 font-mono mt-1 line-clamp-2">{plan.description}</p>
                    )}
                  </div>
                  {isCurrentPlan ? <Badge color="green">Current</Badge> : null}
                </div>

                <div>
                  <p className="font-mono font-bold text-3xl text-gray-100">
                    {formatPrice(plan.price, plan.currency)}
                  </p>
                  <p className="text-xs text-gray-600 font-mono mt-1">{plan.durationDays} days</p>
                </div>

                <div className="flex flex-col gap-2 flex-1">
                  {plan.features.length > 0 ? plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2 text-sm text-gray-400 font-mono">
                      <Check size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </div>
                  )) : (
                    <p className="text-sm text-gray-600 font-mono">Premium access for this plan duration.</p>
                  )}
                </div>

                <Button
                  onClick={() => purchase({ planId })}
                  disabled={isCurrentPlan}
                  loading={isPurchasing}
                  className="w-full justify-center"
                >
                  {isCurrentPlan ? (
                    <>
                      <Check size={14} />
                      Active plan
                    </>
                  ) : (
                    <>
                      <CreditCard size={14} />
                      Purchase
                      <ExternalLink size={13} />
                    </>
                  )}
                </Button>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Crown size={36} />}
          title="No plans available"
          description="There are no active subscription plans right now"
        />
      )}
    </div>
  );
};
