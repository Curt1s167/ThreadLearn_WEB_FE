import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  AlertCircle,
  Edit3,
  Lock,
  Plus,
  Search,
  Unlock,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminService } from '../../services';
import { extractApiError } from '../../services/apiClient';
import type {
  AdminStudent,
  AdminStudentCreateRequest,
  AdminStudentListQuery,
  AdminStudentUpdateRequest,
} from '../../types';
import { Avatar, Badge, Button, Card, EmptyState, Input, Skeleton } from '../../components/shared';

const PAGE_SIZE = 10;

const studentSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().optional(),
  avatarUrl: z.string().optional(),
  isVerified: z.boolean().optional(),
}).superRefine((value, ctx) => {
  if (value.password && value.password.length < 6) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Password must be at least 6 characters',
      path: ['password'],
    });
  }
});

type StudentFormData = z.infer<typeof studentSchema>;
type StudentModalMode = 'create' | 'edit';

const getStudentId = (student: AdminStudent) => student.id || student._id;

const splitName = (name?: string) => {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  };
};

const getFirstName = (student?: AdminStudent | null) =>
  student?.firstName || splitName(student?.name).firstName;

const getLastName = (student?: AdminStudent | null) =>
  student?.lastName || splitName(student?.name).lastName;

const getDisplayName = (student: AdminStudent) =>
  [getFirstName(student), getLastName(student)].filter(Boolean).join(' ') ||
  student.name ||
  student.email;

const isVerified = (student: AdminStudent) =>
  student.isVerified ?? student.isEmailVerified ?? false;

const isActive = (student: AdminStudent) =>
  student.isActive ?? !student.isLocked;

const formatDate = (value?: string) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const toBoolParam = (value: string): boolean | undefined => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
};

const StudentModal: React.FC<{
  mode: StudentModalMode;
  student?: AdminStudent | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (data: StudentFormData) => void;
}> = ({ mode, student, isSaving, onClose, onSubmit }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      firstName: getFirstName(student),
      lastName: getLastName(student),
      email: student?.email || '',
      password: '',
      avatarUrl: student?.avatarUrl || '',
      isVerified: student ? isVerified(student) : false,
    },
  });

  const isEdit = mode === 'edit';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#111118] border border-white/[0.08] rounded-2xl panel-shadow animate-slide-in">
        <div className="flex items-start justify-between p-5 border-b border-white/[0.06]">
          <div>
            <h2 className="font-mono font-semibold text-gray-100">
              {isEdit ? 'Update student' : 'Add student'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5 font-mono">
              {isEdit ? 'Edit safe student profile fields.' : 'Create a new student account.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-600 hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-white/5"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="First name"
              placeholder="First"
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <Input
              label="Last name"
              placeholder="Last"
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>

          <Input
            label="Email"
            type="email"
            placeholder="student@example.com"
            disabled={isEdit}
            error={errors.email?.message}
            {...register('email')}
          />

          {!isEdit && (
            <Input
              label="Password"
              type="password"
              placeholder="Optional, min. 6 characters"
              error={errors.password?.message}
              {...register('password')}
            />
          )}

          {isEdit && (
            <>
              <Input
                label="Avatar URL"
                placeholder="https://..."
                error={errors.avatarUrl?.message}
                {...register('avatarUrl')}
              />
              <label className="flex items-center gap-2 text-sm text-gray-400 font-mono">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-white/10 bg-white/5 accent-violet-600"
                  {...register('isVerified')}
                />
                Mark email as verified
              </label>
            </>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" loading={isSaving}>
              {isEdit ? <Edit3 size={14} /> : <Plus size={14} />}
              {isEdit ? 'Save changes' : 'Add student'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const AdminStudentsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [verifiedFilter, setVerifiedFilter] = useState('all');
  const [modalMode, setModalMode] = useState<StudentModalMode | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<AdminStudent | null>(null);
  const [pendingLockStudent, setPendingLockStudent] = useState<AdminStudent | null>(null);

  const query: AdminStudentListQuery = useMemo(() => ({
    page,
    limit: PAGE_SIZE,
    ...(search ? { search } : {}),
    ...(toBoolParam(activeFilter) !== undefined ? { isActive: toBoolParam(activeFilter) } : {}),
    ...(toBoolParam(verifiedFilter) !== undefined ? { isVerified: toBoolParam(verifiedFilter) } : {}),
  }), [activeFilter, page, search, verifiedFilter]);

  const studentsQuery = useQuery({
    queryKey: ['admin-students', query],
    queryFn: () => adminService.listStudents(query),
  });

  const invalidateStudents = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-students'] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: AdminStudentCreateRequest) => adminService.createStudent(payload),
    onSuccess: () => {
      toast.success('Student added');
      setModalMode(null);
      invalidateStudents();
    },
    onError: (error) => toast.error(extractApiError(error)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AdminStudentUpdateRequest }) =>
      adminService.updateStudent(id, payload),
    onSuccess: () => {
      toast.success('Student updated');
      setModalMode(null);
      setSelectedStudent(null);
      invalidateStudents();
    },
    onError: (error) => toast.error(extractApiError(error)),
  });

  const lockMutation = useMutation({
    mutationFn: (student: AdminStudent) => adminService.lockStudent(getStudentId(student)),
    onSuccess: () => {
      toast.success('Student locked');
      setPendingLockStudent(null);
      invalidateStudents();
    },
    onError: (error) => toast.error(extractApiError(error)),
  });

  const unlockMutation = useMutation({
    mutationFn: (student: AdminStudent) => adminService.unlockStudent(getStudentId(student)),
    onSuccess: () => {
      toast.success('Student unlocked');
      invalidateStudents();
    },
    onError: (error) => toast.error(extractApiError(error)),
  });

  const students = studentsQuery.data?.items ?? [];
  const totalPages = studentsQuery.data?.totalPages ?? 1;
  const total = studentsQuery.data?.total ?? students.length;

  const openCreateModal = () => {
    setSelectedStudent(null);
    setModalMode('create');
  };

  const openEditModal = (student: AdminStudent) => {
    setSelectedStudent(student);
    setModalMode('edit');
  };

  const handleStudentSubmit = (data: StudentFormData) => {
    if (modalMode === 'create') {
      createMutation.mutate({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        ...(data.password ? { password: data.password } : {}),
      });
      return;
    }

    if (!selectedStudent) return;

    updateMutation.mutate({
      id: getStudentId(selectedStudent),
      payload: {
        firstName: data.firstName,
        lastName: data.lastName,
        name: `${data.firstName} ${data.lastName}`.trim(),
        ...(data.avatarUrl ? { avatarUrl: data.avatarUrl } : { avatarUrl: '' }),
        isVerified: data.isVerified,
        isEmailVerified: data.isVerified,
      },
    });
  };

  const applySearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setActiveFilter('all');
    setVerifiedFilter('all');
    setPage(1);
  };

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    lockMutation.isPending ||
    unlockMutation.isPending;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Users size={18} className="text-violet-400" />
          </div>
          <div>
            <h1 className="font-mono font-bold text-2xl text-gray-100">Student Management</h1>
            <p className="text-gray-600 font-mono text-sm">Add, edit, lock, and unlock students</p>
          </div>
        </div>
        <Button onClick={openCreateModal}>
          <UserPlus size={14} />
          Add student
        </Button>
      </div>

      <Card className="p-4">
        <form onSubmit={applySearch} className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto_auto] gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search name or email..."
              className="input-field pl-9"
            />
          </div>

          <select
            value={activeFilter}
            onChange={(event) => { setActiveFilter(event.target.value); setPage(1); }}
            className="input-field"
          >
            <option value="all">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Locked</option>
          </select>

          <select
            value={verifiedFilter}
            onChange={(event) => { setVerifiedFilter(event.target.value); setPage(1); }}
            className="input-field"
          >
            <option value="all">All verification</option>
            <option value="true">Verified</option>
            <option value="false">Unverified</option>
          </select>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1 lg:flex-none">
              Search
            </Button>
            <Button type="button" variant="outline" onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </form>
      </Card>

      {studentsQuery.isError && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 flex gap-3">
          <AlertCircle size={16} className="text-rose-400 mt-0.5 shrink-0" />
          <p className="text-sm text-rose-300 font-mono">
            {extractApiError(studentsQuery.error)}
          </p>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px]">
            <thead>
              <tr className="border-b border-white/[0.05]">
                {['Student', 'Email', 'Verified', 'Status', 'Created', 'Actions'].map((header) => (
                  <th key={header} className="text-left text-xs text-gray-600 font-mono px-4 py-3">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {studentsQuery.isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6">
                    <Skeleton className="h-4 rounded" count={7} />
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={<Users size={32} />}
                      title="No students found"
                      description="Adjust your filters or add a new student."
                      action={<Button onClick={openCreateModal}><Plus size={14} />Add student</Button>}
                    />
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const active = isActive(student);
                  const verified = isVerified(student);

                  return (
                    <tr
                      key={getStudentId(student)}
                      className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar src={student.avatarUrl} name={getDisplayName(student)} size="sm" />
                          <span className="text-sm text-gray-300 font-mono">
                            {getDisplayName(student)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 font-mono">{student.email}</td>
                      <td className="px-4 py-3">
                        <Badge color={verified ? 'green' : 'amber'}>
                          {verified ? 'Verified' : 'Unverified'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge color={active ? 'green' : 'red'}>
                          {active ? 'Active' : 'Locked'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 font-mono">
                        {formatDate(student.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(student)}
                            disabled={isMutating}
                          >
                            <Edit3 size={13} />
                            Edit
                          </Button>
                          {active ? (
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => setPendingLockStudent(student)}
                              disabled={isMutating}
                            >
                              <Lock size={13} />
                              Lock
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => unlockMutation.mutate(student)}
                              loading={unlockMutation.isPending}
                              disabled={isMutating}
                            >
                              <Unlock size={13} />
                              Unlock
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-white/[0.05]">
          <p className="text-xs text-gray-600 font-mono">
            Showing page {studentsQuery.data?.page ?? page} of {Math.max(totalPages, 1)} ({total} students)
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              disabled={page <= 1 || studentsQuery.isFetching}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((current) => current + 1)}
              disabled={page >= totalPages || studentsQuery.isFetching}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {modalMode && (
        <StudentModal
          mode={modalMode}
          student={selectedStudent}
          isSaving={createMutation.isPending || updateMutation.isPending}
          onClose={() => { setModalMode(null); setSelectedStudent(null); }}
          onSubmit={handleStudentSubmit}
        />
      )}

      {pendingLockStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setPendingLockStudent(null)} />
          <div className="relative w-full max-w-sm bg-[#111118] border border-white/[0.08] rounded-2xl panel-shadow p-5">
            <h2 className="font-mono font-semibold text-gray-100">Lock student?</h2>
            <p className="text-sm text-gray-500 font-mono mt-2">
              {getDisplayName(pendingLockStudent)} will no longer be able to access their account.
            </p>
            <div className="flex justify-end gap-3 mt-5">
              <Button variant="ghost" onClick={() => setPendingLockStudent(null)} disabled={lockMutation.isPending}>
                Cancel
              </Button>
              <Button
                variant="danger"
                loading={lockMutation.isPending}
                onClick={() => lockMutation.mutate(pendingLockStudent)}
              >
                <Lock size={14} />
                Lock
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
