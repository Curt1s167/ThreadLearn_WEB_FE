'use client';

import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, CheckCircle, Clock, Hash, Trophy, XCircle, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { quizService } from '../../services';
import { Badge, Button, Card, EmptyState, Skeleton } from '../../components/shared';

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
      <div className="flex flex-col gap-4 max-w-2xl mx-auto">
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
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
    <div className="flex flex-col gap-5 animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/quiz/history')} className="btn-ghost">
          <ArrowLeft size={14} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-mono font-bold text-xl text-gray-100 truncate">
            Quiz attempt #{attempt._id.slice(-6)}
          </h1>
          <p className="text-xs text-gray-600 font-mono mt-1">
            Quiz #{attempt.quizId.slice(-6)}
          </p>
        </div>
        <Badge color={attempt.passed ? 'green' : 'red'}>
          {attempt.passed ? 'PASSED' : 'FAILED'}
        </Badge>
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
            attempt.passed ? 'bg-emerald-500/10' : 'bg-rose-500/10'
          }`}>
            {attempt.passed
              ? <CheckCircle size={24} className="text-emerald-400" />
              : <XCircle size={24} className="text-rose-400" />}
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-600 font-mono">Score</p>
            <p className={`text-3xl font-mono font-bold ${attempt.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
              {attempt.score.toFixed(0)}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600 font-mono">Passing score</p>
            <p className="text-sm font-mono text-gray-300">{attempt.passingScorePercent ?? 80}%</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 flex items-center gap-3">
          <Clock size={16} className="text-sky-400" />
          <div>
            <p className="text-xs text-gray-600 font-mono">Duration</p>
            <p className="text-sm font-mono font-semibold text-gray-100">{formatDuration(duration)}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <Zap size={16} className="text-violet-400" />
          <div>
            <p className="text-xs text-gray-600 font-mono">XP rewarded</p>
            <p className="text-sm font-mono font-semibold text-gray-100">{attempt.xpRewarded ?? 0} XP</p>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="font-mono font-semibold text-gray-200 text-sm">Submitted answers</h2>
          <span className="text-xs text-gray-600 font-mono">
            {completedAt ? new Date(completedAt).toLocaleString() : 'No completion date'}
          </span>
        </div>
        {answers.length > 0 ? (
          <div className="divide-y divide-white/[0.04]">
            {answers.map((answer, index) => (
              <div key={`${answer.questionId}-${index}`} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs text-gray-600 font-mono">Question</p>
                  <p className="text-sm text-gray-300 font-mono truncate">{answer.questionId}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-sm font-mono text-gray-200">
                  <Hash size={13} className="text-gray-600" />
                  {String.fromCharCode(65 + answer.selectedOption)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600 font-mono">No answers were recorded for this attempt.</p>
        )}
      </Card>
    </div>
  );
};
