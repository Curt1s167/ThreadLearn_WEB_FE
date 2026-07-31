'use client';

import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Search, StickyNote, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { EmptyState, Skeleton } from '../../components/shared';
import { notesService } from '../../services';
import type { Note, PaginationMeta } from '../../types';
import {
  DemoDisplayTitle,
  DemoHeroWhite,
  DemoMuted,
  DemoPageRoot,
  DemoPill,
} from '../ui-reskin/demo-ui';

type NotesQueryData = {
  data: Note[];
  meta?: PaginationMeta;
};

export const NotesListPage: React.FC = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const { data: notesPage, isLoading, isError } = useQuery({
    queryKey: ['my-notes', page],
    queryFn: () => notesService.list(page),
  });
  const filteredNotes = useMemo(() => {
    const notes = notesPage?.data ?? [];
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return notes;
    return notes.filter((note) =>
      [note.noteText, note.anchorText, note.codeSnippet, note.lesson?.title]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedQuery)),
    );
  }, [notesPage?.data, query]);

  const { mutate: removeNote, isPending: isRemoving } = useMutation({
    mutationFn: (noteId: string) => notesService.remove(noteId),
    onMutate: async (noteId) => {
      await queryClient.cancelQueries({ queryKey: ['my-notes', page] });
      const previous = queryClient.getQueryData<NotesQueryData>(['my-notes', page]);
      queryClient.setQueryData<NotesQueryData>(['my-notes', page], (current) => {
        if (!current) return current;
        return {
          ...current,
          data: current.data.filter((note) => note._id !== noteId),
          meta: current.meta
            ? { ...current.meta, total: Math.max(0, current.meta.total - 1) }
            : current.meta,
        };
      });
      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-notes'] });
      toast.success('Note deleted');
    },
    onError: (_error, _noteId, context) => {
      if (context?.previous) queryClient.setQueryData(['my-notes', page], context.previous);
      toast.error('Failed to delete note');
    },
  });

  const totalPages = notesPage?.meta?.totalPages ?? 1;

  return (
    <DemoPageRoot>
      <DemoHeroWhite>
        <DemoPill tone="blue">My Notes</DemoPill>
        <DemoDisplayTitle>Your learning notes, in one place.</DemoDisplayTitle>
        <DemoMuted>Keep focused notes for each concept, then return here when you need a review.</DemoMuted>
      </DemoHeroWhite>

      <div className="mb-6 flex max-w-xl items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2">
        <Search size={16} className="text-black/40" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search notes in this page..."
          className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-black/35"
          aria-label="Search notes"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, index) => <Skeleton key={index} className="h-48 rounded-lg" />)}
        </div>
      ) : isError ? (
        <EmptyState icon={<StickyNote size={36} />} title="Could not load notes" description="Please try again in a moment" />
      ) : filteredNotes.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {filteredNotes.map((note) => (
              <article key={note._id} className="rounded-lg border border-black/10 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => router.push(note.sourceLink || `/lessons/${note.lessonId}`)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="text-xs uppercase tracking-[0.14em] text-black/40">
                      Updated {new Date(note.updatedAt).toLocaleDateString()}
                    </p>
                    <h2 className="mt-2 truncate text-lg font-semibold text-ink">
                      {note.lesson?.title || `Lesson #${note.lessonId.slice(-6)}`}
                    </h2>
                    <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-black/65">{note.noteText}</p>
                    {note.anchorText ? <p className="mt-3 line-clamp-2 border-l-2 border-brand-lime pl-2 text-xs leading-5 text-black/45">{note.anchorText}</p> : null}
                    {note.codeSnippet ? <p className="mt-3 truncate font-mono text-xs text-black/45">{note.codeSnippet}</p> : null}
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-ink">
                      Open lesson <ArrowRight size={15} />
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeNote(note._id)}
                    disabled={isRemoving}
                    className="rounded-lg p-2 text-black/35 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                    aria-label="Delete note"
                    title="Delete note"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
          {totalPages > 1 && !query.trim() ? (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                className="rounded-lg border border-black/10 px-3 py-2 text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-black/50">Page {page} of {totalPages}</span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-black/10 px-3 py-2 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <EmptyState
          icon={<StickyNote size={36} />}
          title={query ? 'No matching notes' : 'No notes yet'}
          description={query ? 'Try another search term.' : 'Save a note in any lesson and it will appear here.'}
        />
      )}
    </DemoPageRoot>
  );
};
