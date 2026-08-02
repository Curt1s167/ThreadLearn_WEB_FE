'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Brain, CheckCircle2, Clock, Play, Send, Terminal } from 'lucide-react';
import { toast } from 'sonner';
import { codeAssignmentService } from '../../services';
import { useAuthStore } from '../../store';
import type { AssignmentRunResult, CodeSubmission } from '../../types';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const dateText = (value?: string | null) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'No deadline';
const verdictTone = (verdict?: string) => verdict === 'PASS' ? 'bg-emerald-100 text-emerald-800' : verdict === 'PARTIAL' ? 'bg-amber-100 text-amber-800' : verdict === 'ERROR' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700';

export function AssignmentWorkspace({ assignmentId }: { assignmentId: string }) {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?._id);
  const [code, setCode] = useState('');
  const [publicResult, setPublicResult] = useState<AssignmentRunResult | null>(null);
  const [lastSubmission, setLastSubmission] = useState<CodeSubmission | null>(null);
  const assignmentQuery = useQuery({ queryKey: ['code-assignment', assignmentId], queryFn: () => codeAssignmentService.get(assignmentId) });
  const historyQuery = useQuery({ queryKey: ['code-assignment-history', assignmentId], queryFn: () => codeAssignmentService.historyMine(assignmentId) });
  const assignment = assignmentQuery.data;
  const draftKey = assignment ? `threadlearn:assignment-draft:${userId ?? 'anonymous'}:${assignmentId}:${assignment.language}` : '';

  useEffect(() => {
    if (!assignment || !draftKey) return;
    const saved = window.localStorage.getItem(draftKey);
    setCode(saved ?? assignment.starterCode ?? '');
  }, [assignment, draftKey]);

  useEffect(() => {
    if (!draftKey) return;
    const timer = window.setTimeout(() => window.localStorage.setItem(draftKey, code), 500);
    return () => window.clearTimeout(timer);
  }, [code, draftKey]);

  const runMutation = useMutation({
    mutationFn: () => codeAssignmentService.runPublic(assignmentId, { sourceCode: code, language: assignment?.language }),
    onSuccess: (result) => { setPublicResult(result); toast.success('Public tests completed'); },
    onError: (error: any) => toast.error(error?.response?.data?.message ?? 'Could not run public tests'),
  });
  const submitMutation = useMutation({
    mutationFn: () => codeAssignmentService.submit(assignmentId, {
      sourceCode: code,
      language: assignment?.language,
      idempotencyKey: crypto.randomUUID(),
    }),
    onSuccess: (submission) => {
      setLastSubmission(submission);
      queryClient.invalidateQueries({ queryKey: ['code-assignment-history', assignmentId] });
      toast.success(submission.submissionStatus === 'GRADED' ? 'Assignment submitted' : 'Submission saved; judging service is unavailable');
    },
    onError: (error: any) => toast.error(error?.response?.data?.message ?? 'Could not submit assignment'),
  });

  const submissions = useMemo(() => historyQuery.data?.items ?? [], [historyQuery.data?.items]);
  const best = useMemo(() => submissions.reduce<CodeSubmission | null>((current, item) => !current || item.score > current.score ? item : current, null), [submissions]);
  const usedAttempts = submissions.filter((item) => item.countsTowardLimit).length;
  const expired = Boolean(assignment?.deadline && new Date(assignment.deadline) <= new Date());
  const exhausted = assignment?.maxSubmissions != null && usedAttempts >= assignment.maxSubmissions;
  const canSubmit = Boolean(code.trim() && !expired && !exhausted && !submitMutation.isPending);

  if (assignmentQuery.isLoading) return <main className="p-6 text-sm text-black/50">Loading assignment…</main>;
  if (assignmentQuery.isError || !assignment) return <main className="p-6 text-rose-700">Could not load this assignment.</main>;

  const displayedSubmission = lastSubmission ?? submissions[0];
  return (
    <main className="mx-auto max-w-7xl space-y-5 p-6">
      <Link href="/ide" className="inline-flex items-center gap-2 text-sm text-black/60 hover:text-black"><ArrowLeft size={15} /> Back to Code Lab</Link>
      <header className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-widest text-black/45">Code Assignment</p><h1 className="mt-2 text-3xl font-semibold text-ink">{assignment.title}</h1><p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm text-black/65">{assignment.description}</p></div>
          <div className="rounded-lg bg-black/[0.04] px-4 py-3 text-sm"><p className="font-medium">{dateText(assignment.deadline)}</p><p className="mt-1 text-black/55">{assignment.maxSubmissions == null ? 'Unlimited submissions' : `${Math.max(0, assignment.maxSubmissions - usedAttempts)} of ${assignment.maxSubmissions} attempts left`}</p></div>
        </div>
      </header>
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="overflow-hidden rounded-xl border border-black/10 bg-[#111827]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-white"><span className="font-mono text-sm">{assignment.language}</span><div className="flex gap-2"><button type="button" disabled={runMutation.isPending || !code.trim()} onClick={() => runMutation.mutate()} className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm disabled:opacity-50"><Play size={15} /> {runMutation.isPending ? 'Running…' : 'Run public tests'}</button><button type="button" disabled={!canSubmit} onClick={() => submitMutation.mutate()} className="inline-flex items-center gap-2 rounded-md bg-[#d9f99d] px-3 py-2 text-sm font-semibold text-black disabled:opacity-50"><Send size={15} /> {submitMutation.isPending ? 'Submitting…' : 'Submit'}</button></div></div>
          <MonacoEditor height="620px" theme="vs-dark" language={assignment.language === 'cpp' ? 'cpp' : assignment.language} value={code} onChange={(value) => { setCode(value ?? ''); setPublicResult(null); }} options={{ minimap: { enabled: false }, fontSize: 14, automaticLayout: true }} />
        </div>
        <aside className="space-y-4">
          <section className="rounded-xl border border-black/10 bg-white p-4"><div className="flex items-center gap-2 font-semibold text-ink"><Terminal size={16} /> Public test results</div>{publicResult ? <div className="mt-3 space-y-2"><p className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${verdictTone(publicResult.verdict)}`}>{publicResult.verdict} · {publicResult.testCasesPassed}/{publicResult.totalTestCases}</p>{publicResult.testResults.map((test) => <div key={test.index} className="rounded-md border border-black/10 p-2 text-xs"><p className={test.passed ? 'text-emerald-700' : 'text-rose-700'}>Case {test.index + 1}: {test.passed ? 'Passed' : 'Failed'}</p>{!test.passed ? <pre className="mt-1 whitespace-pre-wrap text-black/65">Expected: {test.expectedOutput ?? ''}{'\n'}Actual: {test.actualOutput ?? test.error ?? ''}</pre> : null}</div>)}</div> : <p className="mt-3 text-xs text-black/50">Run code to see public test results. Hidden tests are never shown.</p>}</section>
          <section className="rounded-xl border border-black/10 bg-white p-4"><div className="flex items-center gap-2 font-semibold text-ink"><CheckCircle2 size={16} /> Latest submission</div>{displayedSubmission ? <div className="mt-3 text-sm"><p className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${verdictTone(displayedSubmission.verdict)}`}>{displayedSubmission.submissionStatus === 'SYSTEM_ERROR' ? 'System error — attempt restored' : `${displayedSubmission.verdict ?? 'JUDGING'} · ${displayedSubmission.score}%`}</p><p className="mt-2 text-black/65">{displayedSubmission.testCasesPassed}/{displayedSubmission.totalTestCases} official tests · {displayedSubmission.executionTime}s · {displayedSubmission.memoryUsage} KB</p></div> : <p className="mt-3 text-xs text-black/50">No submissions yet.</p>}</section>
          <section className="rounded-xl border border-black/10 bg-white p-4"><div className="flex items-center gap-2 font-semibold text-ink"><Brain size={16} /> AI feedback</div>{displayedSubmission?.aiFeedback ? <div className="mt-3 space-y-2 text-sm text-black/70"><p>{displayedSubmission.aiFeedback.summary}</p><p><b>Time:</b> {displayedSubmission.aiFeedback.timeComplexity}</p><p><b>Memory:</b> {displayedSubmission.aiFeedback.memoryComplexity}</p>{displayedSubmission.aiFeedback.suggestions?.map((suggestion) => <p key={suggestion}>• {suggestion}</p>)}</div> : <p className="mt-3 text-xs text-black/50">Feedback will appear after judging.</p>}</section>
          <section className="rounded-xl border border-black/10 bg-white p-4"><div className="flex items-center gap-2 font-semibold text-ink"><Clock size={16} /> Submission history</div><div className="mt-3 space-y-2">{submissions.map((submission) => <button type="button" key={submission._id} onClick={() => setCode(submission.sourceCode)} className="w-full rounded-md border border-black/10 p-2 text-left text-xs hover:bg-black/[0.03]">Attempt {submission.attemptNumber} · {submission.score}% · {new Date(submission.submittedAt).toLocaleString()}</button>)}{best ? <p className="pt-1 text-xs text-emerald-700">Best score: {best.score}%</p> : null}</div></section>
        </aside>
      </section>
      {expired ? <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">This assignment is past its deadline. You can still review your work and history.</p> : null}
      {exhausted ? <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">You have used all available submissions. Public tests remain available.</p> : null}
    </main>
  );
}
