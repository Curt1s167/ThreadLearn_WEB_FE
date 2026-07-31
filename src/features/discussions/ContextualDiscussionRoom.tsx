'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, CheckCircle2, Code2, CornerDownRight, FilePlus2, Flag, Lock, MessageSquare, Send, ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, Button } from '../../components/shared';
import { codeExecutionService, codeShareService, discussionService, notesService } from '../../services';
import { subscribeRealtimeSocket } from '../../hooks/useSocket';
import type { CodeExecutionResult, CodeShare, Comment, DiscussionModerationReport } from '../../types';

type TargetType = 'COURSE' | 'LESSON';
type RootPostType = Exclude<NonNullable<Comment['postType']>, 'CODE_SOLUTION'>;
type Props = { targetType: TargetType; targetId: string; lessonId?: string; exerciseId?: string; onApplyCode?: (share: CodeShare) => void };

const postLabels: Record<RootPostType, string> = {
  GENERAL: 'Thảo luận chung', QUESTION: 'Câu hỏi', CODE_HELP: 'Cần hỗ trợ code',
  CODE_REVIEW: 'Xin review code', EXPLANATION_REQUEST: 'Cần giải thích',
};
const questionTypes = new Set<RootPostType>(['QUESTION', 'CODE_HELP', 'CODE_REVIEW', 'EXPLANATION_REQUEST']);
const roomKey = (targetType: TargetType, targetId: string) => ['discussion', targetType, targetId];

function CodeSharePreview({ codeShareId, lessonId, onApplyCode }: { codeShareId: string; lessonId?: string; onApplyCode?: (share: CodeShare) => void }) {
  const { data: share, isLoading } = useQuery({ queryKey: ['code-share', codeShareId], queryFn: () => codeShareService.get(codeShareId) });
  const [expanded, setExpanded] = useState(false);
  const { mutate: saveNote, isPending } = useMutation({
    mutationFn: (targetLessonId: string) => notesService.createFromCodeShare({ codeShareId, lessonId: targetLessonId }),
    onSuccess: () => toast.success('Đã lưu lời giải vào ghi chú.'),
    onError: () => toast.error('Không thể lưu lời giải vào ghi chú.'),
  });
  if (isLoading) return <div className="mt-3 h-24 rounded-lg skeleton" />;
  if (!share) return <p className="mt-3 text-xs text-rose-600">Đoạn code không còn khả dụng.</p>;
  const canUseCode = !share.isCodeLocked && Boolean(share.sourceCode);
  const noteLessonId = lessonId ?? share.lessonId;
  const output = [share.stdout, share.stderr, share.compileOutput].filter(Boolean).join('\n');
  return <div className="mt-3 overflow-hidden rounded-lg border border-black/10 bg-[#111827] text-white">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2"><span className="inline-flex items-center gap-1.5 font-mono text-xs text-[#d9f99d]"><Code2 size={13} />{share.language}</span><span className="text-xs text-white/55">Đã chạy: {share.status}</span></div>
    {share.lesson ? <p className="border-b border-white/10 px-3 py-2 text-xs text-white/60">Bài học: {share.lesson.title}{share.exerciseId ? ` · ${share.exerciseId}` : ''}</p> : null}
    {share.isOutdated ? <p className="border-b border-amber-300/25 bg-amber-300/10 px-3 py-2 text-xs text-amber-100">Lời giải thuộc phiên bản bài học cũ. Hãy xem diff kỹ trước khi dùng.</p> : null}
    {canUseCode ? <><pre className={`overflow-x-auto p-3 font-mono text-xs leading-5 text-[#e5e7eb] ${expanded ? '' : 'max-h-40'}`}>{share.sourceCode}</pre>{output ? <pre className="border-t border-white/10 px-3 py-2 font-mono text-[11px] leading-5 text-white/60">{output}</pre> : null}</> : <p className="flex items-center gap-2 p-3 text-sm text-white/75"><Lock size={14} /> Hãy tự chạy bài tập ít nhất một lần để mở lời giải cộng đồng.</p>}
    <div className="flex flex-wrap gap-2 border-t border-white/10 p-2"><button type="button" onClick={() => setExpanded((value) => !value)} disabled={!canUseCode} className="min-h-9 rounded-md px-2 text-xs text-white/70 hover:bg-white/10 disabled:opacity-40">{expanded ? 'Thu gọn' : 'Xem toàn bộ'}</button>{canUseCode && onApplyCode ? <button type="button" onClick={() => onApplyCode(share)} className="min-h-9 rounded-md bg-[#d9f99d] px-3 text-xs font-semibold text-black hover:bg-[#bef264]">So sánh & áp dụng</button> : null}{canUseCode && noteLessonId ? <button type="button" onClick={() => saveNote(noteLessonId)} disabled={isPending} className="inline-flex min-h-9 items-center gap-1 rounded-md px-2 text-xs text-white/75 hover:bg-white/10 disabled:opacity-50"><FilePlus2 size={13} /> Lưu note</button> : null}</div>
  </div>;
}

function ReplyComposer({ comment, lessonId, onDone }: { comment: Comment; lessonId?: string; onDone: () => void }) {
  const [content, setContent] = useState(''); const [attachCode, setAttachCode] = useState(false); const [executionId, setExecutionId] = useState('');
  const { data: history } = useQuery({ queryKey: ['code-execution-history', 'reply', lessonId, comment.exerciseId], queryFn: () => codeExecutionService.history(1, 10, lessonId, comment.exerciseId), enabled: attachCode });
  const { mutate: submit, isPending } = useMutation({ mutationFn: async () => {
    const codeShareId = attachCode ? (await codeShareService.createFromExecution({ sourceExecutionId: executionId, targetType: comment.targetType ?? 'LESSON', targetId: comment.targetId ?? comment.lessonId! }))._id : undefined;
    return discussionService.reply(comment._id, { content, codeShareId });
  }, onSuccess: () => { setContent(''); setExecutionId(''); setAttachCode(false); onDone(); toast.success('Đã gửi phản hồi.'); }, onError: () => toast.error('Không thể gửi phản hồi.') });
  return <div className="mt-3 rounded-lg border border-black/10 bg-black/[0.025] p-3"><textarea value={content} onChange={(event) => setContent(event.target.value)} maxLength={2000} rows={2} placeholder="Giải thích cách tiếp cận hoặc gửi lời giải..." className="w-full resize-y bg-transparent text-sm outline-none" />{attachCode ? <select value={executionId} onChange={(event) => setExecutionId(event.target.value)} className="mt-2 min-h-10 w-full rounded-md border border-black/15 bg-white px-2 text-xs"><option value="">Chọn lần chạy code của bạn</option>{(history?.items ?? []).map((execution: CodeExecutionResult) => <option key={execution._id} value={execution._id}>{execution.language} · {execution.status.description}</option>)}</select> : null}<div className="mt-2 flex flex-wrap items-center justify-between gap-2"><label className="inline-flex items-center gap-2 text-xs text-black/60"><input type="checkbox" checked={attachCode} onChange={(event) => setAttachCode(event.target.checked)} /> Đính kèm lần chạy đã xác thực</label><Button size="sm" onClick={() => submit()} disabled={isPending || !content.trim() || (attachCode && !executionId)} loading={isPending}><Send size={12} /> Gửi</Button></div></div>;
}

type ReportReason = 'SPAM' | 'ABUSE' | 'INCORRECT' | 'SPOILER' | 'UNSAFE_CODE' | 'OTHER';

export function ReportDialog({ open, pending, onClose, onSubmit }: {
  open: boolean;
  pending: boolean;
  onClose: () => void;
  onSubmit: (value: { reason: ReportReason; details?: string }) => void;
}) {
  const [reason, setReason] = useState<ReportReason>('OTHER');
  const [details, setDetails] = useState('');
  const dialogRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    dialogRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button, select, textarea'))
        .filter((element) => !element.hasAttribute('disabled'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);
  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <button type="button" aria-label="Đóng báo cáo" className="absolute inset-0 bg-black/40" onClick={onClose} />
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="discussion-report-title" tabIndex={-1} className="relative w-full max-w-md rounded-xl bg-white p-5 shadow-2xl outline-none">
      <h3 id="discussion-report-title" className="font-semibold text-ink">Báo cáo nội dung</h3>
      <label className="mt-4 block text-sm font-medium text-ink">Lý do
        <select value={reason} onChange={(event) => setReason(event.target.value as ReportReason)} className="mt-1 min-h-10 w-full rounded-md border border-black/15 bg-white px-2">
          <option value="SPAM">Spam</option><option value="ABUSE">Quấy rối</option><option value="INCORRECT">Sai kiến thức</option><option value="SPOILER">Tiết lộ lời giải</option><option value="UNSAFE_CODE">Code không an toàn</option><option value="OTHER">Khác</option>
        </select>
      </label>
      <label className="mt-3 block text-sm font-medium text-ink">Chi tiết (không bắt buộc)
        <textarea value={details} maxLength={1000} rows={4} onChange={(event) => setDetails(event.target.value)} className="mt-1 w-full resize-y rounded-md border border-black/15 p-2" />
      </label>
      <div className="mt-4 flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Hủy</Button><Button loading={pending} disabled={pending} onClick={() => onSubmit({ reason, details: details.trim() || undefined })}>Gửi báo cáo</Button></div>
    </div>
  </div>;
}

function ThreadCard({ comment, lessonId, onApplyCode }: { comment: Comment; lessonId?: string; onApplyCode?: (share: CodeShare) => void }) {
  const queryClient = useQueryClient(); const [open, setOpen] = useState(false); const [reportOpen, setReportOpen] = useState(false);
  const { data: replies = [] } = useQuery({ queryKey: ['discussion-replies', comment._id], queryFn: () => discussionService.replies(comment._id), enabled: open });
  const refresh = () => { queryClient.invalidateQueries({ queryKey: ['discussion'] }); queryClient.invalidateQueries({ queryKey: ['discussion-replies', comment._id] }); };
  const { mutate: helpful } = useMutation({ mutationFn: () => discussionService.toggleHelpful(comment._id), onSuccess: refresh, onError: () => toast.error('Không thể cập nhật đánh giá.') });
  const { mutate: report, isPending: isReporting } = useMutation({ mutationFn: (payload: { reason: ReportReason; details?: string }) => discussionService.report(comment._id, payload), onSuccess: () => { setReportOpen(false); toast.success('Đã gửi báo cáo để kiểm duyệt.'); }, onError: () => toast.error('Bạn đã báo cáo hoặc không thể báo cáo nội dung này.') });
  const { mutate: accept } = useMutation({ mutationFn: (replyId: string) => discussionService.accept(comment._id, replyId), onSuccess: refresh });
  const { mutate: close } = useMutation({ mutationFn: () => discussionService.close(comment._id), onSuccess: refresh });
  const { mutate: reopen } = useMutation({ mutationFn: () => discussionService.reopen(comment._id), onSuccess: refresh });
  const { mutate: verify } = useMutation({ mutationFn: () => discussionService.verify(comment._id), onSuccess: refresh, onError: () => toast.error('Chỉ giảng viên khóa học hoặc quản trị viên được xác minh.') });
  const owner = Boolean(comment.isOwner); const canAccept = Boolean(comment.capabilities?.canAccept); const canVerify = Boolean(comment.capabilities?.canVerify); const isQuestion = questionTypes.has((comment.postType ?? 'GENERAL') as RootPostType); const authorName = comment.isAnonymous ? (comment.authorLabel || 'Học viên ẩn danh') : comment.user?.name || 'Thành viên ThreadLearn';
  return <>
    <article className="rounded-lg border border-black/10 bg-white p-4">
      <div className="flex gap-3">
        <Avatar src={comment.isAnonymous ? undefined : comment.user?.avatarUrl} name={authorName} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-sm text-ink">{authorName}</strong>
            <span className="rounded-full bg-black/[0.05] px-2 py-0.5 text-[11px] text-black/55">{postLabels[(comment.postType ?? 'GENERAL') as RootPostType] ?? 'Lời giải code'}</span>
            {comment.questionStatus ? <span className="rounded-full bg-black/[0.05] px-2 py-0.5 text-[11px]">{comment.questionStatus}</span> : null}
            {comment.instructorVerifiedAt ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] text-emerald-800"><BadgeCheck size={11} /> Instructor verified</span> : null}
          </div>
          <p className="mt-1 text-xs text-black/40">{new Date(comment.createdAt).toLocaleString()}</p>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink-muted">{comment.content}</p>
          {comment.learningContext ? <dl className="mt-3 grid gap-2 rounded-md bg-amber-50 p-3 text-xs text-ink-muted sm:grid-cols-3"><div><dt className="font-semibold">Mong đợi</dt><dd>{comment.learningContext.expectedResult}</dd></div><div><dt className="font-semibold">Thực tế</dt><dd>{comment.learningContext.actualResult}</dd></div><div><dt className="font-semibold">Đã thử</dt><dd>{comment.learningContext.tried}</dd></div></dl> : null}
          {comment.codeShareId ? <CodeSharePreview codeShareId={comment.codeShareId} lessonId={lessonId} onApplyCode={onApplyCode} /> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => setOpen((value) => !value)} className="inline-flex min-h-9 items-center gap-1 rounded-md px-2 text-xs text-black/60 hover:bg-black/[0.05]"><CornerDownRight size={13} /> Phản hồi ({comment.replyCount ?? replies.length})</button>
            <button type="button" onClick={() => helpful()} className="inline-flex min-h-9 items-center gap-1 rounded-md px-2 text-xs text-black/60 hover:bg-black/[0.05]"><ThumbsUp size={13} /> Hữu ích ({comment.helpfulCount ?? 0})</button>
            {!owner ? <button type="button" onClick={() => setReportOpen(true)} className="inline-flex min-h-9 items-center gap-1 rounded-md px-2 text-xs text-black/60 hover:bg-black/[0.05]"><Flag size={13} /> Báo cáo</button> : null}
            {canAccept && isQuestion && comment.questionStatus === 'OPEN' ? <button type="button" onClick={() => close()} className="min-h-9 rounded-md px-2 text-xs text-black/60 hover:bg-black/[0.05]">Đóng câu hỏi</button> : null}
            {canAccept && isQuestion && comment.questionStatus === 'CLOSED' ? <button type="button" onClick={() => reopen()} className="min-h-9 rounded-md px-2 text-xs text-black/60 hover:bg-black/[0.05]">Mở lại câu hỏi</button> : null}
            {canVerify && !comment.instructorVerifiedAt ? <button type="button" onClick={() => verify()} className="min-h-9 rounded-md px-2 text-xs text-emerald-700 hover:bg-emerald-50">Xác minh</button> : null}
          </div>
          {open ? <ReplyComposer comment={comment} lessonId={lessonId} onDone={refresh} /> : null}
          {open && replies.length ? <div className="mt-3 space-y-3 border-l-2 border-black/10 pl-3">{replies.map((reply) => <div key={reply._id} className="rounded-md bg-black/[0.025] p-3"><div className="flex flex-wrap items-center gap-2 text-xs"><strong>{reply.isAnonymous ? (reply.authorLabel || 'Học viên ẩn danh') : reply.user?.name || 'Thành viên'}</strong>{comment.acceptedReplyId === reply._id ? <span className="inline-flex items-center gap-1 rounded-full bg-[#d9f99d] px-2 py-0.5"><CheckCircle2 size={11} /> Lời giải được chọn</span> : null}</div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink-muted">{reply.content}</p>{reply.codeShareId ? <CodeSharePreview codeShareId={reply.codeShareId} lessonId={lessonId} onApplyCode={onApplyCode} /> : null}{canAccept && isQuestion && comment.questionStatus === 'OPEN' && reply.postType === 'CODE_SOLUTION' ? <button type="button" onClick={() => accept(reply._id)} className="mt-2 min-h-9 rounded-md border border-black/15 px-3 text-xs font-medium hover:bg-[#d9f99d]">Chọn lời giải này</button> : null}</div>)}</div> : null}
        </div>
      </div>
    </article>
    <ReportDialog open={reportOpen} pending={isReporting} onClose={() => setReportOpen(false)} onSubmit={(payload) => report(payload)} />
  </>;
}

export function ModerationQueuePanel({ targetType, targetId }: { targetType?: TargetType; targetId?: string }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<'OPEN' | 'RESOLVED'>('OPEN');
  const [selected, setSelected] = useState<DiscussionModerationReport | null>(null);
  const [reason, setReason] = useState('');
  const moderationDialogRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!selected) return;
    moderationDialogRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setSelected(null); return; }
      if (event.key !== 'Tab' || !moderationDialogRef.current) return;
      const focusable = Array.from(moderationDialogRef.current.querySelectorAll<HTMLElement>('button, textarea'))
        .filter((element) => !element.hasAttribute('disabled'));
      if (!focusable.length) return;
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selected]);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['discussion-moderation', targetType, targetId, status],
    queryFn: () => discussionService.moderationQueue({
      page: 1, limit: 20, status,
      ...(targetType === 'COURSE' && targetId ? { courseId: targetId } : {}),
      ...(targetType === 'LESSON' && targetId ? { lessonId: targetId } : {}),
    }),
  });
  const { mutate: moderate, isPending } = useMutation({
    mutationFn: ({ report, detail }: { report: DiscussionModerationReport; detail: string }) =>
      discussionService.moderate(report.comment._id, {
        action: report.comment.status === 'hidden' ? 'RESTORE' : 'HIDE',
        reason: detail,
      }),
    onSuccess: () => {
      setSelected(null); setReason('');
      queryClient.invalidateQueries({ queryKey: ['discussion-moderation'] });
      if (targetType && targetId) queryClient.invalidateQueries({ queryKey: roomKey(targetType, targetId) });
      toast.success('Đã cập nhật kiểm duyệt.');
    },
    onError: () => toast.error('Không thể cập nhật kiểm duyệt.'),
  });
  return <section className="rounded-lg border border-black/10 bg-white p-4" aria-labelledby="moderation-queue-title">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 id="moderation-queue-title" className="font-semibold text-ink">Hàng đợi kiểm duyệt</h3><label className="text-xs text-black/60">Trạng thái <select className="ml-2 min-h-9 rounded-md border border-black/10 bg-white px-2" value={status} onChange={(event) => setStatus(event.target.value as 'OPEN' | 'RESOLVED')}><option value="OPEN">Chờ xử lý</option><option value="RESOLVED">Đã xử lý</option></select></label></div>
    {isLoading ? <div className="mt-3 h-20 skeleton rounded-lg" /> : isError ? <p className="mt-3 text-sm text-rose-700">{(error as { response?: { status?: number } })?.response?.status === 403 ? 'Bạn không có quyền xem hàng đợi kiểm duyệt.' : 'Không thể tải hàng đợi.'}</p> : data?.items.length ? <div className="mt-3 space-y-2">{data.items.map((report) => <article key={report.id} className="rounded-md border border-black/10 p-3"><div className="flex flex-wrap items-start justify-between gap-2"><div><strong className="text-sm">{report.reason}</strong><p className="mt-1 text-sm text-black/60">{report.details || report.comment.content}</p></div><button type="button" onClick={() => { setSelected(report); setReason(''); }} className="min-h-9 rounded-md border border-black/10 px-3 text-xs">{report.comment.status === 'hidden' ? 'Khôi phục' : 'Ẩn nội dung'}</button></div></article>)}</div> : <p className="mt-3 text-sm text-black/50">Không có báo cáo ở trạng thái này.</p>}
    {selected ? <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><button type="button" aria-label="Đóng hộp thoại kiểm duyệt" className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} /><div ref={moderationDialogRef} role="dialog" aria-modal="true" aria-labelledby="moderation-dialog-title" tabIndex={-1} className="relative w-full max-w-md rounded-xl bg-white p-5 shadow-2xl outline-none"><h4 id="moderation-dialog-title" className="font-semibold text-ink">Xác nhận kiểm duyệt</h4><label className="mt-4 block text-sm font-medium">Lý do xử lý<textarea autoFocus value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} rows={4} className="mt-1 w-full rounded-md border border-black/15 p-2 font-normal" /></label><div className="mt-4 flex justify-end gap-2"><Button variant="outline" onClick={() => setSelected(null)}>Hủy</Button><Button loading={isPending} disabled={isPending || reason.trim().length < 3} onClick={() => moderate({ report: selected, detail: reason.trim() })}>Xác nhận</Button></div></div></div> : null}
  </section>;
}

export const ContextualDiscussionRoom: React.FC<Props> = ({ targetType, targetId, lessonId, exerciseId, onApplyCode }) => {
  const queryClient = useQueryClient(); const [content, setContent] = useState(''); const [postType, setPostType] = useState<RootPostType>('GENERAL'); const [anonymous, setAnonymous] = useState(false); const [attachCode, setAttachCode] = useState(false); const [executionId, setExecutionId] = useState(''); const [filterType, setFilterType] = useState<RootPostType | ''>(''); const [filterStatus, setFilterStatus] = useState<NonNullable<Comment['questionStatus']> | ''>(''); const [expectedResult, setExpectedResult] = useState(''); const [actualResult, setActualResult] = useState(''); const [tried, setTried] = useState(''); const [page, setPage] = useState(1); const processedEvents = useRef(new Set<string>());
  const { data, isLoading, isError } = useQuery({ queryKey: [...roomKey(targetType, targetId), filterType, filterStatus, page], queryFn: () => discussionService.list(targetType, targetId, page, 20, { ...(filterType ? { postType: filterType } : {}), ...(filterStatus ? { questionStatus: filterStatus } : {}) }), enabled: Boolean(targetId) });
  const { data: history } = useQuery({ queryKey: ['code-execution-history', 'root', lessonId, exerciseId], queryFn: () => codeExecutionService.history(1, 10, lessonId, exerciseId), enabled: attachCode });
  useEffect(() => setPage(1), [filterStatus, filterType, targetId, targetType]);
  useEffect(() => {
    let cleanupSocket = () => {};
    const unsubscribe = subscribeRealtimeSocket((socket) => {
      cleanupSocket();
      if (!socket) return;
      const update = (event: { eventId?: string; targetType: TargetType; targetId: string }) => {
        if (event.eventId && processedEvents.current.has(event.eventId)) return;
        if (event.eventId) processedEvents.current.add(event.eventId);
        if (processedEvents.current.size > 500) processedEvents.current.clear();
        if (event.targetType === targetType && event.targetId === targetId) {
          queryClient.invalidateQueries({ queryKey: roomKey(targetType, targetId) });
          queryClient.invalidateQueries({ queryKey: ['discussion-replies'] });
        }
      };
      const join = () => {
        socket.emit('discussion:join', { targetType, targetId });
        queryClient.invalidateQueries({ queryKey: roomKey(targetType, targetId) });
        queryClient.invalidateQueries({ queryKey: ['discussion-replies'] });
      };
      socket.on('discussion:update', update);
      socket.on('connect', join);
      join();
      cleanupSocket = () => {
        socket.off('discussion:update', update);
        socket.off('connect', join);
        socket.emit('discussion:leave', { targetType, targetId });
      };
    });
    return () => { cleanupSocket(); unsubscribe(); };
  }, [queryClient, targetId, targetType]);
  const { mutate: create, isPending } = useMutation({ mutationFn: async () => { const codeShareId = attachCode ? (await codeShareService.createFromExecution({ sourceExecutionId: executionId, targetType, targetId }))._id : undefined; return discussionService.create({ targetType, targetId, content, postType, isAnonymous: anonymous, codeShareId, learningContext: postType === 'CODE_HELP' ? { expectedResult, actualResult, tried } : undefined }); }, onSuccess: () => { setContent(''); setExpectedResult(''); setActualResult(''); setTried(''); setAttachCode(false); setExecutionId(''); queryClient.invalidateQueries({ queryKey: roomKey(targetType, targetId) }); toast.success('Đã đăng vào phòng thảo luận.'); }, onError: () => toast.error('Không thể đăng thảo luận. Hãy kiểm tra quyền và thông tin bài tập.') });
  const threads = useMemo(() => data?.items ?? [], [data]); const needsContext = postType === 'CODE_HELP';
  return <section className="space-y-4" aria-label="Phòng thảo luận theo ngữ cảnh"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><MessageSquare size={17} /><h2 className="font-semibold text-ink">Phòng thảo luận</h2></div><span className="text-xs text-black/45">{data?.meta?.total ?? threads.length} chủ đề</span></div><div className="flex flex-wrap gap-2"><select aria-label="Lọc loại thảo luận" value={filterType} onChange={(event) => setFilterType(event.target.value as RootPostType | '')} className="min-h-9 rounded-md border border-black/10 bg-white px-2 text-xs"><option value="">Tất cả loại</option>{Object.entries(postLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select aria-label="Lọc trạng thái" value={filterStatus} onChange={(event) => setFilterStatus(event.target.value as NonNullable<Comment['questionStatus']> | '')} className="min-h-9 rounded-md border border-black/10 bg-white px-2 text-xs"><option value="">Mọi trạng thái</option><option value="OPEN">Đang mở</option><option value="SOLVED">Đã giải</option><option value="CLOSED">Đã đóng</option></select></div><p className="text-sm leading-6 text-ink-faint">Trao đổi đúng bài học; lời giải code chỉ mở sau khi người học tự thử bài tập.</p>{needsContext ? <div className="grid gap-2 rounded-lg border border-amber-300/50 bg-amber-50 p-3 sm:grid-cols-3"><label className="text-xs font-medium text-ink">Kết quả mong đợi<textarea value={expectedResult} onChange={(event) => setExpectedResult(event.target.value)} rows={2} className="mt-1 w-full rounded border border-black/15 bg-white p-2 font-normal" /></label><label className="text-xs font-medium text-ink">Kết quả thực tế<textarea value={actualResult} onChange={(event) => setActualResult(event.target.value)} rows={2} className="mt-1 w-full rounded border border-black/15 bg-white p-2 font-normal" /></label><label className="text-xs font-medium text-ink">Bạn đã thử gì<textarea value={tried} onChange={(event) => setTried(event.target.value)} rows={2} className="mt-1 w-full rounded border border-black/15 bg-white p-2 font-normal" /></label></div> : null}<div className="rounded-lg border border-black/10 bg-black/[0.025] p-3"><div className="mb-2 flex flex-wrap gap-3"><label className="text-xs font-medium text-ink">Loại thảo luận<select value={postType} onChange={(event) => setPostType(event.target.value as RootPostType)} className="ml-2 min-h-10 rounded-md border border-black/15 bg-white px-2 text-xs">{Object.entries(postLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="inline-flex items-center gap-2 text-xs text-black/60"><input type="checkbox" checked={anonymous} disabled={attachCode} onChange={(event) => setAnonymous(event.target.checked)} /> Ẩn danh</label></div><label className="block text-xs font-medium text-ink">Nội dung thảo luận<textarea value={content} onChange={(event) => setContent(event.target.value)} maxLength={2000} rows={3} placeholder="Nêu rõ vấn đề, kiến thức hoặc kết quả mong đợi..." className="mt-1 w-full resize-y rounded-md border border-black/10 bg-white p-3 text-sm font-normal outline-none" /></label><label className="mt-2 inline-flex items-center gap-2 text-xs text-black/60"><input type="checkbox" checked={attachCode} onChange={(event) => { setAttachCode(event.target.checked); if (event.target.checked) setAnonymous(false); }} /> Đính kèm lần chạy code đã xác thực</label>{attachCode ? <label className="mt-2 block text-xs font-medium text-ink">Lần chạy code<select value={executionId} onChange={(event) => setExecutionId(event.target.value)} className="mt-1 min-h-10 w-full rounded-md border border-black/15 bg-white px-2 text-xs font-normal"><option value="">Chọn lần chạy code của bạn</option>{(history?.items ?? []).map((execution: CodeExecutionResult) => <option key={execution._id} value={execution._id}>{execution.language} · {execution.status.description}</option>)}</select></label> : null}<div className="mt-2 flex justify-end"><Button size="sm" onClick={() => create()} disabled={isPending || !content.trim() || (needsContext && (!expectedResult.trim() || !actualResult.trim() || !tried.trim())) || (attachCode && !executionId)} loading={isPending}><Send size={12} /> Đăng thảo luận</Button></div></div>{isLoading ? <div className="space-y-3"><div className="h-32 rounded-lg skeleton" /><div className="h-32 rounded-lg skeleton" /></div> : isError ? <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">Không thể tải phòng thảo luận.</p> : threads.length ? <div className="space-y-3">{threads.map((comment) => <ThreadCard key={comment._id} comment={comment} lessonId={lessonId} onApplyCode={onApplyCode} />)}</div> : <p className="rounded-lg border border-dashed border-black/15 p-5 text-center text-sm text-black/50">Chưa có chủ đề. Hãy mở đầu bằng một câu hỏi cụ thể.</p>}{(data?.meta?.totalPages ?? 1) > 1 ? <nav aria-label="Phân trang thảo luận" className="flex items-center justify-center gap-3"><button type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="min-h-10 rounded-md border border-black/10 px-3 text-sm disabled:opacity-40">Trang trước</button><span className="text-xs text-black/50">Trang {page}/{data?.meta?.totalPages}</span><button type="button" disabled={page >= (data?.meta?.totalPages ?? 1)} onClick={() => setPage((value) => value + 1)} className="min-h-10 rounded-md border border-black/10 px-3 text-sm disabled:opacity-40">Trang sau</button></nav> : null}</section>;
};
