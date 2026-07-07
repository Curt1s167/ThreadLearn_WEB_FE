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
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button, Card, EmptyState, Input, Skeleton } from '../../components/shared';
import { ConfirmModal, Modal } from '../../components/shared/Modal';
import { subscriptionService } from '../../services';
import { useUIStore } from '../../store';
import type { PlanCreatePayload, PlanUpdatePayload, SubscriptionPlan } from '../../types';

const PLAN_FORM_MODAL = 'admin-plan-form';
const DEACTIVATE_PLAN_MODAL = 'deactivate-admin-plan';

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
  const [features, setFeatures] = useState<string[]>(
    plan?.features.length ? plan.features : ['']
  );
  const [isActive, setIsActive] = useState(plan?.isActive ?? true);
  const [errors, setErrors] = useState<PlanFormErrors>({});

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
    const cleanFeatures = features.map((feature) => feature.trim()).filter(Boolean);

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
    if (features.some((feature) => feature.length > 0 && !feature.trim())) {
      nextErrors.features = 'Features cannot be only spaces';
    }
    if (cleanFeatures.length !== new Set(cleanFeatures).size) {
      nextErrors.features = 'Features must be unique';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPayload = (): PlanCreatePayload => ({
    name: name.trim(),
    description: description.trim() || undefined,
    price: Number(price),
    currency: currency.trim().toUpperCase(),
    durationDays: Number(durationDays),
    features: features.map((feature) => feature.trim()).filter(Boolean),
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

  const updateFeature = (index: number, value: string) => {
    setFeatures((current) => current.map((feature, i) => (i === index ? value : feature)));
  };

  const addFeature = () => setFeatures((current) => [...current, '']);
  const removeFeature = (index: number) => {
    setFeatures((current) => {
      const next = current.filter((_, i) => i !== index);
      return next.length ? next : [''];
    });
  };

  const isSubmitting = createPlanMutation.isPending || updatePlanMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid md:grid-cols-2 gap-4">
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
        <label className="text-xs text-gray-400 font-mono">Description</label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="input-field min-h-24 resize-y"
          placeholder="Short description shown on the pricing page"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
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

      <label className="flex items-center gap-2 text-sm text-gray-400 font-mono">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(event) => setIsActive(event.target.checked)}
          className="size-4 rounded border-white/10 bg-white/5 accent-violet-500"
        />
        Active plan
      </label>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-mono font-semibold text-gray-200 text-sm">Features</h3>
            {errors.features && <p className="text-xs text-rose-400 font-mono mt-1">{errors.features}</p>}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addFeature}>
            <Plus size={13} />
            Add feature
          </Button>
        </div>

        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
          {features.map((feature, index) => (
            <div key={index} className="grid grid-cols-[1fr_auto] gap-2">
              <Input
                value={feature}
                onChange={(event) => updateFeature(index, event.target.value)}
                placeholder={`Feature ${index + 1}`}
              />
              <button
                type="button"
                aria-label={`Remove feature ${index + 1}`}
                onClick={() => removeFeature(index)}
                className="size-10 inline-flex items-center justify-center rounded-lg border border-white/10 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-white/[0.06] pt-4">
        <Button type="submit" loading={isSubmitting}>
          <Save size={14} />
          {isEditing ? 'Save changes' : 'Create plan'}
        </Button>
      </div>
    </form>
  );
};

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
      <div className="flex flex-col gap-5 animate-fade-in">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-12 w-72 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
        <Card className="p-4">
          <Skeleton className="h-9 rounded-lg" count={6} />
        </Card>
      </div>
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
    <div className="flex flex-col gap-5 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <CreditCard size={18} className="text-amber-400" />
          </div>
          <div className="min-w-0">
            <h1 className="font-mono font-bold text-2xl text-gray-100 text-balance">Plan Management</h1>
            <p className="text-gray-600 font-mono text-sm text-pretty">
              {planList.length} subscription plans {showInactive ? 'including inactive' : 'active only'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-gray-500 font-mono">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(event) => setShowInactive(event.target.checked)}
              className="size-4 rounded border-white/10 bg-white/5 accent-violet-500"
            />
            Show inactive
          </label>
          <Button onClick={openCreateForm}>
            <Plus size={14} />
            New plan
          </Button>
        </div>
      </div>

      {planList.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon={<CreditCard size={36} />}
            title="No subscription plans found"
            description="Create the first plan students can purchase"
            action={(
              <Button onClick={openCreateForm}>
                <Plus size={14} />
                New plan
              </Button>
            )}
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  {['Plan', 'Price', 'Duration', 'Features', 'Status', 'Updated', 'Actions'].map((heading) => (
                    <th key={heading} className="text-left text-xs text-gray-600 font-mono px-4 py-3">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {planList.map((plan) => {
                  const planId = getPlanId(plan);
                  const isDeactivating = deactivatePlanMutation.isPending &&
                    planToDeactivate ? getPlanId(planToDeactivate) === planId : false;

                  return (
                    <tr key={planId} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 min-w-56">
                        <p className="text-sm text-gray-200 font-mono font-medium truncate max-w-xs">{plan.name}</p>
                        {plan.description && (
                          <p className="text-xs text-gray-600 font-mono mt-1 line-clamp-1">{plan.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300 font-mono tabular-nums">
                        {formatPrice(plan.price, plan.currency)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400 font-mono tabular-nums">
                        {plan.durationDays} days
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {plan.features.length > 0 ? plan.features.slice(0, 3).map((feature) => (
                            <span key={feature} className="tag">{feature}</span>
                          )) : (
                            <span className="text-xs text-gray-600 font-mono">No features</span>
                          )}
                          {plan.features.length > 3 && <span className="tag">+{plan.features.length - 3}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge color={plan.isActive ? 'green' : 'gray'}>
                          {plan.isActive ? (
                            <>
                              <Check size={11} />
                              Active
                            </>
                          ) : (
                            'Inactive'
                          )}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 font-mono">
                        {formatDate(plan.updatedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditForm(plan)}>
                            <Edit2 size={13} />
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => openDeactivateConfirm(plan)}
                            disabled={!plan.isActive}
                            loading={isDeactivating}
                          >
                            <Trash2 size={13} />
                            Deactivate
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        name={PLAN_FORM_MODAL}
        title={editingPlan ? 'Edit plan' : 'Create plan'}
        description={editingPlan ? 'Update pricing, duration, features, and visibility' : 'Create a subscription plan for students'}
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
        description={planToDeactivate ? `Deactivate "${planToDeactivate.name}"? Students will no longer see it on pricing.` : 'Deactivate this plan?'}
        confirmLabel="Deactivate"
        danger
        onConfirm={() => {
          if (!planToDeactivate) return;
          deactivatePlanMutation.mutate(getPlanId(planToDeactivate));
        }}
      />
    </div>
  );
};
