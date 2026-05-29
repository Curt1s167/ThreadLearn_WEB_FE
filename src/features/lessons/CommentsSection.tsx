'use client';

import React, { useState } from 'react';
import { MessageSquare, Send, CornerDownRight, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuthStore } from '../../store';
import { Avatar, Button, Card } from '../../components/shared';
import {
  useComments,
  useReplies,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
} from '../../hooks/useComments';
import type { CommentTargetType, CommentV2 } from '../../types';

interface Props {
  targetType: CommentTargetType;
  targetId: string;
}

const TimeAgo: React.FC<{ date: string }> = ({ date }) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return <span>vừa xong</span>;
  if (mins < 60) return <span>{mins} phút trước</span>;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return <span>{hrs} giờ trước</span>;
  return <span>{Math.floor(hrs / 24)} ngày trước</span>;
};

const ReplyList: React.FC<{
  commentId: string;
  onReply: (id: string, name: string) => void;
}> = ({ commentId, onReply }) => {
  const { data, isLoading } = useReplies(commentId);
  const { user } = useAuthStore();
  const { mutate: updateComment } = useUpdateComment();
  const { mutate: deleteComment } = useDeleteComment();
  const [editing, setEditing] = useState<{ id: string; content: string } | null>(null);

  const replies = data?.data ?? [];

  if (isLoading)
    return <div className="ml-8 mt-1 h-6 skeleton rounded" />;

  return (
    <>
      {replies.map((reply) => {
        const isOwner = user?._id === reply.userId._id;
        return (
          <div key={reply._id} className="ml-8 border-l border-white/[0.04] pl-4 py-2.5">
            <div className="flex gap-3">
              <Avatar
                src={reply.userId.avatarUrl ?? undefined}
                name={reply.userId.fullName}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-medium text-gray-300">
                    {reply.userId.fullName}
                  </span>
                  <span className="text-[10px] text-gray-700 font-mono">
                    <TimeAgo date={reply.createdAt} />
                  </span>
                </div>
                {editing?.id === reply._id ? (
                  <div className="flex gap-2">
                    <input
                      value={editing.content}
                      onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                      className="input-field flex-1 text-xs py-1.5"
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        updateComment({ id: reply._id, content: editing.content });
                        setEditing(null);
                      }}
                      className="text-xs text-violet-400 hover:text-violet-300 font-mono"
                    >
                      Lưu
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="text-xs text-gray-600 hover:text-gray-400 font-mono"
                    >
                      Hủy
                    </button>
                  </div>
                ) : (
                  <p className={`text-sm font-mono ${reply.isDeleted ? 'text-gray-600 italic' : 'text-gray-400'}`}>
                    {reply.content}
                  </p>
                )}
                {!reply.isDeleted && (
                  <div className="flex items-center gap-3 mt-1.5">
                    <button
                      onClick={() => onReply(commentId, reply.userId.fullName)}
                      className="text-[11px] text-gray-600 hover:text-violet-400 font-mono flex items-center gap-1 transition-colors"
                    >
                      <CornerDownRight size={10} />
                      Trả lời
                    </button>
                    {isOwner && (
                      <>
                        <button
                          onClick={() => setEditing({ id: reply._id, content: reply.content })}
                          className="text-[11px] text-gray-600 hover:text-gray-300 font-mono flex items-center gap-1 transition-colors"
                        >
                          <Pencil size={10} />
                          Sửa
                        </button>
                        <button
                          onClick={() => deleteComment(reply._id)}
                          className="text-[11px] text-gray-600 hover:text-rose-400 font-mono flex items-center gap-1 transition-colors"
                        >
                          <Trash2 size={10} />
                          Xóa
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
};

const CommentItem: React.FC<{
  comment: CommentV2;
  onReply: (id: string, name: string) => void;
}> = ({ comment, onReply }) => {
  const { user } = useAuthStore();
  const { mutate: updateComment } = useUpdateComment();
  const { mutate: deleteComment } = useDeleteComment();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showReplies, setShowReplies] = useState(false);
  const isOwner = user?._id === comment.userId._id;

  return (
    <div className="py-3">
      <div className="flex gap-3">
        <Avatar
          src={comment.userId.avatarUrl ?? undefined}
          name={comment.userId.fullName}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-medium text-gray-300">
              {comment.userId.fullName}
            </span>
            <span className="text-[10px] text-gray-700 font-mono">
              <TimeAgo date={comment.createdAt} />
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
                onClick={() => {
                  updateComment({ id: comment._id, content: editContent });
                  setIsEditing(false);
                }}
                className="text-xs text-violet-400 hover:text-violet-300 font-mono"
              >
                Lưu
              </button>
              <button
                onClick={() => { setIsEditing(false); setEditContent(comment.content); }}
                className="text-xs text-gray-600 hover:text-gray-400 font-mono"
              >
                Hủy
              </button>
            </div>
          ) : (
            <p className={`text-sm font-mono ${comment.isDeleted ? 'text-gray-600 italic' : 'text-gray-400'}`}>
              {comment.content}
            </p>
          )}

          {!comment.isDeleted && (
            <div className="flex items-center gap-3 mt-1.5">
              <button
                onClick={() => onReply(comment._id, comment.userId.fullName)}
                className="text-[11px] text-gray-600 hover:text-violet-400 font-mono flex items-center gap-1 transition-colors"
              >
                <CornerDownRight size={10} />
                Trả lời
              </button>
              <button
                onClick={() => setShowReplies((v) => !v)}
                className="text-[11px] text-gray-600 hover:text-gray-400 font-mono flex items-center gap-1 transition-colors"
              >
                {showReplies ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                Replies
              </button>
              {isOwner && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-[11px] text-gray-600 hover:text-gray-300 font-mono flex items-center gap-1 transition-colors"
                  >
                    <Pencil size={10} />
                    Sửa
                  </button>
                  <button
                    onClick={() => deleteComment(comment._id)}
                    className="text-[11px] text-gray-600 hover:text-rose-400 font-mono flex items-center gap-1 transition-colors"
                  >
                    <Trash2 size={10} />
                    Xóa
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {showReplies && (
        <ReplyList commentId={comment._id} onReply={onReply} />
      )}
    </div>
  );
};

export const CommentsSection: React.FC<Props> = ({ targetType, targetId }) => {
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [page] = useState(1);

  const { data, isLoading } = useComments(targetType, targetId, page);
  const { mutate: postComment, isPending } = useCreateComment();

  const comments = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  const handleReply = (id: string, name: string) => {
    setReplyTo({ id, name });
  };

  const handlePost = () => {
    if (!newComment.trim()) return;
    postComment(
      {
        targetType,
        targetId,
        content: newComment,
        parentId: replyTo?.id,
      },
      {
        onSuccess: () => {
          setNewComment('');
          setReplyTo(null);
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <MessageSquare size={15} className="text-gray-500" />
        <h3 className="font-mono font-medium text-gray-300 text-sm">
          Thảo luận ({total})
        </h3>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          {replyTo && (
            <div className="text-[10px] text-violet-400 font-mono mb-1 flex items-center gap-1">
              <CornerDownRight size={10} />
              Đang trả lời <span className="font-medium">{replyTo.name}</span>
              <button
                onClick={() => setReplyTo(null)}
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
              if (e.key === 'Enter' && newComment.trim()) handlePost();
            }}
            placeholder="Thêm bình luận..."
            className="input-field text-xs"
          />
        </div>
        <Button
          size="sm"
          onClick={handlePost}
          disabled={!newComment.trim()}
          loading={isPending}
        >
          <Send size={12} />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 skeleton rounded-lg" />
          ))}
        </div>
      ) : comments.length > 0 ? (
        <div className="divide-y divide-white/[0.03]">
          {comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              onReply={handleReply}
            />
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-700 font-mono py-4 text-center">
          Chưa có bình luận. Hãy là người đầu tiên!
        </p>
      )}
    </div>
  );
};
