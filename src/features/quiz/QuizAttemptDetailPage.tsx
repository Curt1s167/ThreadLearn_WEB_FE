'use client';

import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
  FileQuestion,
  Hash,
  RotateCcw,
  ShieldCheck,
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
  DemoPrimaryButton,
  DemoWhitePanel,
  formatPercent,
} from '../ui-reskin/demo-ui';

type AttemptAnswerRow = {
  questionId: string;
  selectedOption: number;
};

const getAttemptDuration = (startedAt?: string, completedAt?: string, timeTaken?: number) => {
  if (timeTaken != null) return timeTaken;
  if (!startedAt || !completedAt) return 0;
  return Math.max(0, Math.floor((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000));
};

const formatDuration = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0s';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
};

const formatDateTime = (value?: string) => {
  if (!value) return 'Chưa ghi nhận';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const formatShortId = (value?: string) => {
  if (!value) return 'Không rõ';
  return value.slice(-6).toUpperCase();
};

const formatSelectedOption = (selectedOption: number) => {
  if (!Number.isFinite(selectedOption) || selectedOption < 0) return 'Không rõ';
  return String.fromCharCode(65 + selectedOption);
};

const getAnswerRows = (answers: { questionId: string; selectedOption: number }[] | Record<string, number>) => {
  if (Array.isArray(answers)) return answers as AttemptAnswerRow[];
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
      toast.error('Không tải được kết quả quiz');
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
        title="Không tải được kết quả"
        description="Vui lòng thử lại sau vài giây."
        action={(
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="outline" onClick={() => router.push('/quiz/history')}>
              <ArrowLeft size={14} />
              Lịch sử quiz
            </Button>
            <Button onClick={() => router.refresh()}>
              <RotateCcw size={14} />
              Thử lại
            </Button>
          </div>
        )}
      />
    );
  }

  if (!attempt) {
    return (
      <EmptyState
        icon={<Trophy size={36} />}
        title="Không tìm thấy lượt làm bài"
        description="Lượt làm bài này không còn tồn tại hoặc bạn không có quyền xem."
      />
    );
  }

  const completedAt = attempt.completedAt ?? attempt.createdAt;
  const duration = getAttemptDuration(attempt.startedAt, completedAt, attempt.timeTaken);
  const answers = getAnswerRows(attempt.answers);
  const passed = attempt.passed;
  const score = formatPercent(attempt.score);
  const passingScore = attempt.passingScorePercent ?? 80;
  const xpRewarded = attempt.xpRewarded ?? 0;
  const statusTone = passed ? 'lime' : 'pink';
  const statusLabel = passed ? 'Đạt' : 'Chưa đạt';
  const resultMessage = passed
    ? 'Bạn đã vượt qua ngưỡng điểm yêu cầu của quiz này.'
    : 'Bạn chưa đạt ngưỡng điểm yêu cầu. Có thể ôn lại bài học rồi làm lại quiz.';

  return (
    <DemoPageRoot>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <DemoHeroWhite>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <DemoPill tone={statusTone}>
                {statusLabel}
              </DemoPill>
              <button
                type="button"
                onClick={() => router.push('/quiz/history')}
                className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-black/55 transition hover:border-black/20 hover:text-black"
              >
                <ArrowLeft size={12} />
                Lịch sử quiz
              </button>
            </div>
            <DemoDisplayTitle>
              Kết quả lượt làm bài #{formatShortId(attempt._id)}
            </DemoDisplayTitle>
            <DemoMuted className="max-w-3xl">
              Quiz #{formatShortId(attempt.quizId)} · Nộp lúc {formatDateTime(completedAt)}. {resultMessage}
            </DemoMuted>
          </DemoHeroWhite>

          <DemoWhitePanel>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 px-5 py-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-black/45">
                  Câu trả lời đã nộp
                </p>
                <p className="mt-1 text-sm text-black/55">
                  Xem lại các lựa chọn đã gửi trong lượt làm bài này.
                </p>
              </div>
              <span className="rounded-full bg-black/[0.04] px-3 py-1 text-xs font-medium text-black/55">
                {answers.length} câu
              </span>
            </div>
            {answers.length > 0 ? (
              answers.map((answer, index) => (
                <div
                  key={`${answer.questionId}-${index}`}
                  className="grid gap-3 border-b border-black/10 p-5 last:border-b-0 sm:grid-cols-[1fr_112px] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="text-xs text-black/45">Câu {index + 1}</p>
                    <p className="truncate text-sm font-medium text-ink" title={answer.questionId}>
                      {answer.questionId}
                    </p>
                  </div>
                  <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-black/[0.04] px-3 py-1.5 text-sm font-semibold text-ink">
                    <Hash size={13} className="text-black/40" />
                    Chọn {formatSelectedOption(answer.selectedOption)}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <FileQuestion className="mx-auto text-black/25" size={32} />
                <p className="mt-3 text-sm text-black/55">
                  Lượt làm bài này chưa ghi nhận câu trả lời nào.
                </p>
              </div>
            )}
          </DemoWhitePanel>
        </div>

        <aside className="space-y-4">
          <div className={`rounded-lg p-6 ${passed ? 'bg-[#d9f99d]' : 'bg-[#fecaca]'}`}>
            {passed ? (
              <CheckCircle size={24} />
            ) : (
              <XCircle size={24} className="text-[#7f1d1d]" />
            )}
            <p className="mt-5 text-4xl font-semibold text-ink">{score}</p>
            <p className="mt-2 text-sm text-black/65">
              Ngưỡng đạt {passingScore}%
            </p>
            {attempt.isTimeout ? (
              <p className="mt-4 rounded-lg bg-white/50 px-3 py-2 text-xs font-medium text-black/70">
                Bài làm được ghi nhận khi hết thời gian.
              </p>
            ) : null}
          </div>

          <div className="rounded-lg border border-black/10 bg-white p-5">
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-black/50" />
              <div>
                <p className="text-xs text-black/45">Thời lượng</p>
                <p className="text-sm font-semibold text-ink">{formatDuration(duration)}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3 border-t border-black/10 pt-4">
              <Zap size={18} className="text-black/50" />
              <div>
                <p className="text-xs text-black/45">XP nhận được</p>
                <p className="text-sm font-semibold text-ink">{xpRewarded} XP</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3 border-t border-black/10 pt-4">
              <ShieldCheck size={18} className="text-black/50" />
              <div>
                <p className="text-xs text-black/45">Trạng thái chấm điểm</p>
                <p className="text-sm font-semibold text-ink">
                  {passed ? 'Đã cộng thưởng nếu đủ điều kiện' : 'Không cộng XP'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-black/10 bg-white p-5">
            <p className="text-sm font-semibold text-ink">Mốc thời gian</p>
            <div className="mt-4 space-y-3 text-sm text-black/60">
              <div>
                <p className="text-xs text-black/40">Bắt đầu</p>
                <p className="font-medium text-black/70">{formatDateTime(attempt.startedAt)}</p>
              </div>
              <div>
                <p className="text-xs text-black/40">Hoàn thành</p>
                <p className="font-medium text-black/70">{formatDateTime(completedAt)}</p>
              </div>
            </div>
          </div>

          <DemoPrimaryButton className="w-full justify-center" onClick={() => router.push('/quiz/history')}>
            <ArrowLeft size={15} />
            Quay lại lịch sử
          </DemoPrimaryButton>

          <div className="rounded-lg border border-black/10 bg-white p-5 text-xs text-black/50">
            Kết quả được lưu sau khi hệ thống chấm điểm xong.
          </div>
        </aside>
      </div>
    </DemoPageRoot>
  );
};
