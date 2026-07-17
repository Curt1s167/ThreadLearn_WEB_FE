'use client';

import React from 'react';
import { diffLines } from 'diff';

export const DiffView: React.FC<{ oldCode: string; newCode: string }> = ({ oldCode, newCode }) => {
  const parts = diffLines(oldCode, newCode);

  return (
    <pre className="max-h-96 overflow-auto rounded-lg bg-[#111827] p-0 font-mono text-xs leading-6">
      <code>
        {parts.map((part, i) => {
          const lines = part.value.replace(/\n$/, '').split('\n');
          const bg = part.added ? 'bg-emerald-500/15' : part.removed ? 'bg-rose-500/15' : '';
          const marker = part.added ? '+' : part.removed ? '-' : ' ';
          const textColor = part.added ? 'text-emerald-300' : part.removed ? 'text-rose-300' : 'text-[#d9f99d]';

          return lines.map((line, j) => (
            <div key={`${i}-${j}`} className={`flex ${bg}`}>
              <span className="w-6 shrink-0 select-none px-2 text-black/40">{marker}</span>
              <span className={`whitespace-pre-wrap break-words px-1 ${textColor}`}>{line || ' '}</span>
            </div>
          ));
        })}
      </code>
    </pre>
  );
};
