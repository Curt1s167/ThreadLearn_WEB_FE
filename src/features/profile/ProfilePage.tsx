import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  IdCard,
  Mail,
  Save,
  Shield,
  Upload,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { authService, normalizeAvatarUrl } from '../../services/auth.service';
import { extractApiError } from '../../services/apiClient';
import { useAuthStore } from '../../store';
import type { AuthUser } from '../../types';
import { Avatar, Badge, Button, Card, Input, Skeleton } from '../../components/shared';

const profileSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const splitName = (name?: string) => {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  };
};

const getFirstName = (user?: AuthUser | null) =>
  user?.firstName || splitName(user?.name).firstName;

const getLastName = (user?: AuthUser | null) =>
  user?.lastName || splitName(user?.name).lastName;

const getDisplayName = (user?: AuthUser | null) => {
  const fullName = [getFirstName(user), getLastName(user)].filter(Boolean).join(' ');
  return fullName || user?.name || user?.email || 'User';
};

const formatDate = (value?: string) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getVerificationStatus = (user: AuthUser) =>
  Boolean(user.isVerified ?? user.isEmailVerified);

const getActiveStatus = (user: AuthUser) =>
  user.isActive ?? !user.isLocked;

export const ProfilePage: React.FC = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, setUser, logout } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: getFirstName(user),
      lastName: getLastName(user),
    },
  });

  const {
    data: profile,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['auth-profile'],
    queryFn: authService.getProfile,
    retry: false,
  });

  const currentUser = profile || user;

  const applyProfileUser = useCallback((nextUser: AuthUser) => {
    queryClient.setQueryData(['auth-profile'], nextUser);
    setUser(nextUser);
  }, [queryClient, setUser]);

  useEffect(() => {
    if (!profile) return;

    if (profile.isActive === false || profile.isLocked) {
      toast.error('Your session is no longer active. Please sign in again.');
      logout();
      router.replace('/login');
      return;
    }

    applyProfileUser(profile);
    reset({
      firstName: getFirstName(profile),
      lastName: getLastName(profile),
    });
  }, [applyProfileUser, logout, profile, reset, router]);

  useEffect(() => {
    if (!avatarPreview) return;

    return () => {
      URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const avatarSrc = avatarPreview || normalizeAvatarUrl(currentUser?.avatarUrl);

  const detailItems = useMemo(() => {
    if (!currentUser) return [];

    return [
      { icon: <IdCard size={14} />, label: 'ID', value: currentUser.id || currentUser._id },
      { icon: <Mail size={14} />, label: 'Email', value: currentUser.email },
      { icon: <User size={14} />, label: 'First name', value: getFirstName(currentUser) },
      { icon: <User size={14} />, label: 'Last name', value: getLastName(currentUser) },
      { icon: <Upload size={14} />, label: 'Avatar URL', value: currentUser.avatarUrl || 'Not set' },
      { icon: <Shield size={14} />, label: 'Role', value: currentUser.role },
      {
        icon: <CheckCircle size={14} />,
        label: 'Verified',
        value: getVerificationStatus(currentUser) ? 'Yes' : 'No',
      },
      {
        icon: <CheckCircle size={14} />,
        label: 'Active',
        value: getActiveStatus(currentUser) ? 'Yes' : 'No',
      },
      {
        icon: <Clock size={14} />,
        label: 'Last login',
        value: formatDate(currentUser.lastLoginAt),
      },
      {
        icon: <Calendar size={14} />,
        label: 'Created',
        value: formatDate(currentUser.createdAt),
      },
      {
        icon: <Calendar size={14} />,
        label: 'Updated',
        value: formatDate(currentUser.updatedAt),
      },
    ];
  }, [currentUser]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const nextPreview = URL.createObjectURL(file);
    setAvatarPreview((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return nextPreview;
    });
    setIsUploadingAvatar(true);
    setProfileError(null);

    try {
      const result = await authService.uploadAvatar(file);
      const updatedUser = 'email' in result
        ? { ...currentUser, ...result }
        : currentUser
          ? { ...currentUser, avatarUrl: result.avatarUrl }
          : null;

      if (updatedUser) {
        applyProfileUser(updatedUser);
        setAvatarPreview(null);
      }
      toast.success('Avatar updated!');
    } catch (uploadError) {
      setProfileError(extractApiError(uploadError) || 'Failed to upload avatar');
      toast.error('Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const onSubmit = async ({ firstName, lastName }: ProfileFormData) => {
    setProfileError(null);

    try {
      const updatedUser = await authService.updateProfile({
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim(),
      });
      const nextUser = currentUser ? { ...currentUser, ...updatedUser } : updatedUser;

      applyProfileUser(nextUser);
      reset({
        firstName: getFirstName(nextUser),
        lastName: getLastName(nextUser),
      });
      toast.success('Profile updated!');
    } catch (saveError) {
      setProfileError(extractApiError(saveError) || 'Failed to update profile');
      toast.error('Failed to update profile');
    }
  };

  if (isLoading && !currentUser) {
    return (
      <div className="flex flex-col gap-5 animate-fade-in max-w-2xl mx-auto">
        <Skeleton className="h-8 w-40 rounded-lg" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="flex flex-col gap-5 animate-fade-in max-w-2xl mx-auto">
      <div>
        <h1 className="font-mono font-bold text-2xl text-gray-100">Profile</h1>
        <p className="text-sm text-gray-600 font-mono mt-1">
          Manage your account name and avatar.
        </p>
      </div>

      {(profileError || isError) && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 flex gap-3">
          <AlertCircle size={16} className="text-rose-400 mt-0.5 shrink-0" />
          <p className="text-sm text-rose-300 font-mono">
            {profileError || extractApiError(error)}
          </p>
        </div>
      )}

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="relative shrink-0">
            <Avatar src={avatarSrc} name={getDisplayName(currentUser)} size="xl" />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={isUploadingAvatar}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-violet-600 rounded-full flex items-center justify-center hover:bg-violet-500 transition-colors disabled:opacity-50"
              title="Upload avatar"
            >
              <Upload size={12} className="text-white" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-mono font-bold text-xl text-gray-100">
                {getDisplayName(currentUser)}
              </h2>
              <Badge color={currentUser.role === 'ADMIN' ? 'purple' : 'gray'}>
                {currentUser.role}
              </Badge>
              <Badge color={getVerificationStatus(currentUser) ? 'green' : 'amber'}>
                {getVerificationStatus(currentUser) ? 'Verified' : 'Unverified'}
              </Badge>
              <Badge color={getActiveStatus(currentUser) ? 'green' : 'red'}>
                {getActiveStatus(currentUser) ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-gray-600 font-mono text-sm mt-1">{currentUser.email}</p>
            <p className="text-gray-700 font-mono text-xs mt-2">
              {isUploadingAvatar ? 'Uploading avatar...' : 'Use a square image for best results.'}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-mono font-semibold text-gray-100 text-lg mb-4">
          Personal information
        </h3>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="First name"
              type="text"
              placeholder="First name"
              prefix={<User size={13} />}
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <Input
              label="Last name"
              type="text"
              placeholder="Last name"
              prefix={<User size={13} />}
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>

          <Button
            type="submit"
            loading={isSubmitting}
            disabled={!isDirty || isUploadingAvatar}
            className="w-full sm:w-auto justify-center self-start"
          >
            <Save size={14} />
            Save changes
          </Button>
        </form>
      </Card>

      <Card className="p-6">
        <h3 className="font-mono font-semibold text-gray-100 text-lg mb-4">
          Account details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {detailItems.map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 min-w-0"
            >
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                {item.icon}
                <span className="text-xs font-mono">{item.label}</span>
              </div>
              <p className="text-sm text-gray-300 font-mono break-words">{item.value}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
