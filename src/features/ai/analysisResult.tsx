'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Database, Zap, CheckCircle2 } from 'lucide-react';
import { IssueCard } from './IssueCard';
import type { AIHistoryLog, AIIssue, AIKnowledgeDoc } from '../../types';

const DOC_MARKDOWN_COMPONENTS = {
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="mb-2 last:mb-0">{children}</p>
  ),
  code: ({ className, children }: { className?: string; children?: React.ReactNode }) => {
    const isBlock = /language-/.test(className ?? '');
    if (!isBlock) {
      return (
        <code className="rounded bg-black/[0.08] px-1 py-0.5 font-mono text-[11px]">
          {children}
        </code>
      );
    }
    return <code className={className}>{children}</code>;
  },
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre className="my-2 w-full max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-[#111827] p-3 text-[11px] leading-relaxed text-[#d9f99d]">
      {children}
    </pre>
  ),
};

export interface ResultView {
  issues: AIIssue[];
  docsUsed: AIKnowledgeDoc[];
  cached?: boolean;
  explanation?: string;
  analyzeTimeMs?: number;
  patternsChecked?: number;
  code: string;
}

export function severityCounts(issues: AIIssue[]) {
  return {
    high: issues.filter((i) => i.severity === 'high').length,
    medium: issues.filter((i) => i.severity === 'medium').length,
    low: issues.filter((i) => i.severity === 'low').length,
  };
}

export function logToView(log: AIHistoryLog): ResultView {
  return {
    issues: log.issues ?? [],
    docsUsed: log.docsUsed ?? [],
    cached: log.cached,
    explanation: log.explanation,
    analyzeTimeMs: log.analyzeTimeMs,
    code: log.inputCode ?? '',
  };
}

export const AnalysisResult: React.FC<{
  view: ResultView;
  onResolve?: (fixedCode: string) => void;
}> = ({ view, onResolve }) => {
  const { issues, docsUsed, cached, explanation, analyzeTimeMs, patternsChecked, code } =
    view;
  const { high, medium, low } = severityCounts(issues);
  const lines = code.trim().split('\n').length;
  const chars = code.length;

  return (
    <div className="mt-4 min-w-0 space-y-3">
      {/* Code Stats */}
      <div className="rounded-lg border border-black/10 bg-white p-4">
        <p className="text-xs uppercase tracking-[0.14em] text-black/45 mb-2">
          Code stats
        </p>
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-lg font-semibold">{lines}</p>
            <p className="text-xs text-black/45">lines</p>
          </div>
          <div>
            <p className="text-lg font-semibold">{chars}</p>
            <p className="text-xs text-black/45">chars</p>
          </div>
          <div>
            <p className="text-lg font-semibold">{issues.length}</p>
            <p className="text-xs text-black/45">issues</p>
          </div>
          {analyzeTimeMs != null && (
            <div>
              <p className="text-lg font-semibold">
                {(analyzeTimeMs / 1000).toFixed(1)}s
              </p>
              <p className="text-xs text-black/45">total time</p>
            </div>
          )}
          {patternsChecked != null && (
            <div>
              <p className="text-lg font-semibold">{patternsChecked}</p>
              <p className="text-xs text-black/45">patterns scanned</p>
            </div>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {cached && (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/[0.06] px-2.5 py-0.5 text-xs font-medium text-black/60">
              <Zap size={11} /> cached
            </span>
          )}
          {high > 0 && (
            <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-medium text-rose-700">
              {high} HIGH
            </span>
          )}
          {medium > 0 && (
            <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-700">
              {medium} MED
            </span>
          )}
          {low > 0 && (
            <span className="rounded-full bg-black/[0.06] px-2.5 py-0.5 text-xs font-medium text-black/60">
              {low} LOW
            </span>
          )}
        </div>
      </div>

      {issues.length === 0 ? (
        <div className="rounded-lg bg-[#f7f4ee] p-6 text-center">
          <CheckCircle2 size={22} className="mx-auto text-emerald-600" />
          <p className="mt-2 text-sm text-black/60">No concurrency issues detected.</p>
        </div>
      ) : (
        issues.map((issue, i) => (
          <IssueCard
            key={i}
            issue={issue}
            index={i}
            originalCode={code}
            onResolve={onResolve}
          />
        ))
      )}

      {explanation && (
        <div className="rounded-lg border border-black/10 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-black/45 mb-1">
            AI explanation
          </p>
          <p className="text-sm leading-relaxed text-black/70">{explanation}</p>
        </div>
      )}

      {docsUsed.length > 0 && (
        <div className="min-w-0 rounded-lg border border-black/10 bg-white p-4">
          <div className="flex items-center gap-2 mb-2">
            <Database size={13} className="text-black/45" />
            <p className="text-xs uppercase tracking-[0.14em] text-black/45">
              Knowledge base references
            </p>
          </div>
          <div className="min-w-0 space-y-3">
            {docsUsed.map((doc, i) => (
              <div key={i} className="min-w-0 rounded-lg bg-[#f7f4ee] p-3">
                <div className="flex items-center gap-2 text-xs text-black/60">
                  {doc.category && (
                    <span className="rounded bg-black/[0.06] px-1.5 py-0.5 font-mono text-[10px] uppercase text-black/45">
                      {doc.category}
                    </span>
                  )}
                  <span className="font-medium text-black/80">{doc.title}</span>
                </div>
                {doc.content && (
                  <div className="mt-1.5 text-xs leading-relaxed text-black/60">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={DOC_MARKDOWN_COMPONENTS}
                    >
                      {doc.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
