'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store';

export function ProfileNameForm() {
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ['auth-me'],
    queryFn: authService.getMe,
    enabled: Boolean(user),
    staleTime: 5 * 60_000,
  });
  const sourceUser = profile ?? user;
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setFirstName(sourceUser?.firstName ?? '');
    setLastName(sourceUser?.lastName ?? '');
  }, [sourceUser?.firstName, sourceUser?.lastName]);

  const isDirty = useMemo(
    () => firstName.trim() !== (sourceUser?.firstName ?? '') || lastName.trim() !== (sourceUser?.lastName ?? ''),
    [firstName, lastName, sourceUser?.firstName, sourceUser?.lastName]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    if (!trimmedFirstName || !trimmedLastName) {
      setError('First name and last name cannot be empty.');
      return;
    }

    setError('');
    setIsSaving(true);
    try {
      const updatedUser = await authService.updateProfile({
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
      });
      setUser(updatedUser);
      queryClient.setQueryData(['auth-me'], updatedUser);
      toast.success('Profile updated successfully.');
    } catch {
      setError('Unable to update your profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 border-t border-black/10 pt-5">
      <h2 className="text-sm font-semibold text-ink">Profile details</h2>
      <div className="mt-4 grid gap-3">
        <label className="grid gap-1.5 text-xs font-medium text-black/65">
          First name
          <input
            type="text"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            maxLength={50}
            disabled={isSaving}
            className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-black/40 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>
        <label className="grid gap-1.5 text-xs font-medium text-black/65">
          Last name
          <input
            type="text"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            maxLength={50}
            disabled={isSaving}
            className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-black/40 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>
      </div>
      {error ? <p role="alert" className="mt-3 text-xs text-rose-600">{error}</p> : null}
      <button
        type="submit"
        disabled={isSaving || !isDirty}
        className="mt-4 inline-flex min-h-10 items-center justify-center rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? 'Saving changes...' : 'Save changes'}
      </button>
    </form>
  );
}
