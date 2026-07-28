'use client';

import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowRight, Bookmark as BookmarkIcon, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { bookmarksService } from '../../services';
import { EmptyState, Skeleton } from '../../components/shared';
import type { Bookmark, PaginationMeta } from '../../types';
import {
  DemoDisplayTitle,
  DemoHeroWhite,
  DemoMuted,
  DemoPageRoot,
  DemoPill,
} from '../ui-reskin/demo-ui';

type BookmarksQueryData = {
  data: Bookmark[];
  meta?: PaginationMeta & { hasMore?: boolean };
};

/**
 * PR10 — bookmarks list mirrors DemoBookmarksPage card grid.
 * LOGIC LOCK: getAll, optimistic remove via toggle.
 */
export const BookmarksPage: React.FC = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [targetType, setTargetType] = useState<'ALL' | 'COURSE' | 'LESSON'>('ALL');

  const {
    data: bookmarksPage,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['bookmarks', targetType, page],
    queryFn: () => bookmarksService.getAll(
      page,
      20,
      targetType === 'ALL' ? undefined : targetType,
    ),
  });
  const bookmarks = bookmarksPage?.data ?? [];

  useEffect(() => {
    if (isError) toast.error('Failed to load bookmarks');
  }, [isError]);

  const { mutate: toggleBookmark } = useMutation({
    mutationFn: (bookmarkId: string) => bookmarksService.remove(bookmarkId),
    onMutate: async (bookmarkId) => {
      const pageKey = ['bookmarks', targetType, page] as const;
      await queryClient.cancelQueries({ queryKey: pageKey });
      const previous = queryClient.getQueryData<BookmarksQueryData>(pageKey);

      queryClient.setQueryData<BookmarksQueryData>(pageKey, (current) => {
        if (!current) return current;
        const nextData = current.data.filter((bookmark) => bookmark._id !== bookmarkId);
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
    onError: (_error, _bookmarkId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['bookmarks', targetType, page], context.previous);
      }
      toast.error('Failed to remove bookmark');
    },
  });

  useEffect(() => {
    if (!isLoading && !isError && page > 1 && bookmarks.length === 0) {
      setPage((current) => Math.max(1, current - 1));
    }
  }, [bookmarks.length, isError, isLoading, page]);

  return (
    <DemoPageRoot>
      <DemoHeroWhite>
        <DemoPill tone="blue">Bookmarks</DemoPill>
        <DemoDisplayTitle>Saved lessons for quick review.</DemoDisplayTitle>
        <DemoMuted>
          Jump back into bookmarked lessons. Data from the bookmark service — not demo fixtures.
        </DemoMuted>
      </DemoHeroWhite>

      <div className="flex flex-wrap gap-2">
        {(['ALL', 'LESSON', 'COURSE'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setTargetType(value);
              setPage(1);
            }}
            className={`rounded-full border px-4 py-2 text-sm ${
              targetType === value
                ? 'border-black bg-black text-white'
                : 'border-black/15 bg-white text-black/65'
            }`}
          >
            {value === 'ALL' ? 'All bookmarks' : `${value.toLowerCase()}s`}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={<BookmarkIcon size={36} />}
          title="Could not load bookmarks"
          description="Please try again in a moment"
        />
      ) : bookmarks.length > 0 ? (
        <>
        <div className="grid gap-4 md:grid-cols-2">
          {bookmarks.map((bm) => (
            <div
              key={bm._id}
              className="group rounded-lg border border-black/10 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => router.push(
                    bm.targetType === 'COURSE'
                      ? `/courses/${bm.targetId}`
                      : `/lessons/${bm.targetId}`,
                  )}
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-black/40">
                    Saved {new Date(bm.createdAt).toLocaleDateString()}
                  </p>
                  <h2 className="mt-3 text-xl font-semibold text-ink">
                    {bm.title || `Lesson #${bm.targetId.slice(-6)}`}
                  </h2>
                  <p className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-ink">
                    Open lesson <ArrowRight size={15} />
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => toggleBookmark(bm._id)}
                  className="rounded-lg p-2 text-black/35 transition hover:bg-rose-50 hover:text-rose-600"
                  title="Remove bookmark"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-center gap-2">
          {page > 1 ? <button type="button" onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-black/15 px-4 py-2 text-sm">Previous</button> : null}
          {bookmarksPage?.meta?.hasMore ? <button type="button" onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-black/15 px-4 py-2 text-sm">Next</button> : null}
        </div>
        </>
      ) : (
        <EmptyState
          icon={<BookmarkIcon size={36} />}
          title="No saved lessons"
          description="Bookmark a lesson to keep it here for quick review."
        />
      )}
    </DemoPageRoot>
  );
};
