'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { AIIssue } from '../../types';

const SEVERITY_CLASSES: Record<AIIssue['severity'], string> = {
  high: 'bg-rose-500/10 text-rose-700',
  medium: 'bg-amber-500/10 text-amber-700',
  low: 'bg-black/[0.06] text-black/60',
};

function extractFixCode(fix: string): { code: string; isCodeBlock: boolean } {
  const match = fix.match(/```(?:javascript|js|typescript|ts|python|java|go)?\n?([\s\S]*?)```/);
  if (match) return { code: match[1].trim(), isCodeBlock: true };
  return { code: fix, isCodeBlock: false };
}

export const IssueCard: React.FC<{ issue: AIIssue; index: number }> = ({ issue, index }) => {
  const { code, isCodeBlock } = extractFixCode(issue.fix);

  return (
    <div className="rounded-lg border border-black/10 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${SEVERITY_CLASSES[issue.severity]}`}>
          {issue.severity.toUpperCase()}
        </span>
        <span className="text-xs font-mono text-black/45">{issue.patternId}</span>
        <span className="text-black/20">·</span>
        <span className="text-xs font-mono text-black/45">line {issue.lineRange}</span>
        <span className="ml-auto text-xs font-mono text-black/35">#{index + 1}</span>
      </div>

      <div className="flex items-start gap-2 text-sm text-black/70 mb-3">
        <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-600" />
        <p className="leading-relaxed">{issue.description}</p>
      </div>

      <p className="text-xs uppercase tracking-[0.14em] text-black/45 mb-1">
        {isCodeBlock ? 'Suggested rewrite' : 'Fix'}
      </p>
      <pre className="max-h-96 overflow-auto rounded-lg bg-[#111827] p-3">
        <code className="text-xs font-mono text-[#d9f99d] whitespace-pre-wrap break-words">{code}</code>
      </pre>
    </div>
  );
};
