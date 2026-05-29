'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { commentService } from '../services/comment.service';
import type { CommentTargetType } from '../types';

export function useComments(
  targetType: CommentTargetType,
  targetId: string,
  page = 1
) {
  return useQuery({
    queryKey: ['comments', targetType, targetId, page],
    queryFn: () => commentService.getComments(targetType, targetId, page),
    enabled: !!targetId,
  });
}

export function useReplies(commentId: string) {
  return useQuery({
    queryKey: ['replies', commentId],
    queryFn: () => commentService.getReplies(commentId),
    enabled: !!commentId,
  });
}

export function useCreateComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: commentService.createComment,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({
        queryKey: ['comments', vars.targetType, vars.targetId],
      });
      if (vars.parentId) {
        qc.invalidateQueries({ queryKey: ['replies', vars.parentId] });
      }
      toast.success('Bình luận đã được đăng');
    },
    onError: () => toast.error('Không thể đăng bình luận'),
  });
}

export function useUpdateComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      commentService.updateComment(id, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments'] });
      qc.invalidateQueries({ queryKey: ['replies'] });
      toast.success('Bình luận đã được cập nhật');
    },
    onError: () => toast.error('Không thể cập nhật bình luận'),
  });
}

export function useDeleteComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: commentService.deleteComment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments'] });
      qc.invalidateQueries({ queryKey: ['replies'] });
      toast.success('Đã xóa bình luận');
    },
    onError: () => toast.error('Không thể xóa bình luận'),
  });
}
