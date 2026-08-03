'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle2,
  Edit2,
  GraduationCap,
  LockKeyhole,
  Plus,
  RefreshCw,
  Search,
  UnlockKeyhole,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button, EmptyState, Input, Skeleton } from '../../components/shared';
import { Modal } from '../../components/shared/Modal';
import { extractApiError } from '../../services/apiClient';
import { adminService } from '../../services';
import { useUIStore } from '../../store';
import type {
  AdminInstructorCreatePayload,
  AdminInstructorFilters,
  AdminInstructorUpdatePayload,
  User,
} from '../../types';
import {
  DemoDisplayTitle,
  DemoHeroWhite,
  DemoMuted,
  DemoPageRoot,
  DemoPill,
  DemoWhitePanel,
} from '../ui-reskin/demo-ui';

const FORM_MODAL = 'admin-instructor-form';
const LOCK_MODAL = 'admin-lock-instructor';
const UNLOCK_MODAL = 'admin-unlock-instructor';

const instructorId = (instructor: User) => instructor.id ?? instructor._id;
const instructorName = (instructor: User) =>
  [instructor.firstName, instructor.lastName].filter(Boolean).join(' ') ||
  instructor.name ||
  instructor.email;
const isActive = (instructor: User) => instructor.isActive ?? !instructor.isLocked;
const isVerified = (instructor: User) =>
  instructor.isEmailVerified ?? instructor.isVerified ?? false;
const filterBoolean = (value: string) => (value === '' ? undefined : value === 'true');

const Status: React.FC<{ value: boolean; yes: string; no: string }> = ({
  value,
  yes,
  no,
}) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${value ? 'bg-[#d9f99d] text-black' : 'bg-black/5 text-black/55'}`}
  >
    {value ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
    {value ? yes : no}
  </span>
);

const InstructorForm: React.FC<{ instructor: User | null; onSaved: () => void }> = ({
  instructor,
  onSaved,
}) => {
  const queryClient = useQueryClient();
  const editing = Boolean(instructor);
  const [firstName, setFirstName] = useState(instructor?.firstName ?? '');
  const [lastName, setLastName] = useState(instructor?.lastName ?? '');
  const [email, setEmail] = useState(instructor?.email ?? '');
  const [avatarUrl, setAvatarUrl] = useState(instructor?.avatarUrl ?? '');
  const [verified, setVerified] = useState(isVerified(instructor ?? ({} as User)));
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ['admin-instructors'] });
  const save = useMutation({
    mutationFn: (payload: AdminInstructorCreatePayload | AdminInstructorUpdatePayload) =>
      editing
        ? adminService.updateInstructor(
            instructorId(instructor!),
            payload as AdminInstructorUpdatePayload
          )
        : adminService.createInstructor(payload as AdminInstructorCreatePayload),
    onSuccess: () => {
      refresh();
      toast.success(editing ? 'Instructor updated' : 'Instructor created');
      onSaved();
    },
    onError: (error) => toast.error(extractApiError(error)),
  });
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('First and last name are required');
      return;
    }
    if (!editing && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      toast.error('Enter a valid email');
      return;
    }
    if (editing) {
      save.mutate({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        avatarUrl: avatarUrl.trim() || undefined,
        isVerified: verified,
      });
    } else {
      save.mutate({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
      });
    }
  };
  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="First name"
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
        />
        <Input
          label="Last name"
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
        />
      </div>
      {editing ? (
        <>
          <Input
            label="Avatar URL"
            value={avatarUrl}
            onChange={(event) => setAvatarUrl(event.target.value)}
            placeholder="https://..."
          />
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={verified}
              onChange={(event) => setVerified(event.target.checked)}
              className="size-4 accent-black"
            />
            Email verified
          </label>
        </>
      ) : (
        <div>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="instructor@example.com"
          />
          <p className="mt-2 text-sm text-ink-muted">
            The instructor will receive a one-time link to set their own password.
          </p>
        </div>
      )}
      <div className="flex justify-end border-t border-black/10 pt-4">
        <Button type="submit" loading={save.isPending}>
          {editing ? 'Save changes' : 'Create instructor'}
        </Button>
      </div>
    </form>
  );
};

const LockForm: React.FC<{ instructor: User | null; onSaved: () => void }> = ({
  instructor,
  onSaved,
}) => {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');
  const mutation = useMutation({
    mutationFn: () => adminService.lockInstructor(instructorId(instructor!), reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-instructors'] });
      toast.success('Instructor locked');
      onSaved();
    },
    onError: (error) => toast.error(extractApiError(error)),
  });
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-black/60">
        Lock {instructor ? instructorName(instructor) : 'this instructor'} and prevent
        account access.
      </p>
      <textarea
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        className="input-field min-h-24 resize-y"
        placeholder="Reason (optional)"
      />
      <div className="flex justify-end border-t border-black/10 pt-4">
        <Button
          variant="danger"
          loading={mutation.isPending}
          disabled={!instructor}
          onClick={() => mutation.mutate()}
        >
          <LockKeyhole size={14} />
          Lock instructor
        </Button>
      </div>
    </div>
  );
};

export const AdminInstructorManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { openModal, closeModal } = useUIStore();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [active, setActive] = useState('');
  const [verified, setVerified] = useState('');
  const [selected, setSelected] = useState<User | null>(null);
  const filters = useMemo<AdminInstructorFilters>(
    () => ({
      page,
      limit,
      search: search || undefined,
      isActive: filterBoolean(active),
      isVerified: filterBoolean(verified),
    }),
    [active, limit, page, search, verified]
  );
  const query = useQuery({
    queryKey: ['admin-instructors', filters],
    queryFn: () => adminService.listInstructors(filters),
  });
  useEffect(() => {
    if (query.isError) toast.error('Failed to load instructors');
  }, [query.isError]);
  const close = () => {
    closeModal();
    setSelected(null);
  };
  const unlock = useMutation({
    mutationFn: (instructor: User) =>
      adminService.unlockInstructor(instructorId(instructor)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-instructors'] });
      toast.success('Instructor unlocked');
    },
    onError: (error) => toast.error(extractApiError(error)),
  });
  if (query.isLoading)
    return (
      <DemoPageRoot>
        <Skeleton className="h-36 rounded-lg" />
        <Skeleton className="h-72 rounded-lg" />
      </DemoPageRoot>
    );
  if (query.isError)
    return (
      <EmptyState
        icon={<AlertCircle size={36} />}
        title="Could not load instructors"
        description="Please try again in a moment"
        action={
          <Button variant="outline" onClick={() => query.refetch()}>
            <RefreshCw size={14} />
            Retry
          </Button>
        }
      />
    );
  const instructors = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const totalPages = Math.max(query.data?.totalPages ?? 1, 1);
  return (
    <DemoPageRoot>
      <DemoHeroWhite>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <DemoPill tone="pink">Admin - Instructor accounts</DemoPill>
              <GraduationCap size={18} className="text-black/45" />
            </div>
            <DemoDisplayTitle>Instructor management</DemoDisplayTitle>
            <DemoMuted>
              {total.toLocaleString()} instructor{total === 1 ? '' : 's'} found. Create,
              update, verify, lock, and unlock instructor accounts.
            </DemoMuted>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelected(null);
              openModal(FORM_MODAL);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white"
          >
            <Plus size={14} />
            Add instructor
          </button>
        </div>
      </DemoHeroWhite>
      <DemoWhitePanel className="p-4">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setSearch(searchInput.trim());
          }}
          className="grid gap-3 lg:grid-cols-[1fr_160px_160px_120px_auto]"
        >
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search name or email"
            prefix={<Search size={13} />}
          />
          <select
            value={active}
            onChange={(event) => {
              setActive(event.target.value);
              setPage(1);
            }}
            className="input-field"
          >
            <option value="">All access</option>
            <option value="true">Active</option>
            <option value="false">Locked</option>
          </select>
          <select
            value={verified}
            onChange={(event) => {
              setVerified(event.target.value);
              setPage(1);
            }}
            className="input-field"
          >
            <option value="">All verification</option>
            <option value="true">Verified</option>
            <option value="false">Unverified</option>
          </select>
          <select
            value={limit}
            onChange={(event) => {
              setLimit(Number(event.target.value));
              setPage(1);
            }}
            className="input-field"
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>
          <div className="flex gap-2">
            <Button type="submit">Apply</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSearchInput('');
                setSearch('');
                setActive('');
                setVerified('');
                setPage(1);
              }}
            >
              Reset
            </Button>
          </div>
        </form>
      </DemoWhitePanel>
      {instructors.length === 0 ? (
        <DemoWhitePanel className="p-8">
          <EmptyState
            icon={<GraduationCap size={36} />}
            title="No instructors found"
            description="Try changing filters or create a new instructor account"
          />
        </DemoWhitePanel>
      ) : (
        <DemoWhitePanel>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-black/10 bg-[#f7f4ee]/80">
                  {['Instructor', 'Email', 'Access', 'Verified', 'Actions'].map(
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
                {instructors.map((instructor) => {
                  const activeAccount = isActive(instructor);
                  return (
                    <tr
                      key={instructorId(instructor)}
                      className="border-b border-black/10 last:border-b-0"
                    >
                      <td className="px-4 py-3 text-sm font-medium">
                        {instructorName(instructor)}
                        {instructor.lockedReason ? (
                          <p className="mt-0.5 text-xs text-rose-700">
                            {instructor.lockedReason}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-sm text-black/65">
                        {instructor.email}
                      </td>
                      <td className="px-4 py-3">
                        <Status value={activeAccount} yes="Active" no="Locked" />
                      </td>
                      <td className="px-4 py-3">
                        <Status
                          value={isVerified(instructor)}
                          yes="Verified"
                          no="Unverified"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelected(instructor);
                              openModal(FORM_MODAL);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium"
                          >
                            <Edit2 size={12} />
                            Edit
                          </button>
                          {activeAccount ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelected(instructor);
                                openModal(LOCK_MODAL);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700"
                            >
                              <LockKeyhole size={12} />
                              Lock
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => unlock.mutate(instructor)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium"
                              disabled={unlock.isPending}
                            >
                              <UnlockKeyhole size={12} />
                              Unlock
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-black/10 px-4 py-3">
            <p className="text-xs text-black/50">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((value) => value + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </DemoWhitePanel>
      )}
      <Modal
        name={FORM_MODAL}
        title={selected ? 'Edit instructor' : 'Create instructor'}
        description={
          selected
            ? 'Update allowed profile and verification fields'
            : 'The instructor receives a one-time link to set their password.'
        }
        size="xl"
        onClose={() => setSelected(null)}
      >
        <InstructorForm
          key={selected ? instructorId(selected) : 'new'}
          instructor={selected}
          onSaved={close}
        />
      </Modal>
      <Modal
        name={LOCK_MODAL}
        title="Lock instructor"
        description="The reason is optional."
        size="md"
        onClose={() => setSelected(null)}
      >
        <LockForm instructor={selected} onSaved={close} />
      </Modal>
    </DemoPageRoot>
  );
};
