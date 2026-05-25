import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StickyNote, Save } from 'lucide-react';
import { toast } from 'sonner';
import { notesService } from '../../services';
import { Button, Card } from '../../components/shared';

interface Props {
  lessonId: string;
}

export const NotesPanel: React.FC<Props> = ({ lessonId }) => {
  const queryClient = useQueryClient();
  const [noteText, setNoteText] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');

  const { data: existingNote } = useQuery({
    queryKey: ['notes', lessonId],
    queryFn: () => notesService.getByLesson(lessonId),
    enabled: !!lessonId,
  });

  // Populate from existing
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
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <StickyNote size={14} className="text-amber-400" />
        <h3 className="font-mono font-medium text-gray-300 text-sm">
          Your notes
        </h3>
      </div>

      <div className="flex flex-col gap-3">
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Write notes about this lesson..."
          rows={4}
          className="input-field resize-none text-xs leading-relaxed"
        />

        <div>
          <label className="text-[10px] text-gray-600 font-mono mb-1 block">
            Code snippet (optional)
          </label>
          <textarea
            value={codeSnippet}
            onChange={(e) => setCodeSnippet(e.target.value)}
            placeholder="// Paste a code snippet here..."
            rows={3}
            className="input-field resize-none text-xs font-mono bg-black/40"
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

      {existingNote?.updatedAt && (
        <p className="text-[10px] text-gray-700 font-mono mt-2">
          Last saved: {new Date(existingNote.updatedAt).toLocaleString()}
        </p>
      )}
    </Card>
  );
};
