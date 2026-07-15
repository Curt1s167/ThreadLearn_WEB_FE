'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CornerDownRight, MessageSquare, Pencil, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { commentsService } from '../../services';
import { useAuthStore } from '../../store';
import { Avatar, Button } from '../../components/shared';
import type { Comment } from '../../types';

interface Props {
  lessonId: string;
}

const getHttpStatus = (error: unknown) =>
  (error as { response?: { status?: number } })?.response?.status;

const CommentItem: React.FC<{
  comment: Comment;
  onReply: (id: string) => void;
  depth?: number;
}> = ({ comment, onReply, depth = 0 }) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const isOwner = user?._id === comment.userId;

  const { mutate: updateComment, isPending: isUpdating } = useMutation({
    mutationFn: () => commentsService.update(comment._id, editContent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', comment.lessonId] });
      setIsEditing(false);
      toast.success('Comment updated');
    },
  });

  const { mutate: deleteComment } = useMutation({
    mutationFn: () => commentsService.delete(comment._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', comment.lessonId] });
      toast.success('Comment deleted');
    },
  });

  return (
    <div className={depth > 0 ? 'ml-6 border-l border-black/10 pl-4' : ''}>
      <div className="flex gap-3 py-3">
        <Avatar src={comment.user?.avatarUrl} name={comment.user?.name || 'User'} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-sm font-medium text-ink">{comment.user?.name || 'Anonymous'}</span>
            <span className="text-xs text-black/40">
              {new Date(comment.createdAt).toLocaleDateString()}
            </span>
          </div>

          {isEditing ? (
            <div className="flex flex-wrap gap-2">
              <input
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="input-field min-w-0 flex-1 text-sm disabled:opacity-50"
                autoFocus
                disabled={isUpdating}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && editContent.trim() && !isUpdating) updateComment();
                  else if (e.key === 'Escape' && !isUpdating) {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => updateComment()}
                disabled={isUpdating || !editContent.trim()}
                className="text-xs font-medium text-ink disabled:opacity-50"
              >
                {isUpdating ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
                disabled={isUpdating}
                className="text-xs text-black/45 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="rounded-lg bg-[#f7f4ee] p-3">
              <p className="text-sm text-black/70">{comment.content}</p>
            </div>
          )}

          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => onReply(comment._id)}
              className="inline-flex items-center gap-1 text-xs text-black/45 transition hover:text-black"
            >
              <CornerDownRight size={10} />
              Reply
            </button>
            {isOwner ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1 text-xs text-black/45 transition hover:text-black"
                >
                  <Pencil size={10} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => deleteComment()}
                  className="inline-flex items-center gap-1 text-xs text-black/45 transition hover:text-rose-600"
                >
                  <Trash2 size={10} />
                  Delete
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

/** PR10 — discussion UI light; create/reply/edit/delete API locked. */
export const CommentsSection: React.FC<Props> = ({ lessonId }) => {
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | undefined>();
  const queryClient = useQueryClient();

  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', lessonId],
    queryFn: () => commentsService.getByLesson(lessonId),
    enabled: !!lessonId,
  });

  const { mutate: postComment, isPending } = useMutation({
    mutationFn: () =>
      commentsService.create({ lessonId, content: newComment, parentId: replyTo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', lessonId] });
      setNewComment('');
      setReplyTo(undefined);
    },
    onError: (err) => {
      if (getHttpStatus(err) === 403) {
        toast.error('You must enroll in the course to comment');
        return;
      }
      toast.error('Failed to post comment');
    },
  });

  const rootComments = comments?.filter((c) => !c.parentId) || [];
  const replies = (parentId: string) => comments?.filter((c) => c.parentId === parentId) || [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <MessageSquare size={15} className="text-ink" />
        <h3 className="text-sm font-semibold text-ink">Discussion ({comments?.length ?? 0})</h3>
      </div>

      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          {replyTo ? (
            <div className="mb-1 flex items-center gap-1 text-xs text-black/50">
              <CornerDownRight size={10} />
              Replying to comment
              <button
                type="button"
                onClick={() => setReplyTo(undefined)}
                disabled={isPending}
                className="ml-1 text-black/40 hover:text-black disabled:opacity-50"
              >
                ✕
              </button>
            </div>
          ) : null}
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newComment.trim() && !isPending) postComment();
            }}
            disabled={isPending}
            placeholder="Add a comment..."
            className="w-full rounded-full border border-black/10 bg-[#f7f4ee] px-4 py-2.5 text-sm text-ink outline-none focus:border-black/25 disabled:opacity-50"
          />
        </div>
        <Button
          size="sm"
          onClick={() => postComment()}
          disabled={!newComment.trim()}
          loading={isPending}
          className="shrink-0 self-end"
        >
          <Send size={12} />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 rounded-lg skeleton" />
          ))}
        </div>
      ) : rootComments.length > 0 ? (
        <div className="divide-y divide-black/10">
          {rootComments.map((comment) => (
            <div key={comment._id}>
              <CommentItem comment={comment} onReply={setReplyTo} />
              {replies(comment._id).map((reply) => (
                <CommentItem key={reply._id} comment={reply} onReply={setReplyTo} depth={1} />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <p className="py-4 text-center text-sm text-black/40">
          No comments yet. Be the first to discuss!
        </p>
      )}
    </div>
  );
};
