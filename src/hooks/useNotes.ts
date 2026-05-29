'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { noteService } from '../services/note.service';

export function useNotes(lessonId: string) {
  return useQuery({
    queryKey: ['notes', lessonId],
    queryFn: () => noteService.getNotes(lessonId),
    enabled: !!lessonId,
  });
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: noteService.createNote,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['notes', vars.lessonId] });
      toast.success('Ghi chú đã được lưu');
    },
    onError: () => toast.error('Không thể lưu ghi chú'),
  });
}

export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ noteId, noteContent }: { noteId: string; noteContent: string }) =>
      noteService.updateNote(noteId, noteContent),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes'] });
      toast.success('Ghi chú đã được cập nhật');
    },
    onError: () => toast.error('Không thể cập nhật ghi chú'),
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: noteService.deleteNote,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes'] });
      toast.success('Đã xóa ghi chú');
    },
    onError: () => toast.error('Không thể xóa ghi chú'),
  });
}
