'use client';

import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Check,
  CreditCard,
  Edit2,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button, EmptyState, Input, Skeleton } from '../../components/shared';
import { ConfirmModal, Modal } from '../../components/shared/Modal';
import { subscriptionService } from '../../services';
import { useUIStore } from '../../store';
import type {
  PlanCreatePayload,
  PlanUpdatePayload,
  SubscriptionFeature,
  SubscriptionPlan,
} from '../../types';
import {
  DemoDisplayTitle,
  DemoHeroWhite,
  DemoMuted,
  DemoPageRoot,
  DemoPill,
  DemoWhitePanel,
} from '../ui-reskin/demo-ui';

const PLAN_FORM_MODAL = 'admin-plan-form';
const DEACTIVATE_PLAN_MODAL = 'deactivate-admin-plan';

const getPlanId = (plan: SubscriptionPlan) => plan.id ?? plan._id;
const getFeatureLabel = (plan: SubscriptionPlan, key: string) =>
  plan.featureDetails?.find((feature) => feature.key === key)?.label ?? key;

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

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
};

interface PlanFormErrors {
  name?: string;
  price?: string;
  currency?: string;
  durationDays?: string;
  features?: string;
}

interface AdminPlanFormProps {
  plan?: SubscriptionPlan | null;
  onSaved: () => void;
}

const AdminPlanForm: React.FC<AdminPlanFormProps> = ({ plan, onSaved }) => {
  const queryClient = useQueryClient();
  const isEditing = Boolean(plan);
  const [name, setName] = useState(plan?.name ?? '');
  const [description, setDescription] = useState(plan?.description ?? '');
  const [price, setPrice] = useState(String(plan?.price ?? 0));
  const [currency, setCurrency] = useState(plan?.currency ?? 'VND');
  const [durationDays, setDurationDays] = useState(String(plan?.durationDays ?? 30));
  const [features, setFeatures] = useState<string[]>(plan?.features ?? []);
  const [isActive, setIsActive] = useState(plan?.isActive ?? true);
  const [errors, setErrors] = useState<PlanFormErrors>({});

  const { data: availableFeatures, isLoading: featuresLoading } = useQuery({
    queryKey: ['subscription-feature-catalog'],
    queryFn: subscriptionService.getAvailableFeatures,
  });

  const invalidatePlans = () => {
    queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
  };

  const createPlanMutation = useMutation({
    mutationFn: (payload: PlanCreatePayload) => subscriptionService.createPlan(payload),
    onSuccess: () => {
      invalidatePlans();
      toast.success('Subscription plan created');
      onSaved();
    },
    onError: () => toast.error('Failed to create plan'),
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PlanUpdatePayload }) =>
      subscriptionService.updatePlan(id, payload),
    onSuccess: () => {
      invalidatePlans();
      toast.success('Subscription plan updated');
      onSaved();
    },
    onError: () => toast.error('Failed to update plan'),
  });

  const validate = () => {
    const nextErrors: PlanFormErrors = {};
    const numericPrice = Number(price);
    const numericDuration = Number(durationDays);
    if (!name.trim()) nextErrors.name = 'Name is required';
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      nextErrors.price = 'Price must be zero or greater';
    }
    if (!currency.trim() || currency.trim().length > 10) {
      nextErrors.currency = 'Currency is required and must be short';
    }
    if (!Number.isInteger(numericDuration) || numericDuration < 1) {
      nextErrors.durationDays = 'Duration must be at least 1 day';
    }
    if (features.length === 0) nextErrors.features = 'Select at least one available feature';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPayload = (): PlanCreatePayload => ({
    name: name.trim(),
    description: description.trim() || undefined,
    price: Number(price),
    currency: currency.trim().toUpperCase(),
    durationDays: Number(durationDays),
    features,
    isActive,
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    const payload = buildPayload();
    if (isEditing && plan) {
      updatePlanMutation.mutate({ id: getPlanId(plan), payload });
      return;
    }
    createPlanMutation.mutate(payload);
  };

  const toggleFeature = (feature: SubscriptionFeature) => {
    setFeatures((current) =>
      current.includes(feature.key)
        ? current.filter((key) => key !== feature.key)
        : [...current, feature.key]
    );
  };

  const isSubmitting = createPlanMutation.isPending || updatePlanMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Plan name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors.name}
          placeholder="Premium Monthly"
        />
        <Input
          label="Currency"
          value={currency}
          onChange={(event) => setCurrency(event.target.value)}
          error={errors.currency}
          placeholder="VND"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-ink-muted">Description</label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="input-field min-h-24 resize-y"
          placeholder="Short description shown on the pricing page"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Price"
          type="number"
          min={0}
          step={1000}
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          error={errors.price}
        />
        <Input
          label="Duration days"
          type="number"
          min={1}
          value={durationDays}
          onChange={(event) => setDurationDays(event.target.value)}
          error={errors.durationDays}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-muted">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(event) => setIsActive(event.target.checked)}
          className="size-4 rounded border-black/20 accent-black"
        />
        Active plan
      </label>

      <div className="flex flex-col gap-3">
        <div>
          <h3 className="text-sm font-semibold text-ink">Available features</h3>
          <p className="mt-1 text-xs text-black/55">
            Each selected feature is enforced when this plan is activated after payment.
          </p>
          {errors.features && <p className="mt-1 text-xs text-rose-600">{errors.features}</p>}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {featuresLoading ? <p className="text-sm text-black/55">Loading available features...</p> : null}
          {availableFeatures?.map((feature) => (
            <label
              key={feature.key}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-black/10 p-3 hover:bg-black/[0.02]"
            >
              <input
                type="checkbox"
                checked={features.includes(feature.key)}
                onChange={() => toggleFeature(feature)}
                className="mt-0.5 size-4 rounded border-black/20 accent-black"
              />
              <span>
                <span className="block text-sm font-medium text-ink">{feature.label}</span>
                <span className="mt-0.5 block text-xs text-black/55">{feature.description}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-black/10 pt-4">
        <Button type="submit" loading={isSubmitting}>
          <Save size={14} />
          {isEditing ? 'Save changes' : 'Create plan'}
        </Button>
      </div>
    </form>
  );
};

/**
 * PR8 — admin plan list visual polish.
 * LOGIC LOCK: listPlans, create/update/deletePlan, modals.
 */
export const AdminPlanManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { openModal, closeModal } = useUIStore();
  const [showInactive, setShowInactive] = useState(true);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [planToDeactivate, setPlanToDeactivate] = useState<SubscriptionPlan | null>(null);

  const {
    data: plans,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['subscription-plans', { includeInactive: showInactive }],
    queryFn: () => subscriptionService.listPlans(showInactive),
  });

  useEffect(() => {
    if (isError) toast.error('Failed to load subscription plans');
  }, [isError]);

  const deactivatePlanMutation = useMutation({
    mutationFn: (planId: string) => subscriptionService.deletePlan(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast.success('Subscription plan deactivated');
      setPlanToDeactivate(null);
    },
    onError: () => toast.error('Failed to deactivate plan'),
  });

  const openCreateForm = () => {
    setEditingPlan(null);
    openModal(PLAN_FORM_MODAL);
  };

  const openEditForm = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    openModal(PLAN_FORM_MODAL);
  };

  const openDeactivateConfirm = (plan: SubscriptionPlan) => {
    setPlanToDeactivate(plan);
    openModal(DEACTIVATE_PLAN_MODAL);
  };

  const handleFormSaved = () => {
    closeModal();
    setEditingPlan(null);
  };

  const planList = plans ?? [];

  if (isLoading) {
    return (
      <DemoPageRoot>
        <Skeleton className="h-36 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </DemoPageRoot>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={<AlertCircle size={36} />}
        title="Could not load plans"
        description="Please try again in a moment"
        action={(
          <Button
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['subscription-plans'] })}
          >
            Retry
          </Button>
        )}
      />
    );
  }

  return (
    <DemoPageRoot>
      <DemoHeroWhite>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <DemoPill tone="lime">Admin · UC51</DemoPill>
              <CreditCard size={18} className="text-black/45" />
            </div>
            <DemoDisplayTitle>Plan management</DemoDisplayTitle>
            <DemoMuted>
              {planList.length} subscription plan{planList.length === 1 ? '' : 's'}
              {showInactive ? ' (including inactive)' : ' (active only)'}. CRUD via subscription plan APIs.
            </DemoMuted>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-black/60">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(event) => setShowInactive(event.target.checked)}
                className="size-4 rounded border-black/20 accent-black"
              />
              Show inactive
            </label>
            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-black/90"
            >
              <Plus size={14} />
              New plan
            </button>
          </div>
        </div>
      </DemoHeroWhite>

      {planList.length === 0 ? (
        <DemoWhitePanel className="p-8">
          <EmptyState
            icon={<CreditCard size={36} />}
            title="No subscription plans found"
            description="Create the first plan students can purchase"
            action={(
              <button
                type="button"
                onClick={openCreateForm}
                className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-medium text-white"
              >
                <Plus size={14} />
                New plan
              </button>
            )}
          />
        </DemoWhitePanel>
      ) : (
        <DemoWhitePanel>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-black/10 bg-[#f7f4ee]/80">
                  {['Plan', 'Price', 'Duration', 'Features', 'Status', 'Updated', 'Actions'].map(
                    (heading) => (
                      <th
                        key={heading}
                        className="px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.12em] text-black/45"
                      >
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {planList.map((plan) => {
                  const planId = getPlanId(plan);
                  const isDeactivating =
                    deactivatePlanMutation.isPending &&
                    planToDeactivate != null &&
                    getPlanId(planToDeactivate) === planId;

                  return (
                    <tr
                      key={planId}
                      className="border-b border-black/10 last:border-b-0 hover:bg-black/[0.02] transition-colors"
                    >
                      <td className="min-w-56 px-4 py-3">
                        <p className="max-w-xs truncate text-sm font-medium text-ink">{plan.name}</p>
                        {plan.description ? (
                          <p className="mt-0.5 line-clamp-1 text-xs text-black/50">{plan.description}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-sm tabular-nums text-ink">
                        {formatPrice(plan.price, plan.currency)}
                      </td>
                      <td className="px-4 py-3 text-sm tabular-nums text-black/60">
                        {plan.durationDays} days
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex max-w-xs flex-wrap gap-1.5">
                          {plan.features.length > 0 ? (
                            plan.features.slice(0, 3).map((feature) => (
                              <span
                                key={feature}
                                className="rounded-full bg-[#f7f4ee] px-2 py-0.5 text-[11px] text-black/70"
                              >
                                {getFeatureLabel(plan, feature)}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-black/45">No features</span>
                          )}
                          {plan.features.length > 3 ? (
                            <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] text-black/60">
                              +{plan.features.length - 3}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            plan.isActive
                              ? 'bg-[#d9f99d] text-black'
                              : 'bg-black/5 text-black/50'
                          }`}
                        >
                          {plan.isActive ? (
                            <>
                              <Check size={11} />
                              Active
                            </>
                          ) : (
                            'Inactive'
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-black/45">{formatDate(plan.updatedAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditForm(plan)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-ink hover:bg-black/[0.03]"
                          >
                            <Edit2 size={12} />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeactivateConfirm(plan)}
                            disabled={!plan.isActive || isDeactivating}
                            className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Trash2 size={12} />
                            Deactivate
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </DemoWhitePanel>
      )}

      <Modal
        name={PLAN_FORM_MODAL}
        title={editingPlan ? 'Edit plan' : 'Create plan'}
        description={
          editingPlan
            ? 'Update pricing, duration, features, and visibility'
            : 'Create a subscription plan for students'
        }
        size="xl"
        onClose={() => setEditingPlan(null)}
      >
        <AdminPlanForm
          key={editingPlan ? getPlanId(editingPlan) : 'new-plan'}
          plan={editingPlan}
          onSaved={handleFormSaved}
        />
      </Modal>

      <ConfirmModal
        name={DEACTIVATE_PLAN_MODAL}
        title="Deactivate plan"
        description={
          planToDeactivate
            ? `Deactivate "${planToDeactivate.name}"? Students will no longer see it on pricing.`
            : 'Deactivate this plan?'
        }
        confirmLabel="Deactivate"
        danger
        onConfirm={() => {
          if (!planToDeactivate) return;
          deactivatePlanMutation.mutate(getPlanId(planToDeactivate));
        }}
      />
    </DemoPageRoot>
  );
};
