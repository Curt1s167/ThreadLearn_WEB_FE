import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Send, CornerDownRight, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { commentsService } from '../../services';
import { useAuthStore } from '../../store';
import { Avatar, Button, Card } from '../../components/shared';
import type { Comment } from '../../types';

interface Props {
  lessonId: string;
}

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

  const { mutate: updateComment } = useMutation({
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
    <div className={`${depth > 0 ? 'ml-8 border-l border-white/[0.04] pl-4' : ''}`}>
      <div className="flex gap-3 py-3">
        <Avatar
          src={comment.user?.avatarUrl}
          name={comment.user?.name || 'User'}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-medium text-gray-300">
              {comment.user?.name || 'Anonymous'}
            </span>
            <span className="text-[10px] text-gray-700 font-mono">
              {new Date(comment.createdAt).toLocaleDateString()}
            </span>
          </div>

          {isEditing ? (
            <div className="flex gap-2">
              <input
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="input-field flex-1 text-xs py-1.5"
                autoFocus
              />
              <button
                onClick={() => updateComment()}
                className="text-xs text-violet-400 hover:text-violet-300 font-mono"
              >
                Save
              </button>
              <button
                onClick={() => { setIsEditing(false); setEditContent(comment.content); }}
                className="text-xs text-gray-600 hover:text-gray-400 font-mono"
              >
                Cancel
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-400 font-mono">{comment.content}</p>
          )}

          <div className="flex items-center gap-3 mt-1.5">
            <button
              onClick={() => onReply(comment._id)}
              className="text-[11px] text-gray-600 hover:text-violet-400 font-mono flex items-center gap-1 transition-colors"
            >
              <CornerDownRight size={10} />
              Reply
            </button>
            {isOwner && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-[11px] text-gray-600 hover:text-gray-300 font-mono flex items-center gap-1 transition-colors"
                >
                  <Pencil size={10} />
                  Edit
                </button>
                <button
                  onClick={() => deleteComment()}
                  className="text-[11px] text-gray-600 hover:text-rose-400 font-mono flex items-center gap-1 transition-colors"
                >
                  <Trash2 size={10} />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

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
    onError: () => toast.error('Failed to post comment'),
  });

  // Build tree from flat array
  const rootComments = comments?.filter((c) => !c.parentId) || [];
  const replies = (parentId: string) =>
    comments?.filter((c) => c.parentId === parentId) || [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <MessageSquare size={15} className="text-gray-500" />
        <h3 className="font-mono font-medium text-gray-300 text-sm">
          Discussion ({comments?.length ?? 0})
        </h3>
      </div>

      {/* New comment form */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          {replyTo && (
            <div className="text-[10px] text-violet-400 font-mono mb-1 flex items-center gap-1">
              <CornerDownRight size={10} />
              Replying to comment
              <button
                onClick={() => setReplyTo(undefined)}
                className="text-gray-600 hover:text-gray-400 ml-1"
              >
                ✕
              </button>
            </div>
          )}
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newComment.trim()) postComment();
            }}
            placeholder="Add a comment..."
            className="input-field text-xs"
          />
        </div>
        <Button
          size="sm"
          onClick={() => postComment()}
          disabled={!newComment.trim()}
          loading={isPending}
        >
          <Send size={12} />
        </Button>
      </div>

      {/* Comments list */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 skeleton rounded-lg" />
          ))}
        </div>
      ) : rootComments.length > 0 ? (
        <div className="divide-y divide-white/[0.03]">
          {rootComments.map((comment) => (
            <div key={comment._id}>
              <CommentItem comment={comment} onReply={setReplyTo} />
              {replies(comment._id).map((reply) => (
                <CommentItem
                  key={reply._id}
                  comment={reply}
                  onReply={setReplyTo}
                  depth={1}
                />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-700 font-mono py-4 text-center">
          No comments yet. Be the first to discuss!
        </p>
      )}
    </div>
  );
};
