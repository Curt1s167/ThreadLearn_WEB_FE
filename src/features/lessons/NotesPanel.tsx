'use client';

import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Pencil, Plus, Save, StickyNote, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { notesService } from '../../services';
import { Button, Skeleton } from '../../components/shared';
import type { Note } from '../../types';

interface Props {
  lessonId: string;
  selection?: {
    text: string;
    anchorStart: number;
    anchorEnd: number;
  };
}
const getHttpStatus = (error: unknown) =>
  (error as { response?: { status?: number } })?.response?.status;

export const NotesPanel: React.FC<Props> = ({ lessonId, selection }) => {
  const queryClient = useQueryClient();
  const [noteText, setNoteText] = useState('');
  const [anchorText, setAnchorText] = useState('');
  const [anchorStart, setAnchorStart] = useState<number | undefined>();
  const [anchorEnd, setAnchorEnd] = useState<number | undefined>();
  const [codeSnippet, setCodeSnippet] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const {
    data: notes = [],
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
    if (!selection || editingNote) return;
    setAnchorText(selection.text);
    setAnchorStart(selection.anchorStart);
    setAnchorEnd(selection.anchorEnd);
    setIsComposerOpen(true);
  }, [editingNote, selection]);

  const resetComposer = () => {
    setNoteText('');
    setAnchorText('');
    setAnchorStart(undefined);
    setAnchorEnd(undefined);
    setCodeSnippet('');
    setEditingNote(null);
    setIsComposerOpen(false);
  };
  const invalidateNotes = () => {
    queryClient.invalidateQueries({ queryKey: ['notes', lessonId] });
    queryClient.invalidateQueries({ queryKey: ['my-notes'] });
  };
  const { mutate: saveNote, isPending: isSaving } = useMutation({
    mutationFn: () => {
      const payload = {
        noteText: noteText.trim(),
        anchorText: anchorText.trim() || undefined,
        anchorStart: editingNote && anchorStart === undefined ? null : anchorStart,
        anchorEnd: editingNote && anchorEnd === undefined ? null : anchorEnd,
        codeSnippet: codeSnippet.trim() || undefined,
      };
      return editingNote
        ? notesService.update(editingNote._id, payload)
        : notesService.create({ lessonId, ...payload });
    },
    onSuccess: () => {
      invalidateNotes();
      toast.success(editingNote ? 'Note updated' : 'Note added');
      resetComposer();
    },
    onError: () => toast.error('Failed to save note'),
  });
  const { mutate: removeNote, isPending: isRemoving } = useMutation({
    mutationFn: (noteId: string) => notesService.remove(noteId),
    onSuccess: () => {
      invalidateNotes();
      toast.success('Note deleted');
    },
    onError: () => toast.error('Failed to delete note'),
  });
  const startEditing = (note: Note) => {
    setEditingNote(note);
    setNoteText(note.noteText);
    setAnchorText(note.anchorText ?? '');
    setAnchorStart(note.anchorStart);
    setAnchorEnd(note.anchorEnd);
    setCodeSnippet(note.codeSnippet ?? '');
    setIsComposerOpen(true);
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <StickyNote size={16} className="text-ink" />
          <h3 className="text-sm font-semibold text-ink">Lesson notes</h3>
        </div>
        {!isLoading && !isError && !isComposerOpen ? (
          <Button size="sm" variant="outline" onClick={() => setIsComposerOpen(true)}>
            <Plus size={13} /> Add note
          </Button>
        ) : null}
      </div>
      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
        </div>
      ) : isEnrollmentRequired ? (
        <div className="rounded-lg border border-amber-500/25 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-900">
            <AlertCircle size={14} /> Enrollment required
          </div>
          <p className="mt-2 text-xs text-black/55">
            Enroll in this course to create and view lesson notes.
          </p>
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-rose-500/20 bg-rose-50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-rose-800">
            <AlertCircle size={14} /> Could not load notes
          </div>
          <p className="mt-2 text-xs text-black/55">Please try again in a moment.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {isComposerOpen ? (
            <div className="rounded-lg border border-black/10 bg-[#f7f4ee] p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-ink">
                  {editingNote ? 'Edit note' : 'New note'}
                </p>
                <button
                  type="button"
                  onClick={resetComposer}
                  disabled={isSaving}
                  className="rounded p-1 text-black/40 transition hover:bg-black/5 hover:text-black disabled:opacity-50"
                  aria-label="Close note editor"
                >
                  <X size={14} />
                </button>
              </div>
              <label className="mb-1 block text-xs text-black/45">
                Reference excerpt (optional)
              </label>
              <textarea
                value={anchorText}
                onChange={(event) => {
                  setAnchorText(event.target.value);
                  setAnchorStart(undefined);
                  setAnchorEnd(undefined);
                }}
                placeholder="Paste the idea, paragraph, or line this note explains..."
                rows={2}
                className="mb-3 w-full resize-y rounded-lg border border-black/10 bg-white p-2.5 text-sm text-ink outline-none focus:border-black/25"
              />
              <label className="mb-1 block text-xs text-black/45">Your explanation</label>
              <textarea
                value={noteText}
                onChange={(event) => setNoteText(event.target.value)}
                placeholder="Write what you learned or what needs review..."
                rows={4}
                className="w-full resize-y rounded-lg border border-black/10 bg-white p-2.5 text-sm text-ink outline-none focus:border-black/25"
              />
              <label className="mb-1 mt-3 block text-xs text-black/45">
                Code snippet (optional)
              </label>
              <textarea
                value={codeSnippet}
                onChange={(event) => setCodeSnippet(event.target.value)}
                placeholder="// Paste a related code snippet..."
                rows={3}
                className="w-full resize-y rounded-lg border border-black/10 bg-[#111827] p-2.5 font-mono text-xs leading-relaxed text-[#d9f99d] outline-none"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => saveNote()}
                loading={isSaving}
                disabled={!noteText.trim()}
                className="mt-3"
              >
                <Save size={12} /> {editingNote ? 'Update note' : 'Add note'}
              </Button>
            </div>
          ) : null}
          {notes.length > 0 ? (
            notes.map((note) => (
              <article
                key={note._id}
                className="rounded-lg border border-black/10 bg-white p-3"
              >
                {note.anchorText ? (
                  <p className="border-l-2 border-brand-lime pl-2 text-xs leading-5 text-black/55">
                    {note.anchorText}
                  </p>
                ) : null}
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink">
                  {note.noteText}
                </p>
                {note.codeSnippet ? (
                  <pre className="mt-3 max-h-32 overflow-auto rounded-lg bg-[#111827] p-2.5 text-xs leading-5 text-[#d9f99d]">
                    <code>{note.codeSnippet}</code>
                  </pre>
                ) : null}
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-xs text-black/40">
                    {new Date(note.updatedAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => startEditing(note)}
                      className="rounded p-1.5 text-black/40 transition hover:bg-black/5 hover:text-black"
                      aria-label="Edit note"
                      title="Edit note"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeNote(note._id)}
                      disabled={isRemoving}
                      className="rounded p-1.5 text-black/40 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                      aria-label="Delete note"
                      title="Delete note"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : !isComposerOpen ? (
            <div className="rounded-lg border border-dashed border-black/15 bg-[#f7f4ee] p-4 text-center">
              <p className="text-sm font-medium text-ink">No notes for this lesson</p>
              <p className="mt-1 text-xs text-black/45">
                Capture each concept separately so it is easier to revisit.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsComposerOpen(true)}
                className="mt-3"
              >
                <Plus size={13} /> Add first note
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
