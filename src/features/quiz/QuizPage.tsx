'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, CheckCircle, ChevronRight, Clock, XCircle, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { quizService } from '../../services';
import { Badge, Button, Card, EmptyState, Skeleton } from '../../components/shared';

const getHttpStatus = (error: unknown) =>
  (error as { response?: { status?: number } })?.response?.status;

export const QuizPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [startTime] = useState(new Date().toISOString());
  const [result, setResult] = useState<{ score: number; passed: boolean; xpRewarded: number } | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const autoSubmittedRef = useRef(false);

  const {
    data: quiz,
    error,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['quiz', lessonId],
    queryFn: () => quizService.getByLesson(lessonId!),
    enabled: !!lessonId,
  });

  const isQuizMissing = isError && getHttpStatus(error) === 404;

  const { mutate: submit, isPending } = useMutation({
    mutationFn: () => quizService.submit({
      quizId: quiz!._id,
      answers,
      startTime,
    }),
    onSuccess: (data) => {
      setResult({
        score: data.score,
        passed: data.passed,
        xpRewarded: data.xpRewarded,
      });
      queryClient.invalidateQueries({ queryKey: ['quiz-attempts-me'] });
      queryClient.invalidateQueries({ queryKey: ['gamification-stats'] });
    },
    onError: () => toast.error('Failed to submit quiz'),
  });

  const timeLimit = quiz?.timeLimitSeconds ?? quiz?.timeLimit;
  const hasTimeLimit = typeof timeLimit === 'number' && Number.isFinite(timeLimit) && timeLimit > 0;

  useEffect(() => {
    if (!hasTimeLimit) {
      setRemainingSeconds(null);
      return;
    }

    setRemainingSeconds(timeLimit);
    autoSubmittedRef.current = false;
  }, [hasTimeLimit, timeLimit, quiz?._id]);

  useEffect(() => {
    if (!hasTimeLimit || result) return;

    const startedAt = new Date(startTime).getTime();
    const tick = () => {
      const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
      const nextRemaining = Math.max(0, timeLimit - elapsedSeconds);
      setRemainingSeconds(nextRemaining);

      if (nextRemaining === 0 && quiz && !autoSubmittedRef.current && !isPending) {
        autoSubmittedRef.current = true;
        toast.warning('Time is up. Submitting your quiz now.');
        submit();
      }
    };

    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [hasTimeLimit, isPending, quiz, result, startTime, submit, timeLimit]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 max-w-2xl mx-auto">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-36 rounded-xl" count={3} />
      </div>
    );
  }

  if (isQuizMissing) {
    return (
      <EmptyState
        icon={<AlertCircle size={36} />}
        title="No quiz found"
        description="This lesson does not have an associated quiz."
        action={(
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft size={14} />
            Back
          </Button>
        )}
      />
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={<AlertCircle size={36} />}
        title="Could not load quiz"
        description="Please try again in a moment"
      />
    );
  }

  if (!quiz) {
    return (
      <EmptyState
        icon={<AlertCircle size={36} />}
        title="No quiz found"
        description="This lesson does not have a quiz yet"
        action={(
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft size={14} />
            Back
          </Button>
        )}
      />
    );
  }

  if (result) {
    const scoreWidth = Math.min(100, Math.max(0, result.score));

    return (
      <Card className={`flex flex-col items-center justify-center gap-5 max-w-md mx-auto p-6 animate-slide-in ${
        result.passed ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-rose-500/25 bg-rose-500/5'
      }`}>
        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center border ${
          result.passed ? 'bg-emerald-500/10 border-emerald-500/25' : 'bg-rose-500/10 border-rose-500/25'
        }`}>
          {result.passed
            ? <CheckCircle size={36} className="text-emerald-400" />
            : <XCircle size={36} className="text-rose-400" />}
        </div>
        <div className="text-center w-full">
          <h2 className="font-mono font-bold text-2xl text-gray-100">
            {result.passed ? 'Quiz passed!' : 'Attempt submitted'}
          </h2>
          <p className="text-gray-400 font-mono text-sm mt-1">
            Score: <span className={result.passed ? 'text-emerald-400' : 'text-rose-400'}>
              {result.score.toFixed(0)}%
            </span>
          </p>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden mt-4">
            <div
              className={`h-full rounded-full transition-all duration-200 ${
                result.passed ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
              style={{ width: `${scoreWidth}%` }}
            />
          </div>
        </div>
        {result.xpRewarded > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-accent-500/20 bg-accent-500/10 px-3 py-2">
            <Zap size={14} className="text-accent-400" />
            <span className="text-sm font-mono text-accent-300">+{result.xpRewarded} XP earned</span>
          </div>
        )}
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft size={13} />
            Back to lesson
          </Button>
          <Button onClick={() => router.push('/quiz/history')}>
            View history
          </Button>
        </div>
      </Card>
    );
  }

  const totalQuestions = quiz.questions.length;
  const answeredCount = Object.keys(answers).length;
  const answeredProgress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const allAnswered = totalQuestions > 0 && quiz.questions.every((q) => answers[q._id] !== undefined);
  const displayRemainingSeconds = remainingSeconds ?? timeLimit ?? null;
  const isTimeWarning = typeof displayRemainingSeconds === 'number' && displayRemainingSeconds <= 60;
  const isTimedOut = displayRemainingSeconds === 0;
  const formatRemainingTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="btn-ghost outline-none focus-visible:ring-2 focus-visible:ring-accent-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
        >
          <ArrowLeft size={14} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-mono font-bold text-xl text-gray-100 truncate">{quiz.title}</h1>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 font-mono">
            {timeLimit ? <span className="flex items-center gap-1"><Clock size={11} />{Math.floor(timeLimit / 60)} min</span> : null}
            <span className="flex items-center gap-1"><Zap size={11} />{quiz.xpReward ?? 0} XP</span>
            <span>{totalQuestions} questions</span>
          </div>
        </div>
        {hasTimeLimit && typeof displayRemainingSeconds === 'number' ? (
          <div className={`shrink-0 rounded-lg border px-3 py-2 text-right ${
            isTimeWarning
              ? 'border-amber-500/30 bg-amber-500/10'
              : 'border-white/[0.06] bg-white/[0.03]'
          }`}>
            <div className={`flex items-center gap-1.5 font-mono text-sm tabular-nums ${
              isTimeWarning ? 'text-amber-300' : 'text-gray-300'
            }`}>
              <Clock size={14} />
              {formatRemainingTime(displayRemainingSeconds)}
            </div>
            <p className="text-[10px] text-gray-600 font-mono mt-0.5">
              remaining
            </p>
          </div>
        ) : null}
        <Badge color="purple">{answeredCount}/{totalQuestions}</Badge>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-surface p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-gray-400">Progress</span>
          <span className="text-xs font-mono text-gray-500">{answeredProgress.toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent-600 to-accent-400 rounded-full transition-all duration-200"
            style={{ width: `${answeredProgress}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {quiz.questions.map((question, questionIndex) => (
          <Card key={question._id} className={`p-4 transition-colors duration-200 ${
            answers[question._id] !== undefined ? 'border-accent-500/20' : ''
          }`}>
            <p className="text-sm font-mono text-gray-200 mb-3">
              <span className="text-gray-500 mr-2">{questionIndex + 1}.</span>
              {question.questionText}
            </p>
            <div className="flex flex-col gap-2">
              {question.options.map((option, optionIndex) => (
                <button
                  key={optionIndex}
                  aria-pressed={answers[question._id] === optionIndex}
                  onClick={() => setAnswers((prev) => ({ ...prev, [question._id]: optionIndex }))}
                  className={`text-left p-3 rounded-lg border text-sm font-mono transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas ${
                    answers[question._id] === optionIndex
                      ? 'bg-accent-500/10 border-accent-500/40 text-accent-300 shadow-glow-sm'
                      : 'border-white/[0.06] text-gray-400 hover:border-white/20 hover:text-gray-200 hover:bg-white/[0.03]'
                  }`}
                >
                  <span className="text-gray-500 mr-2">{String.fromCharCode(65 + optionIndex)}.</span>
                  {option}
                </button>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <div className="flex justify-end pb-6">
        <Button onClick={() => submit()} disabled={!allAnswered || isTimedOut} loading={isPending} size="lg">
          {isTimedOut ? 'Submitting...' : 'Submit answers'}
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
};
