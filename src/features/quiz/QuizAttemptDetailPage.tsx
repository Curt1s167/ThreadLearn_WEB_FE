'use client';

import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertCircle, ArrowLeft, CheckCircle, Clock, FileQuestion, RotateCcw,
  ShieldCheck, Trophy, XCircle, Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { quizService } from '../../services';
import { Button, EmptyState, Skeleton } from '../../components/shared';
import {
  DemoDisplayTitle, DemoHeroWhite, DemoMuted, DemoPageRoot, DemoPill,
  DemoPrimaryButton, DemoWhitePanel, formatPercent,
} from '../ui-reskin/demo-ui';

const formatDuration = (seconds?: number) => {
  if (seconds == null || !Number.isFinite(seconds)) return 'Chưa ghi nhận';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
};

const formatDateTime = (value?: string) => value
  ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : 'Chưa ghi nhận';

const formatShortId = (value?: string) => value?.slice(-6).toUpperCase() ?? 'N/A';

const answerState = (status: 'correct' | 'incorrect' | 'unanswered') => {
  if (status === 'correct') return { label: 'Đúng', className: 'bg-emerald-100 text-emerald-800', icon: <CheckCircle size={15} /> };
  if (status === 'incorrect') return { label: 'Sai', className: 'bg-rose-100 text-rose-800', icon: <XCircle size={15} /> };
  return { label: 'Chưa trả lời', className: 'bg-amber-100 text-amber-800', icon: <AlertCircle size={15} /> };
};

export const QuizAttemptDetailPage: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const router = useRouter();
  const { data: attempt, isLoading, isError } = useQuery({
    queryKey: ['quiz-attempt', attemptId],
    queryFn: () => quizService.getAttemptById(attemptId!),
    enabled: Boolean(attemptId),
  });

  useEffect(() => {
    if (isError) toast.error('Không thể tải kết quả quiz. Vui lòng thử lại.');
  }, [isError]);

  if (isLoading) return <DemoPageRoot><Skeleton className="h-40 rounded-lg" /><Skeleton className="h-56 rounded-lg" /></DemoPageRoot>;
  if (isError) return (
    <EmptyState icon={<AlertCircle size={36} />} title="Không thể tải kết quả" description="Vui lòng thử lại sau vài giây."
      action={<div className="flex gap-3"><Button variant="outline" onClick={() => router.push('/quiz/history')}><ArrowLeft size={14} />Lịch sử quiz</Button><Button onClick={() => router.refresh()}><RotateCcw size={14} />Thử lại</Button></div>} />
  );
  if (!attempt) return <EmptyState icon={<Trophy size={36} />} title="Không tìm thấy lượt làm bài" description="Lượt làm bài này không còn tồn tại hoặc bạn không có quyền xem." />;

  const questions = attempt.questions ?? [];
  const completedAt = attempt.completedAt ?? attempt.createdAt;
  const passingScore = attempt.passingScorePercent ?? 80;
  const passed = attempt.passed;
  const statusTone = passed ? 'lime' : 'pink';
  const correct = attempt.correctCount ?? questions.filter((question) => question.answerStatus === 'correct').length;
  const incorrect = attempt.incorrectCount ?? questions.filter((question) => question.answerStatus === 'incorrect').length;
  const unanswered = attempt.unansweredCount ?? questions.filter((question) => question.answerStatus === 'unanswered').length;

  return (
    <DemoPageRoot>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <DemoHeroWhite>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <DemoPill tone={statusTone}>{passed ? 'Đạt' : 'Chưa đạt'}</DemoPill>
              <button type="button" onClick={() => router.push('/quiz/history')} className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-black/55 transition hover:border-black/20 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"><ArrowLeft size={12} />Lịch sử quiz</button>
            </div>
            <DemoDisplayTitle>Kết quả lượt làm bài #{formatShortId(attempt._id)}</DemoDisplayTitle>
            <DemoMuted>Quiz #{formatShortId(attempt.quizId)} · Hoàn thành {formatDateTime(completedAt)}. {passed ? 'Bạn đã đạt ngưỡng điểm yêu cầu.' : 'Bạn chưa đạt ngưỡng điểm yêu cầu.'}</DemoMuted>
          </DemoHeroWhite>

          <DemoWhitePanel>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 px-5 py-4">
              <div><p className="text-xs font-medium uppercase tracking-[0.14em] text-black/45">Chi tiết câu trả lời</p><p className="mt-1 text-sm text-black/55">Đáp án đã chọn, đáp án đúng và giải thích được cố định theo lượt làm bài.</p></div>
              <span className="rounded-full bg-black/[0.04] px-3 py-1 text-xs font-medium text-black/55">{questions.length} câu</span>
            </div>
            {attempt.reviewUnavailable ? (
              <div className="p-8 text-center"><FileQuestion className="mx-auto text-black/25" size={32} /><p className="mt-3 text-sm text-black/55">Lượt làm bài cũ không còn snapshot để hiển thị chi tiết.</p></div>
            ) : questions.map((question, index) => {
              const state = answerState(question.answerStatus);
              return <div key={`${question.sourceQuestionId}-${index}`} className="border-b border-black/10 p-5 last:border-b-0">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs text-black/45">Câu {index + 1}</p><p className="mt-1 text-base font-semibold text-ink">{question.questionText}</p></div><span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${state.className}`}>{state.icon}{state.label}</span></div>
                <div className="mt-4 space-y-2">{question.options.map((option, optionIndex) => {
                  const selected = option.optionId === question.selectedOptionId;
                  const correctOption = option.optionId === question.correctOptionId;
                  return <div key={option.optionId} className={`flex gap-3 rounded-lg border px-3 py-2 text-sm ${correctOption ? 'border-emerald-300 bg-emerald-50' : selected ? 'border-rose-300 bg-rose-50' : 'border-black/10 bg-white'}`}><span className="font-semibold text-black/50">{String.fromCharCode(65 + optionIndex)}</span><span className="flex-1 text-ink">{option.text}</span>{selected && <span className="text-xs font-medium text-black/55">Bạn chọn</span>}{correctOption && <span className="text-xs font-semibold text-emerald-700">Đáp án đúng</span>}</div>;
                })}</div>
                {question.explanation && <p className="mt-3 rounded-lg bg-black/[0.035] px-3 py-2 text-sm text-black/65"><span className="font-semibold text-ink">Giải thích: </span>{question.explanation}</p>}
              </div>;
            })}
          </DemoWhitePanel>
        </div>

        <aside className="space-y-4">
          <div className={`rounded-lg p-6 ${passed ? 'bg-[#d9f99d]' : 'bg-[#fecaca]'}`}>{passed ? <CheckCircle size={24} /> : <XCircle size={24} className="text-[#7f1d1d]" />}<p className="mt-5 text-4xl font-semibold text-ink">{formatPercent(attempt.score)}</p><p className="mt-2 text-sm text-black/65">Ngưỡng đạt {passingScore}%</p>{attempt.isTimeout && <p className="mt-4 rounded-lg bg-white/50 px-3 py-2 text-xs font-medium text-black/70">Bài làm đã hết thời gian và được chấm theo đáp án đã lưu.</p>}</div>
          <div className="rounded-lg border border-black/10 bg-white p-5"><p className="text-sm font-semibold text-ink">Tổng quan đáp án</p><div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs"><div className="rounded-lg bg-emerald-50 p-2 text-emerald-800"><b className="block text-base">{correct}</b>Đúng</div><div className="rounded-lg bg-rose-50 p-2 text-rose-800"><b className="block text-base">{incorrect}</b>Sai</div><div className="rounded-lg bg-amber-50 p-2 text-amber-800"><b className="block text-base">{unanswered}</b>Bỏ trống</div></div></div>
          <div className="rounded-lg border border-black/10 bg-white p-5"><div className="flex items-center gap-3"><Clock size={18} className="text-black/50" /><div><p className="text-xs text-black/45">Thời lượng</p><p className="text-sm font-semibold text-ink">{formatDuration(attempt.durationSeconds ?? attempt.timeTaken)}</p></div></div><div className="mt-4 flex items-center gap-3 border-t border-black/10 pt-4"><Zap size={18} className="text-black/50" /><div><p className="text-xs text-black/45">Trạng thái cộng XP</p><p className="text-sm font-semibold text-ink">{attempt.rewardStatus === 'awarded' ? `Đã cộng ${attempt.xpRewarded ?? 0} XP` : 'Không đủ điều kiện cộng XP'}</p></div></div><div className="mt-4 flex items-center gap-3 border-t border-black/10 pt-4"><ShieldCheck size={18} className="text-black/50" /><div><p className="text-xs text-black/45">Trạng thái chấm điểm</p><p className="text-sm font-semibold text-ink">{attempt.gradingStatus === 'graded' ? 'Đã chấm điểm' : 'Chưa chấm điểm'}</p></div></div></div>
          <div className="rounded-lg border border-black/10 bg-white p-5"><p className="text-sm font-semibold text-ink">Mốc thời gian</p><div className="mt-4 space-y-3 text-sm text-black/60"><div><p className="text-xs text-black/40">Bắt đầu</p><p className="font-medium text-black/70">{formatDateTime(attempt.startedAt)}</p></div><div><p className="text-xs text-black/40">Hoàn thành</p><p className="font-medium text-black/70">{formatDateTime(completedAt)}</p></div><div><p className="text-xs text-black/40">Trạng thái hoàn thành</p><p className="font-medium text-black/70">{attempt.completionStatus === 'completed' ? 'Đã hoàn thành' : 'Chưa hoàn thành'}</p></div></div></div>
          <DemoPrimaryButton className="w-full justify-center" onClick={() => router.push('/quiz/history')}><ArrowLeft size={15} />Quay lại lịch sử</DemoPrimaryButton>
        </aside>
      </div>
    </DemoPageRoot>
  );
};
