'use client';

import React, { useState } from 'react';
import { AlertTriangle, Check, CheckCheck } from 'lucide-react';
import type { AIIssue } from '../../types';
import { DiffView } from './DiffView';

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

// Sample/demo snippets inline their own fake db/fs/app/process mocks so "Run"
// produces visible output. The AI fix is generated against the *real* API shape
// (Promise.all/allSettled over real DB drivers), not these mocks, so applying it
// can break the mock's specific shape (e.g. array-of-promises vs array-of-thunks).
// Detect that pattern and warn before Resolve, since this only affects sample
// code — a user's own real code has no such inline mock to clash with.
const MOCK_MARKER_RE = /\bconst\s+(db|fs|app|process|cache|payment|email|emailService|zlib)\s*=\s*\{/;
function hasInlineMock(code?: string): boolean {
  return !!code && MOCK_MARKER_RE.test(code);
}

export const IssueCard: React.FC<{
  issue: AIIssue;
  index: number;
  originalCode?: string;
  onResolve?: (fixedCode: string) => void;
}> = ({ issue, index, originalCode, onResolve }) => {
  const { code, isCodeBlock } = extractFixCode(issue.fix);
  const [resolved, setResolved] = useState(false);
  const canDiff = isCodeBlock && !!originalCode;
  const isUnchanged = canDiff && originalCode!.trim() === code.trim();
  const originalHasMock = hasInlineMock(originalCode);

  function handleResolve() {
    if (originalHasMock) {
      const confirmed = window.confirm(
        'Code này chứa mock demo (db/fs/app...) chỉ để Run thử ra output. ' +
        'AI fix được sinh theo API thật, có thể không khớp shape của mock và gây lỗi khi Run lại. ' +
        'Vẫn muốn áp dụng fix?'
      );
      if (!confirmed) return;
    }
    onResolve?.(code);
    setResolved(true);
  }

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

      {issue.codeSnippet && (
        <div className="mb-3">
          <p className="text-xs uppercase tracking-[0.14em] text-black/45 mb-1">
            Original code (line {issue.lineRange})
          </p>
          <pre className="max-h-48 overflow-auto rounded-lg bg-[#111827] p-3">
            <code className="text-xs font-mono text-rose-300 whitespace-pre-wrap break-words">{issue.codeSnippet}</code>
          </pre>
        </div>
      )}

      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <p className="text-xs uppercase tracking-[0.14em] text-black/45">
            {isCodeBlock ? 'Suggested rewrite' : 'Fix'}
          </p>
          {isUnchanged && (
            <span className="rounded-full bg-black/[0.06] px-2 py-0.5 text-[10px] font-medium text-black/45">
              no changes suggested
            </span>
          )}
          {originalHasMock && !isUnchanged && (
            <span
              className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700"
              title="Code chứa mock demo — AI fix có thể không khớp shape mock, có thể lỗi khi Run lại sau Resolve"
            >
              demo mock — resolve có thể lỗi Run
            </span>
          )}
        </div>
        {isCodeBlock && onResolve && !isUnchanged && (
          <button
            type="button"
            onClick={handleResolve}
            disabled={resolved}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition ${
              resolved
                ? 'bg-emerald-500/10 text-emerald-700 cursor-default'
                : 'bg-black text-white hover:bg-black/85'
            }`}
          >
            {resolved ? <CheckCheck size={12} /> : <Check size={12} />}
            {resolved ? 'Applied' : 'Resolve'}
          </button>
        )}
      </div>

      {canDiff ? (
        <DiffView oldCode={originalCode!} newCode={code} />
      ) : (
        <pre className="max-h-96 overflow-auto rounded-lg bg-[#111827] p-3">
          <code className="text-xs font-mono text-[#d9f99d] whitespace-pre-wrap break-words">{code}</code>
        </pre>
      )}
    </div>
  );
};
