'use client';

import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Hash,
  Trophy,
  XCircle,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { quizService } from '../../services';
import { Button, EmptyState, Skeleton } from '../../components/shared';
import {
  DemoDisplayTitle,
  DemoHeroWhite,
  DemoMuted,
  DemoPageRoot,
  DemoPill,
  DemoWhitePanel,
} from '../ui-reskin/demo-ui';

const getAttemptDuration = (startedAt?: string, completedAt?: string, timeTaken?: number) => {
  if (timeTaken != null) return timeTaken;
  if (!startedAt || !completedAt) return 0;
  return Math.max(0, Math.floor((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000));
};

const formatDuration = (seconds: number) => `${Math.floor(seconds / 60)}m ${seconds % 60}s`;

const getAnswerRows = (answers: { questionId: string; selectedOption: number }[] | Record<string, number>) => {
  if (Array.isArray(answers)) return answers;
  return Object.entries(answers).map(([questionId, selectedOption]) => ({ questionId, selectedOption }));
};

/**
 * PR6 — attempt detail visual polish (demo language).
 * Data still from quizService.getAttemptById only.
 */
export const QuizAttemptDetailPage: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const router = useRouter();

  const {
    data: attempt,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['quiz-attempt', attemptId],
    queryFn: () => quizService.getAttemptById(attemptId!),
    enabled: !!attemptId,
  });

  useEffect(() => {
    if (isError) {
      toast.error('Failed to load quiz attempt');
    }
  }, [isError]);

  if (isLoading) {
    return (
      <DemoPageRoot>
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-56 rounded-lg" />
      </DemoPageRoot>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={<AlertCircle size={36} />}
        title="Could not load attempt"
        description="Please try again in a moment"
        action={(
          <Button variant="outline" onClick={() => router.push('/quiz/history')}>
            <ArrowLeft size={14} />
            Back to history
          </Button>
        )}
      />
    );
  }

  if (!attempt) {
    return (
      <EmptyState
        icon={<Trophy size={36} />}
        title="Attempt not found"
        description="This quiz attempt is no longer available"
      />
    );
  }

  const completedAt = attempt.completedAt ?? attempt.createdAt;
  const duration = getAttemptDuration(attempt.startedAt, completedAt, attempt.timeTaken);
  const answers = getAnswerRows(attempt.answers);

  return (
    <DemoPageRoot>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <DemoHeroWhite>
            <div className="flex flex-wrap items-center gap-2">
              <DemoPill tone={attempt.passed ? 'lime' : 'pink'}>
                {attempt.passed ? 'Passed' : 'Failed'}
              </DemoPill>
              <button
                type="button"
                onClick={() => router.push('/quiz/history')}
                className="inline-flex items-center gap-1 text-xs text-black/50 hover:text-black"
              >
                <ArrowLeft size={12} />
                History
              </button>
            </div>
            <DemoDisplayTitle>
              Quiz attempt · {attempt._id.slice(-6).toUpperCase()}
            </DemoDisplayTitle>
            <DemoMuted>
              Quiz #{attempt.quizId.slice(-6)}
              {completedAt ? ` · ${new Date(completedAt).toLocaleString()}` : ''}
            </DemoMuted>
          </DemoHeroWhite>

          <DemoWhitePanel>
            <div className="border-b border-black/10 px-5 py-3 text-xs font-medium uppercase tracking-[0.14em] text-black/45">
              Submitted answers
            </div>
            {answers.length > 0 ? (
              answers.map((answer, index) => (
                <div
                  key={`${answer.questionId}-${index}`}
                  className="grid gap-2 border-b border-black/10 p-5 last:border-b-0 sm:grid-cols-[1fr_80px] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="text-xs text-black/45">Question {index + 1}</p>
                    <p className="truncate text-sm font-medium text-ink">{answer.questionId}</p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink">
                    <Hash size={13} className="text-black/40" />
                    {String.fromCharCode(65 + answer.selectedOption)}
                  </div>
                </div>
              ))
            ) : (
              <p className="p-5 text-sm text-black/55">No answers were recorded for this attempt.</p>
            )}
          </DemoWhitePanel>
        </div>

        <aside className="space-y-4">
          <div className={`rounded-lg p-6 ${attempt.passed ? 'bg-[#d9f99d]' : 'bg-[#fecaca]'}`}>
            {attempt.passed ? (
              <CheckCircle size={24} />
            ) : (
              <XCircle size={24} className="text-[#7f1d1d]" />
            )}
            <p className="mt-5 text-4xl font-semibold text-ink">{attempt.score.toFixed(0)}%</p>
            <p className="mt-2 text-sm text-black/65">
              Passing score {attempt.passingScorePercent ?? 80}%
            </p>
          </div>

          <div className="rounded-lg border border-black/10 bg-white p-5">
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-black/50" />
              <div>
                <p className="text-xs text-black/45">Duration</p>
                <p className="text-sm font-semibold text-ink">{formatDuration(duration)}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3 border-t border-black/10 pt-4">
              <Zap size={18} className="text-black/50" />
              <div>
                <p className="text-xs text-black/45">XP rewarded</p>
                <p className="text-sm font-semibold text-ink">{attempt.xpRewarded ?? 0} XP</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-black/10 bg-white p-5 text-sm text-black/60">
            <p className="font-semibold text-ink">API</p>
            <p className="mt-2">GET /quiz/attempts/:attemptId</p>
          </div>
        </aside>
      </div>
    </DemoPageRoot>
  );
};
