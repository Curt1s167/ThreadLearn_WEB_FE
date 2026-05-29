'use client';

import React from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useBookmarkCheck, useToggleBookmark } from '../../hooks/useBookmarks';
import type { BookmarkTargetType } from '../../types';

interface Props {
  targetType: BookmarkTargetType;
  targetId: string;
  title: string;
  thumbnailUrl?: string;
  className?: string;
}

export const BookmarkButton: React.FC<Props> = ({
  targetType,
  targetId,
  title,
  thumbnailUrl,
  className = '',
}) => {
  const { data } = useBookmarkCheck(targetType, targetId);
  const { mutate: toggle, isPending } = useToggleBookmark();

  const isBookmarked = data?.data?.bookmarked ?? false;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    toggle({ targetType, targetId, title, thumbnailUrl });
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`p-1.5 rounded-lg transition-all disabled:opacity-50 ${
        isBookmarked
          ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
          : 'text-gray-600 hover:text-gray-300 hover:bg-white/5'
      } ${className}`}
      title={isBookmarked ? 'Xóa bookmark' : 'Lưu bookmark'}
    >
      {isBookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
    </button>
  );
};
