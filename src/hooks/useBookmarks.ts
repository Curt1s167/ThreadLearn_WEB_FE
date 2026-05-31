
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { bookmarkService } from '../services/bookmark.service';
import type { BookmarkTargetType } from '../types';

export function useBookmarkCheck(
  targetType: BookmarkTargetType,
  targetId: string
) {
  return useQuery({
    queryKey: ['bookmarks', 'check', targetType, targetId],
    queryFn: () => bookmarkService.check(targetType, targetId),
    enabled: !!targetId,
  });
}

export function useToggleBookmark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bookmarkService.toggle,
    onSuccess: (res, vars) => {
      qc.invalidateQueries({
        queryKey: ['bookmarks', 'check', vars.targetType, vars.targetId],
      });
      qc.invalidateQueries({ queryKey: ['bookmarks', 'me'] });
      const bookmarked = res.data?.bookmarked;
      toast.success(bookmarked ? 'Đã lưu bookmark' : 'Đã xóa bookmark');
    },
    onError: () => toast.error('Không thể thực hiện bookmark'),
  });
}

export function useMyBookmarks(targetType?: BookmarkTargetType) {
  return useQuery({
    queryKey: ['bookmarks', 'me', targetType],
    queryFn: () => bookmarkService.getMyBookmarks({ targetType }),
  });
}

