'use client';

import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Save, StickyNote } from 'lucide-react';
import { toast } from 'sonner';
import { notesService } from '../../services';
import { Button, Skeleton } from '../../components/shared';

interface Props {
  lessonId: string;
}

const getHttpStatus = (error: unknown) =>
  (error as { response?: { status?: number } })?.response?.status;

/** PR10 — notes panel in demo-light cream/white language. API upsert locked. */
export const NotesPanel: React.FC<Props> = ({ lessonId }) => {
  const queryClient = useQueryClient();
  const [noteText, setNoteText] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');

  const {
    data: existingNote,
    error,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ['notes', lessonId],
    queryFn: () => notesService.getByLesson(lessonId),
    enabled: !!lessonId,
  });

  const isEnrollmentRequired = isError && getHttpStatus(error) === 403;

  useEffect(() => {
    if (existingNote) {
      setNoteText(existingNote.noteText || '');
      setCodeSnippet(existingNote.codeSnippet || '');
    }
  }, [existingNote]);

  const { mutate: saveNote, isPending } = useMutation({
    mutationFn: () =>
      notesService.upsert({
        lessonId,
        noteText,
        codeSnippet: codeSnippet || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', lessonId] });
      toast.success('Notes saved');
    },
    onError: () => toast.error('Failed to save notes'),
  });

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <StickyNote size={16} className="text-ink" />
        <h3 className="text-sm font-semibold text-ink">My note</h3>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
      ) : isEnrollmentRequired ? (
        <div className="rounded-lg border border-amber-500/25 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-900">
            <AlertCircle size={14} />
            Enrollment required
          </div>
          <p className="mt-2 text-xs text-black/55">
            Enroll in this course to create and view notes for this lesson.
          </p>
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-rose-500/20 bg-rose-50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-rose-800">
            <AlertCircle size={14} />
            Could not load notes
          </div>
          <p className="mt-2 text-xs text-black/55">Please try again in a moment.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Write notes about this lesson..."
            rows={4}
            className="min-h-32 w-full resize-none rounded-lg border border-black/10 bg-[#f7f4ee] p-3 text-sm text-ink outline-none focus:border-black/25"
          />

          <div>
            <label className="mb-1 block text-xs text-black/45">Code snippet (optional)</label>
            <textarea
              value={codeSnippet}
              onChange={(e) => setCodeSnippet(e.target.value)}
              placeholder="// Paste a code snippet here..."
              rows={3}
              className="w-full resize-none rounded-lg border border-black/10 bg-[#111827] p-3 font-mono text-xs leading-relaxed text-[#d9f99d] outline-none"
            />
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => saveNote()}
            loading={isPending}
            disabled={!noteText.trim()}
            className="self-start"
          >
            <Save size={12} />
            Save notes
          </Button>
        </div>
      )}

      {!isLoading && existingNote?.updatedAt ? (
        <p className="mt-2 text-xs text-black/40">
          Last saved: {new Date(existingNote.updatedAt).toLocaleString()}
        </p>
      ) : null}
    </div>
  );
};
