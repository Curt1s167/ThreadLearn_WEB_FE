'use client';

import React from 'react';
import { diffLines } from 'diff';

export const CodeDiffView: React.FC<{ oldCode: string; newCode: string }> = ({ oldCode, newCode }) => {
  const parts = diffLines(oldCode, newCode);
  return (
    <pre className="max-h-96 overflow-auto rounded-lg bg-[#111827] p-0 font-mono text-xs leading-6" aria-label="Code changes">
      <code>
        {parts.flatMap((part, index) => part.value.replace(/\n$/, '').split('\n').map((line, lineIndex) => {
          const marker = part.added ? '+' : part.removed ? '-' : ' ';
          const tone = part.added ? 'bg-emerald-500/15 text-emerald-300' : part.removed ? 'bg-rose-500/15 text-rose-300' : 'text-[#d9f99d]';
          return <span key={`${index}-${lineIndex}`} className={`flex ${tone}`}><span className="w-7 shrink-0 select-none px-2 text-white/40">{marker}</span><span className="whitespace-pre-wrap break-words px-1">{line || ' '}</span></span>;
        }))}
      </code>
    </pre>
  );
};
