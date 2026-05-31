import React from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { bookmarkService } from '../../services/bookmark.service';
import { useToggleBookmark } from '../../hooks/useBookmarks';
import type { BookmarkTargetType } from '../../types';

interface Props {
  targetType:    BookmarkTargetType;
  targetId:      string;
  title:         string;
  thumbnailUrl?: string;
  /** Visual variant — `card` for floating on a thumbnail, `inline` for list rows. */
  variant?: 'card' | 'inline';
}

/**
 * Reusable BookmarkButton — used on CourseCard, LessonItem and LessonPage header.
 * - Fetches initial state via /bookmarks/check
 * - Toggles via /bookmarks/toggle with optimistic UI
 * - Does NOT navigate or unmount — purely a visual toggle.
 */
export const BookmarkButton: React.FC<Props> = ({
  targetType, targetId, title, thumbnailUrl, variant = 'inline',
}) => {
  const { data, isLoading } = useQuery({
    queryKey: ['bookmarks', 'check', targetType, targetId],
    queryFn:  () => bookmarkService.check(targetType, targetId),
    enabled:  !!targetId,
    staleTime: 30_000,
  });

  const { mutate: toggle, isPending } = useToggleBookmark();

  const bookmarked = data?.data?.bookmarked ?? false;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    toggle({ targetType, targetId, title, thumbnailUrl });
  };

  const baseClass =
    variant === 'card'
      ? 'absolute top-2 right-2 p-1.5 rounded-lg bg-black/40 backdrop-blur hover:bg-black/60 transition-colors'
      : 'p-1.5 rounded-lg text-gray-600 hover:text-violet-400 hover:bg-white/5 transition-colors';

  const tooltip = bookmarked ? 'Đã lưu — nhấn để bỏ lưu' : 'Lưu lại';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading || isPending}
      aria-pressed={bookmarked}
      title={tooltip}
      className={`${baseClass} disabled:opacity-50`}
    >
      {bookmarked
        ? <BookmarkCheck size={14} className="text-violet-400 fill-violet-400/30" />
        : <Bookmark      size={14} />}
    </button>
  );
};
