'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, History } from 'lucide-react';
import { toast } from 'sonner';
import { quizService } from '../../services';
import {
  DemoDisplayTitle,
  DemoHeroWhite,
  DemoMuted,
  DemoPageRoot,
  DemoPill,
  DemoPrimaryButton,
  DemoWhitePanel,
  UI_PLACEHOLDERS,
  formatPercent,
} from '../ui-reskin/demo-ui';

const PAGE_SIZE = 8;

/**
 * Visual layout mirrors DemoQuizHistoryPage:
 * white hero (pink pill + display title) → simple white rows
 * [title | score | status pill | XP]
 * Data + links still from quizService.getMyAttempts / attempt detail routes.
 */
export const QuizHistoryPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const {
    data: historyPage,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['quiz-attempts-me', { page, limit: PAGE_SIZE }],
    queryFn: () => quizService.getMyAttemptsPage({ page, limit: PAGE_SIZE }),
  });

  const attempts = historyPage?.items ?? [];
  const meta = historyPage?.meta;
  const hasAttempts = attempts.length > 0;
  const totalPages = meta?.totalPages ?? 1;
  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;
  const rangeLabel = useMemo(() => {
    if (!meta || meta.total === 0) return 'No attempts';
    const start = (meta.page - 1) * meta.limit + 1;
    const end = Math.min(meta.page * meta.limit, meta.total);
    return `Showing ${start}-${end} of ${meta.total}`;
  }, [meta]);

  useEffect(() => {
    if (isError) {
      toast.error('Failed to load quiz history');
    }
  }, [isError]);

  useEffect(() => {
    if (meta?.totalPages && page > meta.totalPages) {
      setPage(meta.totalPages);
    }
  }, [meta?.totalPages, page]);

  return (
    <DemoPageRoot>
      <DemoHeroWhite>
        <DemoPill tone="pink">Quiz attempts</DemoPill>
        <DemoDisplayTitle>Attempt history from quiz-attempts module.</DemoDisplayTitle>
        <DemoMuted>
          Score, pass state, XP reward, and links to each attempt detail — from the real API.
        </DemoMuted>
      </DemoHeroWhite>

      {isLoading ? (
        <DemoWhitePanel>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-[72px] animate-pulse border-b border-black/10 bg-[#f7f4ee]/80 last:border-b-0"
            />
          ))}
        </DemoWhitePanel>
      ) : isError ? (
        <DemoWhitePanel className="p-8 text-center">
          <History className="mx-auto text-rose-500" size={32} />
          <h2 className="mt-4 text-xl font-semibold text-black">Could not load quiz history</h2>
          <p className="mt-2 text-sm text-black/55">Please try again in a moment.</p>
          <DemoPrimaryButton className="mt-5" onClick={() => refetch()}>
            Retry
          </DemoPrimaryButton>
        </DemoWhitePanel>
      ) : hasAttempts ? (
        <DemoWhitePanel>
          {attempts.map((attempt, index) => {
            const title = UI_PLACEHOLDERS.quizAttemptTitle(attempt.quizId);
            const xpLabel =
              attempt.xpRewarded != null
                ? `${attempt.xpRewarded > 0 ? '+' : ''}${attempt.xpRewarded} XP`
                : attempt.passed
                  ? '+XP'
                  : '+0 XP';
            const statusLabel = attempt.passed ? 'Passed' : 'Retry';

            return (
              <motion.div
                key={attempt._id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: Math.min(index * 0.03, 0.25) }}
              >
                <Link
                  href={`/quiz/attempts/${attempt._id}`}
                  className="grid gap-3 border-b border-black/10 p-5 last:border-b-0 transition-colors hover:bg-black/[0.02] sm:grid-cols-[1fr_100px_100px_100px] sm:items-center"
                >
                  <p className="font-medium text-black">{title}</p>
                  <p className="text-sm text-black/55">{formatPercent(attempt.score)}</p>
                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs ${
                      attempt.passed
                        ? 'bg-[#d9f99d] text-black'
                        : 'bg-[#fecaca] text-[#7f1d1d]'
                    }`}
                  >
                    {statusLabel}
                  </span>
                  <p className="text-sm font-medium text-black">{xpLabel}</p>
                </Link>
              </motion.div>
            );
          })}
          <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-black/55">
              {rangeLabel}
              {isFetching ? ' · Refreshing...' : ''}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={!canGoPrevious}
                className="inline-flex size-9 items-center justify-center rounded-full border border-black/15 text-black transition hover:bg-black/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous quiz attempt page"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="min-w-16 text-center text-sm font-medium text-black">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => current + 1)}
                disabled={!canGoNext}
                className="inline-flex size-9 items-center justify-center rounded-full border border-black/15 text-black transition hover:bg-black/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next quiz attempt page"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </DemoWhitePanel>
      ) : (
        <DemoWhitePanel className="p-8 text-center">
          <History className="mx-auto text-black/30" size={32} />
          <h2 className="mt-4 text-xl font-semibold text-black">No quiz attempts yet</h2>
          <p className="mt-2 text-sm text-black/55">
            Complete a quiz from a lesson to see history here.
          </p>
          <Link
            href="/courses"
            className="mt-5 inline-flex rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white"
          >
            Browse courses
          </Link>
        </DemoWhitePanel>
      )}
    </DemoPageRoot>
  );
};
