'use client';

import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, CreditCard, ExternalLink, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { subscriptionService } from '../../services';
import { Badge, Button, Card, EmptyState } from '../../components/shared';
import type { SubscriptionPlan, UserSubscription } from '../../types';

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

export function PricingPlans({
  plans,
  myPlan,
}: {
  plans: SubscriptionPlan[];
  myPlan?: UserSubscription | null;
}) {
  const queryClient = useQueryClient();
  const currentPlanId = myPlan?.status === 'active' ? myPlan.planId : null;

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

  if (plans.length === 0) {
    return (
      <EmptyState
        icon={<Crown size={36} />}
        title="No plans available"
        description="There are no active subscription plans right now"
      />
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {plans.map((plan) => {
        const planId = getPlanId(plan);
        const isCurrentPlan = currentPlanId === planId;
        const isPurchasing = isPending && variables?.planId === planId;

        return (
          <Card key={planId} className="p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-mono font-bold text-lg text-ink truncate">{plan.name}</h2>
                {plan.description && (
                  <p className="text-xs text-ink-faint font-mono mt-1 line-clamp-2">{plan.description}</p>
                )}
              </div>
              {isCurrentPlan ? <Badge color="green">Current</Badge> : null}
            </div>

            <div>
              <p className="font-mono font-bold text-3xl text-ink">
                {formatPrice(plan.price, plan.currency)}
              </p>
              <p className="text-xs text-ink-faint font-mono mt-1">{plan.durationDays} days</p>
            </div>

            <div className="flex flex-col gap-2 flex-1">
              {plan.features.length > 0 ? plan.features.map((feature) => (
                <div key={feature} className="flex items-start gap-2 text-sm text-ink-muted font-mono">
                  <Check size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                  <span>{feature}</span>
                </div>
              )) : (
                <p className="text-sm text-ink-faint font-mono">Premium access for this plan duration.</p>
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
  );
}
