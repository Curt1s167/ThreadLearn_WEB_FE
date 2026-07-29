'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Send,
  Code2,
  Sparkles,
  Brain,
  Play,
  Cpu,
  BookOpen,
  Target,
  Terminal,
  Undo2,
  Redo2,
} from 'lucide-react';
import { toast } from 'sonner';
import { aiService } from '../../services';
import { Button, Skeleton } from '../../components/shared';
import {
  DemoDisplayTitle,
  DemoPageRoot,
  DemoPill,
  DemoWhitePanel,
} from '../ui-reskin/demo-ui';
import { SAMPLE_CASES } from './sampleCases';
import { PipelineProgress } from './PipelineProgress';
import { useAnalyzeStream } from './useAnalyzeStream';
import { AnalysisResult, logToView } from './analysisResult';
import { IssueCard } from './IssueCard';
import { HistoryList } from './HistoryList';
import { HistoryTrendChart } from './HistoryTrendChart';
import { RunOutput } from './RunOutput';
import { useRunCode } from './useRunCode';
import { CodeEditor } from './CodeEditor';
import { useCodeHistory } from './useCodeHistory';

export const AIPage: React.FC = () => {
  const { code, setCode, undo, redo, resetCode, canUndo, canRedo } = useCodeHistory('');
  const [sampleIdx, setSampleIdx] = useState(-1);
  const [historyPage, setHistoryPage] = useState(1);
  const queryClient = useQueryClient();

  const {
    data: history,
    isLoading: historyLoading,
    isError: historyError,
  } = useQuery({
    queryKey: ['ai-history', historyPage],
    queryFn: () => aiService.getHistory(historyPage),
  });

  useEffect(() => {
    if (historyError) toast.error('Failed to load AI history');
  }, [historyError]);

  const {
    steps,
    isStreaming,
    streamError,
    result,
    llmProgress,
    partialIssues,
    run,
    reset,
  } = useAnalyzeStream();
  const {
    logs: runLogs,
    isRunning,
    runError,
    hasRun,
    executionId,
    run: runCode,
    reset: resetRun,
  } = useRunCode();
  const wasStreaming = useRef(false);

  useEffect(() => {
    if (streamError) toast.error(streamError);
  }, [streamError]);

  useEffect(() => {
    if (wasStreaming.current && !isStreaming) {
      if (!streamError && result) {
        queryClient.invalidateQueries({ queryKey: ['ai-history'] });
        toast.success('Code analyzed!');
      } else if (!streamError) {
        toast.error('AI analysis ended without a result');
      }
    }
    wasStreaming.current = isStreaming;
  }, [isStreaming, result, streamError, queryClient]);

  function handleAnalyze() {
    run(code, 'javascript', executionId);
  }

  function handleRun() {
    runCode(code);
  }

  const hasRunOutput = isRunning || hasRun || runLogs.length > 0 || !!runError;

  function handleSampleChange(idx: number) {
    setSampleIdx(idx);
    if (idx >= 0) resetCode(SAMPLE_CASES[idx]?.code ?? '');
    reset();
    resetRun();
  }

  function handleCodeChange(value: string) {
    setCode(value);
    if (result) reset();
    resetRun();
  }

  const latestLog = history?.items[0];

  return (
    <DemoPageRoot>
      <section className="grid w-full min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,6fr)_minmax(0,4fr)] lg:items-stretch">
        <div className="flex h-full min-w-0 flex-col rounded-lg bg-white p-6 sm:p-8">
          <DemoPill tone="pink">AI Coach</DemoPill>
          <DemoDisplayTitle>Analyze concurrency bugs before they ship.</DemoDisplayTitle>
          <p className="mt-4 max-w-2xl text-black/60">
            Send real code to the AI recommendation service, then keep the review history
            visible for follow-up fixes.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <label className="block">
              <span className="text-xs uppercase tracking-[0.18em] text-black/45">
                Sample code
              </span>
              <select
                value={sampleIdx}
                onChange={(e) => handleSampleChange(Number(e.target.value))}
                className="mt-2 w-full rounded-lg border border-black/10 bg-[#f7f4ee] px-3 py-3 text-sm outline-none transition focus:border-black/30"
              >
                <option value={-1}>— paste your own code —</option>
                {SAMPLE_CASES.map((sample, i) => (
                  <option key={i} value={i}>
                    {sample.title}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex gap-2 sm:w-fit">
              <Button
                onClick={handleRun}
                disabled={!code.trim() || isRunning}
                loading={isRunning}
                variant="outline"
                size="lg"
                className="h-11 w-full sm:w-fit"
              >
                <Terminal size={15} />
                Run
              </Button>
              <Button
                onClick={handleAnalyze}
                disabled={!code.trim() || isStreaming}
                loading={isStreaming}
                size="lg"
                className="h-11 w-full sm:w-fit"
              >
                <Send size={15} />
                Analyze code
              </Button>
            </div>
          </div>

          <div
            className={`mt-5 flex flex-col overflow-hidden rounded-lg border border-black/10 bg-[#111827] text-white ${
              hasRunOutput ? '' : 'flex-1'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <Code2 size={16} className="text-[#d9f99d]" />
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/35">
                    ThreadLearn analyzer
                  </p>
                  <p className="text-sm font-semibold">javascript.snippet</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={undo}
                  disabled={!canUndo}
                  title="Undo (quay lại code trước đó)"
                  className="rounded-full bg-white p-1.5 text-black shadow-sm transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/30 disabled:text-black/30"
                >
                  <Undo2 size={14} />
                </button>
                <button
                  type="button"
                  onClick={redo}
                  disabled={!canRedo}
                  title="Redo (tiến tới code sau đó)"
                  className="rounded-full bg-white p-1.5 text-black shadow-sm transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/30 disabled:text-black/30"
                >
                  <Redo2 size={14} />
                </button>
                <span className="inline-flex items-center gap-2 rounded-full bg-[#d9f99d] px-3 py-1.5 text-xs font-medium text-black">
                  <Play size={13} />
                  Live API
                </span>
              </div>
            </div>
            <CodeEditor
              value={code}
              onChange={handleCodeChange}
              placeholder="Paste your code here..."
              className={hasRunOutput ? 'h-[420px]' : 'h-[420px] max-h-[60vh] flex-1'}
            />
          </div>

          <RunOutput
            logs={runLogs}
            isRunning={isRunning}
            runError={runError}
            hasRun={hasRun}
          />
        </div>

        <aside className="min-w-0 space-y-4">
          <div className="accent-surface rounded-lg p-6">
            <Brain size={24} />
            <h2 className="accent-surface-title mt-5 text-2xl font-semibold">
              About this AI
            </h2>
            <div className="accent-surface-copy mt-5 space-y-4 text-sm">
              <div className="flex items-start gap-2">
                <Cpu size={15} className="mt-0.5 shrink-0" />
                <p>
                  <strong>Model:</strong> Qwen2.5-Coder-1.5B, fine-tuned with QLoRA (r=16,
                  alpha=32) on race-condition patterns.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Target size={15} className="mt-0.5 shrink-0" />
                <p>
                  <strong>Training data:</strong> ~700–1000 labeled (buggy → fixed) code
                  pairs from BugsJS + synthetic cases. Evaluated 18/20 (90%) on known JS
                  concurrency benchmarks.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <BookOpen size={15} className="mt-0.5 shrink-0" />
                <p>
                  <strong>Knowledge base:</strong> 2,050+ reference docs retrieved via
                  BM25 (RAG) to ground every fix in real concurrency patterns.
                </p>
              </div>
            </div>
          </div>

          <div className="min-w-0 rounded-lg bg-white p-5">
            <div className="flex items-center gap-2">
              <Sparkles size={18} />
              <h2 className="font-semibold">
                {isStreaming ? 'Analyzing…' : 'Latest result'}
              </h2>
            </div>
            {isStreaming ? (
              <div className="mt-4 space-y-3">
                <PipelineProgress steps={steps} llmProgress={llmProgress} />
                {partialIssues.map((issue, i) => (
                  <IssueCard
                    key={`${issue.patternId}-${issue.lineRange}`}
                    issue={issue}
                    index={i}
                    originalCode={code}
                    onResolve={setCode}
                  />
                ))}
              </div>
            ) : result ? (
              <AnalysisResult view={{ ...result, code }} onResolve={setCode} />
            ) : historyLoading ? (
              <Skeleton className="mt-4 h-28 rounded-lg" />
            ) : latestLog ? (
              <AnalysisResult view={logToView(latestLog)} />
            ) : (
              <p className="mt-4 text-sm leading-6 text-black/60">
                Run an analysis to see feedback here.
              </p>
            )}
          </div>
        </aside>
      </section>

      {history && history.items.length > 1 && (
        <HistoryTrendChart history={history.items} />
      )}

      <DemoWhitePanel>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-black/45">History</p>
            <h2 className="mt-1 text-xl font-semibold">Analysis history</h2>
          </div>
          <DemoPill tone="blue">{history?.meta.total ?? 0} records</DemoPill>
        </div>

        {historyLoading ? (
          <div className="space-y-3 p-5">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
        ) : history && history.items.length > 0 ? (
          <>
            <HistoryList history={history.items} />
            {history.meta.totalPages > 1 ? (
              <div className="flex items-center justify-center gap-3 border-t border-black/10 p-4">
                <Button
                  variant="outline"
                  disabled={historyPage <= 1}
                  onClick={() => setHistoryPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </Button>
                <span className="text-sm text-black/55">
                  Page {historyPage} of {history.meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={historyPage >= history.meta.totalPages}
                  onClick={() =>
                    setHistoryPage((current) =>
                      Math.min(history.meta.totalPages, current + 1)
                    )
                  }
                >
                  Next
                </Button>
              </div>
            ) : null}
          </>
        ) : (
          <div className="p-8 text-center text-sm text-black/60">
            No analysis history yet.
          </div>
        )}
      </DemoWhitePanel>
    </DemoPageRoot>
  );
};
