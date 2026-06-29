'use client';

import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, CheckCircle, XCircle, Zap, History } from 'lucide-react';
import { toast } from 'sonner';
import { quizService } from '../../services';
import { Card, Badge, Skeleton, EmptyState } from '../../components/shared';

export const QuizHistoryPage: React.FC = () => {
  const { data: attempts, isLoading, isError } = useQuery({
    queryKey: ['quiz-attempts-me'],
    queryFn: quizService.getMyAttempts,
  });

  useEffect(() => {
    if (isError) {
      toast.error('Failed to load quiz history');
    }
  }, [isError]);

  return (
    <div className="flex flex-col gap-5 animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-2">
        <History size={18} className="text-violet-400" />
        <h1 className="font-mono font-bold text-2xl text-gray-100">Quiz History</h1>
      </div>
      <p className="text-gray-600 font-mono text-sm -mt-3">
        Review your past quiz attempts and scores
      </p>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={<History size={36} />}
          title="Could not load quiz history"
          description="Please try again in a moment"
        />
      ) : attempts && attempts.length > 0 ? (
        <Card className="overflow-hidden divide-y divide-white/[0.04]">
          {attempts.map((attempt) => {
            const finishedAt = attempt.completedAt ?? attempt.createdAt;
            const duration = attempt.timeTaken ?? (
              attempt.startedAt && finishedAt
                ? Math.max(0, Math.floor((new Date(finishedAt).getTime() - new Date(attempt.startedAt).getTime()) / 1000))
                : 0
            );

            return (
              <div
                key={attempt._id}
                className="flex items-center gap-4 px-4 py-3 hover:bg-white/[0.02] transition-colors"
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    attempt.passed
                      ? 'bg-emerald-500/10'
                      : 'bg-rose-500/10'
                  }`}
                >
                  {attempt.passed ? (
                    <CheckCircle size={16} className="text-emerald-400" />
                  ) : (
                    <XCircle size={16} className="text-rose-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-200 font-mono font-medium truncate">
                      Quiz #{attempt.quizId.slice(-6)}
                    </p>
                    <Badge color={attempt.passed ? 'green' : 'red'}>
                      {attempt.passed ? 'PASSED' : 'FAILED'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-600 font-mono">
                    <span className="flex items-center gap-1">
                      <Zap size={10} />
                      {attempt.score.toFixed(0)}%
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {Math.floor(duration / 60)}m {duration % 60}s
                    </span>
                    <span>{finishedAt ? new Date(finishedAt).toLocaleDateString() : 'No date'}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p
                    className={`text-lg font-mono font-bold ${
                      attempt.passed ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {attempt.score.toFixed(0)}%
                  </p>
                </div>
              </div>
            );
          })}
        </Card>
      ) : (
        <EmptyState
          icon={<History size={36} />}
          title="No quiz attempts yet"
          description="Complete quizzes to see your history here"
        />
      )}
    </div>
  );
};
