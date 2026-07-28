'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CornerDownRight, EyeOff, MessageSquare, Pencil, Send, Trash2 } from 'lucide-react';
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
  onReply?: (comment: Comment) => void;
  depth?: number;
}> = ({ comment, onReply, depth = 0 }) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const isDeleted = comment.status === 'deleted';
  const canManage = !isDeleted && (user?._id === comment.userId || user?.role === 'ADMIN');
  const authorName = isDeleted ? 'Deleted comment' : comment.isAnonymous ? 'Anonymous learner' : comment.user?.name || 'ThreadLearn member';

  const { mutate: updateComment, isPending: isUpdating } = useMutation({
    mutationFn: () => commentsService.update(comment._id, editContent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', comment.lessonId] });
      queryClient.invalidateQueries({ queryKey: ['comment-replies', comment.parentId] });
      setIsEditing(false);
      toast.success('Comment updated');
    },
    onError: () => toast.error('Failed to update comment'),
  });

  const { mutate: deleteComment, isPending: isDeleting } = useMutation({
    mutationFn: () => commentsService.delete(comment._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', comment.lessonId] });
      queryClient.invalidateQueries({ queryKey: ['comment-replies', comment.parentId] });
      toast.success('Comment deleted');
    },
    onError: () => toast.error('Failed to delete comment'),
  });

  return (
    <div className={depth > 0 ? 'ml-6 border-l border-black/10 pl-4 sm:ml-8' : ''}>
      <div className="flex gap-3 py-3">
        <Avatar
          src={comment.isAnonymous || isDeleted ? undefined : comment.user?.avatarUrl}
          name={authorName}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-medium text-ink">{authorName}</span>
            {comment.isAnonymous ? (
              <span className="inline-flex items-center gap-1 text-xs text-ink-faint">
                <EyeOff size={11} /> Hidden identity
              </span>
            ) : null}
            <span className="text-xs text-ink-faint">
              {new Date(comment.createdAt).toLocaleDateString()}
            </span>
            {comment.isEdited && !isDeleted ? <span className="text-xs text-ink-faint">edited</span> : null}
          </div>

          {isEditing ? (
            <div className="flex flex-wrap gap-2">
              <input
                value={editContent}
                onChange={(event) => setEditContent(event.target.value)}
                className="input-field min-w-0 flex-1 text-sm disabled:opacity-50"
                autoFocus
                disabled={isUpdating}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && editContent.trim() && !isUpdating) updateComment();
                  if (event.key === 'Escape' && !isUpdating) {
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
                className="comments-action min-h-11 px-2 text-xs disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="comment-bubble rounded-lg p-3">
              <p className="whitespace-pre-wrap text-sm leading-6 text-ink-muted">{comment.content}</p>
            </div>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-3">
            {onReply && !isDeleted ? (
              <button
                type="button"
                onClick={() => onReply(comment)}
                className="comments-action inline-flex min-h-11 items-center gap-1 px-2 text-xs"
              >
                <CornerDownRight size={10} />
                Reply
              </button>
            ) : null}
            {canManage ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="comments-action inline-flex min-h-11 items-center gap-1 px-2 text-xs"
                >
                  <Pencil size={10} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => deleteComment()}
                  disabled={isDeleting}
                  className="comments-action inline-flex min-h-11 items-center gap-1 px-2 text-xs transition hover:text-rose-600 disabled:opacity-50"
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

const CommentThread: React.FC<{ comment: Comment; onReply: (comment: Comment) => void }> = ({
  comment,
  onReply,
}) => {
  const { data: replies = [] } = useQuery({
    queryKey: ['comment-replies', comment._id],
    queryFn: () => commentsService.getReplies(comment._id),
  });

  return (
    <div>
      <CommentItem comment={comment} onReply={onReply} />
      {replies.map((reply) => (
        <CommentItem key={reply._id} comment={reply} depth={1} />
      ))}
    </div>
  );
};

export const CommentsSection: React.FC<Props> = ({ lessonId }) => {
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', lessonId],
    queryFn: () => commentsService.getByLesson(lessonId),
    enabled: !!lessonId,
  });

  const { mutate: postComment, isPending } = useMutation({
    mutationFn: () =>
      replyTo
        ? commentsService.reply(replyTo._id, { content: newComment, isAnonymous })
        : commentsService.create({ lessonId, content: newComment, isAnonymous }),
    onSuccess: () => {
      if (replyTo) queryClient.invalidateQueries({ queryKey: ['comment-replies', replyTo._id] });
      queryClient.invalidateQueries({ queryKey: ['comments', lessonId] });
      setNewComment('');
      setReplyTo(null);
      setIsAnonymous(false);
      toast.success(replyTo ? 'Reply posted' : 'Comment posted');
    },
    onError: (error) => {
      if (getHttpStatus(error) === 403) {
        toast.error('You must enroll in the course to comment');
        return;
      }
      toast.error('Failed to post comment');
    },
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <MessageSquare size={15} className="text-ink" />
        <h3 className="text-sm font-semibold text-ink">Discussion ({comments.length})</h3>
      </div>

      <div className="comments-composer rounded-lg border p-3">
        {replyTo ? (
          <div className="mb-2 flex items-center gap-1 text-xs text-ink-faint">
            <CornerDownRight size={10} />
            Replying to {replyTo.isAnonymous ? 'an anonymous learner' : replyTo.user?.name || 'a learner'}
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              disabled={isPending}
              className="comments-action ml-1 grid min-h-11 min-w-11 place-items-center disabled:opacity-50"
              aria-label="Cancel reply"
            >
              ×
            </button>
          </div>
        ) : null}
        <textarea
          value={newComment}
          onChange={(event) => setNewComment(event.target.value)}
          disabled={isPending}
          placeholder={replyTo ? 'Write a reply...' : 'Add a comment...'}
          rows={3}
          className="comments-input w-full resize-y rounded-md border-0 bg-transparent px-1 py-2 text-sm leading-6 outline-none disabled:opacity-50"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-xs text-ink-muted">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(event) => setIsAnonymous(event.target.checked)}
              disabled={isPending}
              className="comments-checkbox h-5 w-5 rounded"
            />
            Post anonymously
          </label>
          <Button
            size="sm"
            className="min-h-11 px-4"
            onClick={() => postComment()}
            disabled={!newComment.trim()}
            loading={isPending}
          >
            <Send size={12} />
            {replyTo ? 'Reply' : 'Post'}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="h-14 rounded-lg skeleton" />
          ))}
        </div>
      ) : comments.length > 0 ? (
        <div className="divide-y divide-black/10">
          {comments.map((comment) => (
            <CommentThread key={comment._id} comment={comment} onReply={setReplyTo} />
          ))}
        </div>
      ) : (
        <p className="py-5 text-center text-sm text-ink-faint">No comments yet. Be the first to discuss!</p>
      )}
    </div>
  );
};
