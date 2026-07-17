'use client';

import React, { useEffect, useState } from 'react';
import { Zap, GitBranch, Search, FileText, Brain, Check, Loader2 } from 'lucide-react';

export interface PipelineStep {
  stage: 'race_detector' | 'ast' | 'bm25' | 'prompt' | 'llm' | string;
  status: 'running' | 'done';
  label?: string;
  found?: string[];
  keywords?: string;
  docs?: Array<{ title: string; score?: number } | string>;
  chars?: number;
  _startTime?: number;
  _endTime?: number;
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

const StepDetail: React.FC<{ step: PipelineStep }> = ({ step }) => {
  if (step.stage === 'race_detector' && step.status === 'done') {
    if (!step.found || step.found.length === 0) {
      return <p className="mt-1 text-xs text-black/45">No patterns matched</p>;
    }
    return (
      <div className="mt-1 flex flex-wrap gap-1.5">
        {step.found.map((pattern) => (
          <span key={pattern} className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] text-rose-700">
            {pattern.replace(/_/g, ' ')}
          </span>
        ))}
      </div>
    );
  }
  if (step.stage === 'ast' && step.keywords) {
    const chips = step.keywords.trim().split(/\s+/);
    return (
      <div className="mt-1 flex flex-wrap gap-1.5">
        {chips.map((kw) => (
          <span key={kw} className="rounded-full bg-black/[0.06] px-2 py-0.5 text-[11px] text-black/60">{kw}</span>
        ))}
      </div>
    );
  }
  if (step.stage === 'bm25' && step.docs && step.docs.length > 0) {
    return (
      <ul className="mt-1 space-y-0.5 text-xs text-black/55">
        {step.docs.map((d, i) => {
          const title = typeof d === 'string' ? d : d.title;
          const score = typeof d === 'string' ? undefined : d.score;
          return (
            <li key={i} className="truncate">
              {score !== undefined && <span className="text-black/35">({score.toFixed(2)}) </span>}
              {title}
            </li>
          );
        })}
      </ul>
    );
  }
  if (step.stage === 'prompt' && step.chars) {
    return <p className="mt-1 text-xs text-black/45">~{Math.round(step.chars / 4)} tokens · {step.chars} chars</p>;
  }
  return null;
};

export const PipelineProgress: React.FC<{ steps: PipelineStep[] }> = ({ steps }) => {
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
              <StepDetail step={step} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
