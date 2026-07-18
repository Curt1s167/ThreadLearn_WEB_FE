'use client';

import React, { useEffect, useState } from 'react';
import { Zap, GitBranch, Search, FileText, Brain, Check, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

const SEVERITY_BADGE: Record<string, string> = {
  high: 'bg-rose-500/10 text-rose-700',
  medium: 'bg-amber-500/10 text-amber-700',
  low: 'bg-black/[0.06] text-black/60',
};

export interface RaceDetection {
  pattern_id: string;
  line_range: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
}

export interface PipelineStep {
  stage: 'race_detector' | 'ast' | 'bm25' | 'prompt' | 'llm' | string;
  status: 'running' | 'done';
  label?: string;
  found?: string[];
  detections?: RaceDetection[];
  keywords?: string;
  process_flow?: string[];
  docs?: Array<{ title: string; score?: number; category?: string } | string>;
  chars?: number;
  full_prompt?: string;
  severity_counts?: { high: number; medium: number; low: number };
  fix_chars?: number;
  _startTime?: number;
  _endTime?: number;
}

export interface LlmIssueProgress {
  done: number;
  total: number;
  currentPattern: string | null;
}

const STAGE_META: Record<string, { icon: React.ReactNode; label: string }> = {
  race_detector: { icon: <Zap size={14} />, label: 'Race Detector' },
  ast: { icon: <GitBranch size={14} />, label: 'AST Parser' },
  bm25: { icon: <Search size={14} />, label: 'BM25 Search' },
  prompt: { icon: <FileText size={14} />, label: 'Prompt Builder' },
  llm: { icon: <Brain size={14} />, label: 'LLM Inference' },
};

const ElapsedTimer: React.FC<{ step: PipelineStep }> = ({ step }) => {
  const [now, setNow] = useState(Date.now());
  const active = step.status === 'running';

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [active]);

  if (!step._startTime) return null;
  const end = step._endTime || now;
  const elapsed = Math.max(0, end - step._startTime);
  return <span className="ml-2 text-xs text-black/40">{(elapsed / 1000).toFixed(1)}s</span>;
};

const StepDetail: React.FC<{ step: PipelineStep; llmProgress?: LlmIssueProgress | null }> = ({ step, llmProgress }) => {
  const [showPrompt, setShowPrompt] = useState(false);

  if (step.stage === 'llm' && step.status === 'running' && llmProgress && llmProgress.total > 0) {
    // Checklist per-issue LLM fix progress — without this, a file with several
    // detected issues (each needing its own LLM call, ~15-20s apiece) leaves
    // the user staring at one static "running" row for a long time with no
    // sign of life, easy to mistake for the app being frozen.
    const items = Array.from({ length: llmProgress.total }, (_, i) => {
      const label = i === 0 ? 'whole-file fix (fallback)' : `issue #${i}`;
      const isDone = i < llmProgress.done;
      const isCurrent = i === llmProgress.done;
      return { label, isDone, isCurrent };
    });
    return (
      <div className="mt-1.5 space-y-1">
        <p className="text-[11px] text-black/45">
          Fixing {llmProgress.done}/{llmProgress.total} — mỗi issue được model sửa riêng để tránh bỏ sót pattern lặp lại
        </p>
        <ul className="space-y-1">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-1.5 text-[11px]">
              {item.isDone ? (
                <Check size={11} className="shrink-0 text-emerald-600" />
              ) : item.isCurrent ? (
                <Loader2 size={11} className="shrink-0 animate-spin text-black/40" />
              ) : (
                <span className="ml-[1px] h-2 w-2 shrink-0 rounded-full bg-black/10" />
              )}
              <span className={item.isDone ? 'text-black/45 line-through' : item.isCurrent ? 'text-black/70' : 'text-black/35'}>
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (step.stage === 'race_detector' && step.status === 'done') {
    if (!step.detections || step.detections.length === 0) {
      return <p className="mt-1 text-xs text-black/45">No patterns matched</p>;
    }
    return (
      <ul className="mt-1 space-y-1.5">
        {step.detections.map((d, i) => (
          <li key={i} className="rounded-md bg-[#f7f4ee] px-2 py-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${SEVERITY_BADGE[d.severity] ?? SEVERITY_BADGE.low}`}>
                {d.severity.toUpperCase()}
              </span>
              <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] text-rose-700">
                {d.pattern_id.replace(/_/g, ' ')}
              </span>
              <span className="text-[10px] text-black/40">line {d.line_range}</span>
            </div>
            <p className="mt-1 text-[11px] leading-snug text-black/60">{d.description}</p>
          </li>
        ))}
      </ul>
    );
  }

  if (step.stage === 'ast' && step.status === 'done') {
    return (
      <div className="mt-1 space-y-2">
        {step.process_flow && step.process_flow.length > 0 && (
          <ol className="space-y-0.5 text-[11px] text-black/50">
            {step.process_flow.map((line, i) => <li key={i}>{line}</li>)}
          </ol>
        )}
        {step.keywords && (
          <div className="flex flex-wrap gap-1.5">
            {step.keywords.trim().split(/\s+/).map((kw, i) => (
              <span key={`${kw}-${i}`} className="rounded-full bg-black/[0.06] px-2 py-0.5 text-[11px] text-black/60">{kw}</span>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (step.stage === 'bm25' && step.docs && step.docs.length > 0) {
    return (
      <ul className="mt-1 space-y-0.5 text-xs text-black/55">
        {step.docs.map((d, i) => {
          const title = typeof d === 'string' ? d : d.title;
          const score = typeof d === 'string' ? undefined : d.score;
          const category = typeof d === 'string' ? undefined : d.category;
          return (
            <li key={i} className="flex items-center gap-1.5 truncate">
              {score !== undefined && <span className="text-black/35">({score.toFixed(2)})</span>}
              {category && (
                <span className="shrink-0 rounded bg-black/[0.06] px-1.5 py-0.5 font-mono text-[10px] uppercase text-black/45">
                  {category}
                </span>
              )}
              <span className="truncate">{title}</span>
            </li>
          );
        })}
      </ul>
    );
  }

  if (step.stage === 'prompt' && step.chars) {
    return (
      <div className="mt-1">
        <button
          type="button"
          onClick={() => setShowPrompt((v) => !v)}
          className="flex items-center gap-1 text-xs text-black/45 hover:text-black/70"
        >
          ~{Math.round(step.chars / 4)} tokens · {step.chars} chars
          {step.full_prompt && (showPrompt ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
        </button>
        {showPrompt && step.full_prompt && (
          <pre className="mt-1.5 max-h-64 overflow-auto rounded-lg bg-[#111827] p-2.5 text-[10px] leading-relaxed text-[#d9f99d] whitespace-pre-wrap break-words">
            {step.full_prompt}
          </pre>
        )}
      </div>
    );
  }

  if (step.stage === 'llm' && step.status === 'done' && step.severity_counts) {
    const { high, medium, low } = step.severity_counts;
    return (
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        {high > 0 && <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${SEVERITY_BADGE.high}`}>{high} high</span>}
        {medium > 0 && <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${SEVERITY_BADGE.medium}`}>{medium} medium</span>}
        {low > 0 && <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${SEVERITY_BADGE.low}`}>{low} low</span>}
        {high + medium + low === 0 && <span className="text-[11px] text-black/45">No issues detected</span>}
        {step.fix_chars != null && <span className="text-[11px] text-black/35">· fix: {step.fix_chars} chars</span>}
      </div>
    );
  }

  return null;
};

export const PipelineProgress: React.FC<{ steps: PipelineStep[]; llmProgress?: LlmIssueProgress | null }> = ({ steps, llmProgress }) => {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="space-y-2 rounded-lg border border-black/10 bg-white p-4">
      {steps.map((step, i) => {
        const meta = STAGE_META[step.stage] ?? { icon: '●', label: step.stage };
        const isDone = step.status === 'done';
        return (
          <div key={i} className="flex items-start gap-3">
            <div
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                isDone ? 'bg-emerald-500/10 text-emerald-700' : 'bg-black/[0.06] text-black/60'
              }`}
            >
              {isDone ? <Check size={13} /> : <Loader2 size={13} className="animate-spin" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center text-sm font-medium">
                {meta.icon}
                <span className="ml-1.5">{meta.label}</span>
                <ElapsedTimer step={step} />
              </div>
              {step.label && <p className="text-xs text-black/50">{step.label}</p>}
              <StepDetail step={step} llmProgress={llmProgress} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
