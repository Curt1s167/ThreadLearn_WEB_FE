'use client';

import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, CreditCard, ExternalLink, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { subscriptionService } from '../../services';
import { EmptyState } from '../../components/shared';
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

/**
 * PR7 — plan cards in demo light language.
 * Purchase mutation + paymentUrl redirect unchanged.
 */
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
                ? 'border-black ring-2 ring-[#d9f99d]'
                : isFeatured
                  ? 'border-black/20'
                  : 'border-black/10'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {isFeatured && !isCurrentPlan ? (
                  <span className="inline-flex rounded-full bg-[#d9f99d] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-black">
                    Popular
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
                  Current
                </span>
              ) : null}
            </div>

            <div className="mt-6">
              <p className="text-4xl font-light tracking-tight text-ink">
                {formatPrice(plan.price, plan.currency)}
              </p>
              <p className="mt-1 text-sm text-black/50">{plan.durationDays} days access</p>
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
                <li className="text-sm text-black/50">Premium access for this plan duration.</li>
              )}
            </ul>

            <button
              type="button"
              onClick={() => {
                purchase({ planId });
              }}
              disabled={isCurrentPlan || isPending}
              className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                isCurrentPlan
                  ? 'border border-black/10 bg-[#f7f4ee] text-black'
                  : 'bg-black text-white hover:bg-black/90'
              }`}
            >
              {isPurchasing ? (
                'Creating payment…'
              ) : isCurrentPlan ? (
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
            </button>
          </motion.div>
        );
      })}
    </div>
  );
}
