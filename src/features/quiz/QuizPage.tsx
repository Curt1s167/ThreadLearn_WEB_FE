'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  FileText,
  History,
  Trophy,
  XCircle,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { quizService } from '../../services';
import { Button, EmptyState, Skeleton } from '../../components/shared';
import {
  DemoPill,
  DemoPageRoot,
  DemoWhitePanel,
} from '../ui-reskin/demo-ui';

const getHttpStatus = (error: unknown) =>
  (error as { response?: { status?: number } })?.response?.status;

const formatRemainingTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${String(secs).padStart(2, '0')}`;
};

type QuizResultSummary = {
  attemptId?: string;
  score: number;
  passed: boolean;
  xpRewarded: number;
  passingScorePercent: number;
  isTimeout: boolean;
};

export const QuizPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<QuizResultSummary | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const autoSubmittedRef = useRef(false);
  const submissionKeyRef = useRef<string | null>(null);

  const {
    data: quiz,
    error,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['quiz', lessonId],
    queryFn: () => quizService.startSession(lessonId!),
    enabled: !!lessonId,
  });

  const isQuizMissing = isError && getHttpStatus(error) === 404;

  const { mutate: submit, isPending } = useMutation({
    mutationFn: () => {
      if (!submissionKeyRef.current) {
        submissionKeyRef.current = typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : quiz!.attemptSessionId;
      }
      return quizService.submitSession(quiz!.attemptSessionId, answers, submissionKeyRef.current);
    },
    onSuccess: (data) => {
      const attemptId = data.attempt.id ?? data.attempt._id;
      setResult({
        attemptId,
        score: data.score,
        passed: data.passed,
        xpRewarded: data.xpRewarded,
        passingScorePercent: data.passingScorePercent,
        isTimeout: data.isTimeout,
      });
      if (attemptId) {
        queryClient.setQueryData(['quiz-attempt', attemptId], data.attempt);
      }
      queryClient.invalidateQueries({ queryKey: ['quiz-attempts-me'] });
      queryClient.invalidateQueries({ queryKey: ['gamification-stats'] });
    },
    onError: () => toast.error('Failed to submit quiz'),
  });

  const startTime = quiz?.startedAt ?? new Date().toISOString();
  const timeLimit = quiz?.timeLimitSeconds ?? quiz?.timeLimit;
  const hasTimeLimit = typeof timeLimit === 'number' && Number.isFinite(timeLimit) && timeLimit > 0;

  useEffect(() => {
    if (!quiz) return;
    setAnswers(quiz.answers ?? {});
    submissionKeyRef.current = null;
  }, [quiz?.attemptSessionId]);

  useEffect(() => {
    if (!quiz || result || isPending) return;
    const timer = window.setTimeout(() => {
      void quizService.saveSessionAnswers(quiz.attemptSessionId, answers).catch(() => {
        // Autosave is best-effort; the next change or submit sends the full snapshot.
      });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [answers, isPending, quiz?.attemptSessionId, result]);

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
      <DemoPageRoot>
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Skeleton className="min-h-[420px] rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
        </div>
      </DemoPageRoot>
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

  const totalQuestions = quiz.questions.length;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = totalQuestions > 0 && quiz.questions.every((q) => answers[q._id] !== undefined);
  const displayRemainingSeconds = remainingSeconds ?? timeLimit ?? null;
  const isTimeWarning = typeof displayRemainingSeconds === 'number' && displayRemainingSeconds <= 60;
  const isTimedOut = displayRemainingSeconds === 0;

  // ── Result screen ─────────────────────────────────────────────────────────
  if (result) {
    const detailPath = result.attemptId ? `/quiz/attempts/${result.attemptId}` : null;

    return (
      <DemoPageRoot>
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="rounded-lg bg-white p-6 sm:p-8">
            <DemoPill tone={result.passed ? 'lime' : 'pink'}>
              {result.passed ? 'Đạt' : 'Chưa đạt'}
            </DemoPill>
            <h1 className="mt-5 text-4xl font-light tracking-tight text-ink">
              {result.passed ? 'Bạn đã vượt qua quiz' : 'Đã ghi nhận lượt làm bài'}
            </h1>
            <p className="mt-3 text-black/60">
              Điểm của bạn là{' '}
              <span className="font-semibold text-ink">{result.score.toFixed(0)}%</span>
              {` · Ngưỡng đạt ${result.passingScorePercent}%`}
              {result.xpRewarded > 0 ? ` · +${result.xpRewarded} XP` : null}
              {result.isTimeout ? ' · Nộp khi hết giờ' : null}
            </p>
            <div className="mt-8 h-2 overflow-hidden rounded-full bg-black/5">
              <div
                className={`h-full rounded-full ${result.passed ? 'bg-[#d9f99d]' : 'bg-[#fecaca]'}`}
                style={{ width: `${Math.min(100, Math.max(0, result.score))}%` }}
              />
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 rounded-full border border-black/10 px-5 py-3 text-sm font-medium text-ink hover:bg-black/[0.03]"
              >
                <ArrowLeft size={16} />
                Quay lại bài học
              </button>
              {detailPath ? (
                <button
                  type="button"
                  onClick={() => router.push(detailPath)}
                  className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-medium text-white"
                >
                  Xem chi tiết
                  <ArrowRight size={16} />
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => router.push('/quiz/history')}
                className="inline-flex items-center gap-2 rounded-full border border-black/10 px-5 py-3 text-sm font-medium text-ink hover:bg-black/[0.03]"
              >
                <History size={16} />
                Lịch sử quiz
              </button>
            </div>
          </section>

          <aside className="space-y-4">
            <div className={`rounded-lg p-6 ${result.passed ? 'bg-[#d9f99d]' : 'bg-[#fecaca]'}`}>
              {result.passed ? (
                <CheckCircle size={24} className="text-black" />
              ) : (
                <XCircle size={24} className="text-[#7f1d1d]" />
              )}
              <p className="mt-5 text-4xl font-semibold text-ink">
                {result.score.toFixed(0)}%
              </p>
              <p className="mt-2 text-sm text-black/65">
                {result.passed
                  ? `Đạt yêu cầu.${result.xpRewarded > 0 ? ` +${result.xpRewarded} XP đã được ghi nhận.` : ''}`
                  : 'Chưa đạt yêu cầu. Hãy ôn lại bài học rồi thử lại.'}
              </p>
            </div>
            <div className="rounded-lg border border-black/10 bg-white p-5">
              <h2 className="font-semibold text-ink">Sau khi nộp bài</h2>
              <div className="mt-4 space-y-3 text-sm text-black/65">
                <p className="flex items-center gap-2">
                  <FileText size={14} className="text-black/40" />
                  Lượt làm bài đã được lưu vào lịch sử.
                </p>
                <p className="flex items-center gap-2">
                  <Zap size={14} className="text-black/40" />
                  XP và xếp hạng sẽ cập nhật khi đủ điều kiện.
                </p>
                <p className="flex items-center gap-2">
                  <Clock size={14} className="text-black/40" />
                  Thời gian làm bài được giữ trong trang chi tiết.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </DemoPageRoot>
    );
  }

  // ── Take quiz (DemoQuizPage 2-col) ────────────────────────────────────────
  return (
    <DemoPageRoot>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-lg bg-white p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <DemoPill tone="lime">Quiz by lesson</DemoPill>
              <h1 className="mt-5 text-4xl font-light tracking-tight text-ink">{quiz.title}</h1>
              <p className="mt-3 max-w-2xl text-black/60">
                {quiz.description ||
                  'Submit answers to the quiz-attempts API. Score and XP come from the backend.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-black/60 hover:text-black"
            >
              <ArrowLeft size={13} />
              Back
            </button>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 text-xs text-black/55">
            {hasTimeLimit && timeLimit ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-[#f7f4ee] px-3 py-1">
                <Clock size={12} />
                {Math.floor(timeLimit / 60)} min limit
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-[#f7f4ee] px-3 py-1">
              <Zap size={12} />
              {quiz.xpReward ?? 0} XP
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-[#f7f4ee] px-3 py-1">
              {totalQuestions} questions · {answeredCount} answered
            </span>
          </div>

          <div className="mt-7 space-y-5">
            {quiz.questions.map((question, index) => (
              <div key={question._id} className="rounded-lg border border-black/10 p-5">
                <p className="font-semibold text-ink">
                  {index + 1}. {question.questionText}
                </p>
                <div className="mt-4 grid gap-2">
                  {question.options.map((option, optionIndex) => {
                    const selected = answers[question._id] === optionIndex;
                    return (
                      <button
                        key={optionIndex}
                        type="button"
                        aria-pressed={selected}
                        disabled={isTimedOut || isPending}
                        onClick={() =>
                          setAnswers((prev) => ({ ...prev, [question._id]: optionIndex }))
                        }
                        className={`rounded-lg border px-4 py-3 text-left text-sm transition outline-none focus-visible:ring-2 focus-visible:ring-black/25 ${
                          selected
                            ? 'border-black bg-black text-white'
                            : 'border-black/10 bg-[#f7f4ee] hover:border-black/30'
                        } disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        <span className="mr-2 opacity-60">
                          {String.fromCharCode(65 + optionIndex)}.
                        </span>
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => submit()}
            disabled={!allAnswered || isTimedOut || isPending}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 font-medium text-white transition hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending || isTimedOut ? 'Submitting…' : 'Submit attempt'}
            <ArrowRight size={17} />
          </button>
        </section>

        <aside className="space-y-4">
          <div
            className={`rounded-lg p-6 ${
              isTimeWarning && hasTimeLimit ? 'bg-amber-100' : 'bg-[#d9f99d]'
            }`}
          >
            <Trophy size={24} />
            {hasTimeLimit && typeof displayRemainingSeconds === 'number' ? (
              <>
                <p
                  className={`mt-5 text-4xl font-semibold tabular-nums ${
                    isTimeWarning ? 'text-amber-900' : 'text-ink'
                  }`}
                >
                  {formatRemainingTime(displayRemainingSeconds)}
                </p>
                <p className="mt-2 text-sm text-black/65">
                  {isTimedOut
                    ? 'Time is up. Submitting your quiz…'
                    : isTimeWarning
                      ? 'Under 60s remaining — finish soon.'
                      : 'Countdown from timeLimitSeconds (auto-submit at 0).'}
                </p>
              </>
            ) : (
              <>
                <p className="mt-5 text-4xl font-semibold text-ink">
                  {answeredCount}/{totalQuestions}
                </p>
                <p className="mt-2 text-sm text-black/65">
                  Score appears after submit.
                </p>
              </>
            )}
          </div>

          <div className="rounded-lg border border-black/10 bg-white p-5">
            <h2 className="font-semibold text-ink">Before you submit</h2>
            <div className="mt-4 space-y-3 text-sm text-black/65">
              <p>GET /quiz/lesson/:lessonId (no answers leaked)</p>
              <p>POST /quiz/submit with questionId answers</p>
              <p>Optional startTime for timeout check</p>
              <p>Pass → quiz.passed → XP / leaderboard events</p>
            </div>
          </div>

          <DemoWhitePanel className="p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-black/40">Progress</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/5">
              <div
                className="h-full rounded-full bg-black transition-all"
                style={{
                  width: `${totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0}%`,
                }}
              />
            </div>
            <p className="mt-2 text-sm text-black/55">
              {answeredCount} of {totalQuestions} answered
            </p>
          </DemoWhitePanel>
        </aside>
      </div>
    </DemoPageRoot>
  );
};
