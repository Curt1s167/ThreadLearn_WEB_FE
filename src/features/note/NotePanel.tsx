
import React, { useState, useEffect, useRef } from 'react';
import { StickyNote, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { Card, Button } from '../../components/shared';
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote } from '../../hooks/useNotes';
import type { NoteV2 } from '../../types';

interface Props {
  lessonId: string;
}

interface NotePopupState {
  anchorText: string;
  anchorStart: number;
  anchorEnd: number;
  x: number;
  y: number;
}

const NoteCard: React.FC<{ note: NoteV2 }> = ({ note }) => {
  const { mutate: updateNote, isPending: updating } = useUpdateNote();
  const { mutate: deleteNote } = useDeleteNote();
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(note.noteContent);

  return (
    <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-lg">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="text-[10px] font-mono text-amber-400/70 line-clamp-1 flex-1">
          &ldquo;{note.anchorText}&rdquo;
        </p>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setEditing((v) => !v)}
            className="p-1 text-gray-600 hover:text-gray-300 rounded transition-colors"
          >
            <Pencil size={11} />
          </button>
          <button
            onClick={() => deleteNote(note._id)}
            className="p-1 text-gray-600 hover:text-rose-400 rounded transition-colors"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {editing ? (
        <div className="flex flex-col gap-1.5">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="input-field resize-none text-xs leading-relaxed"
            autoFocus
          />
          <div className="flex gap-1.5">
            <button
              onClick={() => {
                updateNote({ noteId: note._id, noteContent: content });
                setEditing(false);
              }}
              disabled={updating}
              className="p-1 text-emerald-400 hover:text-emerald-300 rounded transition-colors"
            >
              <Check size={12} />
            </button>
            <button
              onClick={() => { setEditing(false); setContent(note.noteContent); }}
              className="p-1 text-gray-600 hover:text-gray-400 rounded transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-400 font-mono leading-relaxed whitespace-pre-wrap">
          {note.noteContent}
        </p>
      )}

      <p className="text-[9px] text-gray-700 font-mono mt-1.5">
        {new Date(note.updatedAt).toLocaleString('vi-VN')}
      </p>
    </div>
  );
};

const NotePopup: React.FC<{
  popup: NotePopupState;
  lessonId: string;
  onClose: () => void;
}> = ({ popup, lessonId, onClose }) => {
  const [noteContent, setNoteContent] = useState('');
  const { mutate: createNote, isPending } = useCreateNote();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const handleSave = () => {
    if (!noteContent.trim()) return;
    createNote(
      {
        lessonId,
        anchorText: popup.anchorText,
        anchorStart: popup.anchorStart,
        anchorEnd: popup.anchorEnd,
        noteContent,
      },
      { onSuccess: onClose }
    );
  };

  return (
    <div
      ref={ref}
      style={{ position: 'fixed', top: popup.y, left: Math.min(popup.x, window.innerWidth - 280), zIndex: 50 }}
      className="w-64 bg-[#111118] border border-amber-500/20 rounded-xl shadow-2xl p-3 animate-fade-in"
    >
      <div className="flex items-center gap-1.5 mb-2">
        <StickyNote size={12} className="text-amber-400" />
        <span className="text-xs font-mono text-amber-400">Ghi chú</span>
        <button onClick={onClose} className="ml-auto text-gray-600 hover:text-gray-400">
          <X size={12} />
        </button>
      </div>
      <p className="text-[10px] font-mono text-gray-600 mb-2 line-clamp-2">
        &ldquo;{popup.anchorText}&rdquo;
      </p>
      <textarea
        autoFocus
        value={noteContent}
        onChange={(e) => setNoteContent(e.target.value)}
        placeholder="Nhập ghi chú..."
        rows={3}
        className="input-field resize-none text-xs w-full leading-relaxed"
      />
      <div className="flex justify-end mt-2">
        <Button size="sm" onClick={handleSave} loading={isPending} disabled={!noteContent.trim()}>
          Lưu
        </Button>
      </div>
    </div>
  );
};

export const NotePanel: React.FC<Props> = ({ lessonId }) => {
  const { data, isLoading } = useNotes(lessonId);
  const [popup, setPopup] = useState<NotePopupState | null>(null);
  const [showAddManual, setShowAddManual] = useState(false);
  const [manualText, setManualText] = useState('');
  const [manualNote, setManualNote] = useState('');
  const { mutate: createNote, isPending: creating } = useCreateNote();

  const notes = data?.data ?? [];

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;

      const anchor = selection.anchorNode?.parentElement?.closest('#lesson-body');
      if (!anchor) return;

      const text = selection.toString().trim();
      if (!text || text.length < 2) return;

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setPopup({
        anchorText: text,
        anchorStart: range.startOffset,
        anchorEnd: range.endOffset,
        x: rect.left,
        y: rect.bottom + 8 + window.scrollY,
      });
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const handleManualSave = () => {
    if (!manualText.trim() || !manualNote.trim()) return;
    createNote(
      {
        lessonId,
        anchorText: manualText,
        anchorStart: 0,
        anchorEnd: manualText.length,
        noteContent: manualNote,
      },
      {
        onSuccess: () => {
          setManualText('');
          setManualNote('');
          setShowAddManual(false);
        },
      }
    );
  };

  return (
    <>
      {popup && (
        <NotePopup popup={popup} lessonId={lessonId} onClose={() => setPopup(null)} />
      )}

      <Card className="p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <StickyNote size={14} className="text-amber-400" />
            <h3 className="font-mono font-medium text-gray-300 text-sm">
              Ghi chú ({notes.length})
            </h3>
          </div>
          <button
            onClick={() => setShowAddManual((v) => !v)}
            className="p-1 text-gray-600 hover:text-amber-400 rounded transition-colors"
            title="Thêm ghi chú thủ công"
          >
            <Plus size={14} />
          </button>
        </div>

        <p className="text-[10px] text-gray-700 font-mono mb-3">
          Chọn văn bản trong bài học để tạo ghi chú nhanh
        </p>

        {showAddManual && (
          <div className="flex flex-col gap-2 mb-3 p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg">
            <input
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Đoạn văn bản tham chiếu..."
              className="input-field text-xs"
            />
            <textarea
              value={manualNote}
              onChange={(e) => setManualNote(e.target.value)}
              placeholder="Nội dung ghi chú..."
              rows={3}
              className="input-field resize-none text-xs leading-relaxed"
            />
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={() => setShowAddManual(false)}>
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={handleManualSave}
                loading={creating}
                disabled={!manualText.trim() || !manualNote.trim()}
              >
                Lưu
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-16 skeleton rounded-lg" />
            ))}
          </div>
        ) : notes.length > 0 ? (
          <div className="flex flex-col gap-2">
            {notes.map((note) => (
              <NoteCard key={note._id} note={note} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-700 font-mono py-3 text-center">
            Chưa có ghi chú nào
          </p>
        )}
      </Card>
    </>
  );
};

