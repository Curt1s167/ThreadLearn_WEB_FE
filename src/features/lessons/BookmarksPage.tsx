'use client';

import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Bookmark as BookmarkIcon, BookOpen, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { bookmarksService } from '../../services';
import { Card, EmptyState, Skeleton } from '../../components/shared';
import type { Bookmark, PaginationMeta } from '../../types';

type BookmarksQueryData = {
  data: Bookmark[];
  meta?: PaginationMeta;
};

export const BookmarksPage: React.FC = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: bookmarksPage,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: bookmarksService.getAll,
  });
  const bookmarks = bookmarksPage?.data ?? [];

  useEffect(() => {
    if (isError) toast.error('Failed to load bookmarks');
  }, [isError]);

  const { mutate: toggleBookmark } = useMutation({
    mutationFn: (lessonId: string) => {
      const bookmark = bookmarks?.find((bm) => bm.targetId === lessonId);
      return bookmarksService.toggle(lessonId, bookmark?.title);
    },
    onMutate: async (lessonId) => {
      await queryClient.cancelQueries({ queryKey: ['bookmarks'] });
      const previous = queryClient.getQueryData<BookmarksQueryData>(['bookmarks']);

      queryClient.setQueryData<BookmarksQueryData>(['bookmarks'], (current) => {
        if (!current) return current;
        const nextData = current.data.filter((bookmark) => bookmark.targetId !== lessonId);
        return {
          ...current,
          data: nextData,
          meta: current.meta
            ? { ...current.meta, total: Math.max(0, current.meta.total - 1) }
            : current.meta,
        };
      });

      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      toast.success('Bookmark removed');
    },
    onError: (_error, _lessonId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['bookmarks'], context.previous);
      }
      toast.error('Failed to remove bookmark');
    },
  });

  return (
    <div className="flex flex-col gap-5 animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-2">
        <BookmarkIcon size={18} className="text-violet-400" />
        <h1 className="font-mono font-bold text-2xl text-ink">Bookmarks</h1>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : bookmarks.length > 0 ? (
        <div className="flex flex-col gap-2">
          {bookmarks.map((bm) => (
            <Card
              key={bm._id}
              className="p-3 flex items-center gap-3 hover:border-violet-500/20 transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                <BookOpen size={14} className="text-violet-400" />
              </div>
              <div
                role="button"
                tabIndex={0}
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => router.push(`/lessons/${bm.targetId}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    router.push(`/lessons/${bm.targetId}`);
                  }
                }}
              >
                <p className="text-sm text-ink font-mono truncate hover:text-violet-300 transition-colors">
                  {bm.title || `Lesson #${bm.targetId.slice(-6)}`}
                </p>
                <p className="text-xs text-ink-faint font-mono">
                  Saved {new Date(bm.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => toggleBookmark(bm.targetId)}
                className="p-2 text-ink-faint hover:text-rose-400 hover:bg-rose-500/5 rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-violet-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f]"
                title="Remove bookmark"
              >
                <Trash2 size={14} />
              </button>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<BookmarkIcon size={36} />}
          title="No bookmarks yet"
          description="Bookmark lessons to find them quickly later"
        />
      )}
    </div>
  );
};
