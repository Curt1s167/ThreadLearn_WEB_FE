'use client';

import React from 'react';
import { AlertTriangle, Loader2, Terminal } from 'lucide-react';
import type { RunLogEntry } from './useRunCode';

const LEVEL_CLASSES: Record<RunLogEntry['level'], string> = {
  log: 'text-[#d9f99d]',
  warn: 'text-amber-300',
  error: 'text-rose-300',
  result: 'text-sky-300',
};

const LEVEL_PREFIX: Record<RunLogEntry['level'], string> = {
  log: '›',
  warn: '⚠',
  error: '✕',
  result: '←',
};

export const RunOutput: React.FC<{
  logs: RunLogEntry[];
  isRunning: boolean;
  runError: string | null;
}> = ({ logs, isRunning, runError }) => {
  if (!isRunning && logs.length === 0 && !runError) return null;

  return (
    <div className="mt-3 flex flex-1 flex-col overflow-hidden rounded-lg border border-black/10 bg-[#0b1120] text-white">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <Terminal size={14} className="text-black/40" />
        <p className="text-xs uppercase tracking-[0.18em] text-white/35">Console output</p>
        {isRunning && <Loader2 size={13} className="ml-auto animate-spin text-white/40" />}
      </div>
      <div className="min-h-[80px] flex-1 overflow-auto p-3 font-mono text-xs leading-6">
        {logs.length === 0 && !isRunning && !runError && (
          <p className="text-white/30">No output.</p>
        )}
        {logs.map((entry, i) => (
          <div key={i} className={`whitespace-pre-wrap break-words ${LEVEL_CLASSES[entry.level]}`}>
            <span className="mr-1.5 text-white/30">{LEVEL_PREFIX[entry.level]}</span>
            {entry.text}
          </div>
        ))}
        {runError && (
          <div className="mt-1 flex items-start gap-1.5 text-rose-300">
            <AlertTriangle size={13} className="mt-0.5 shrink-0" />
            <span className="whitespace-pre-wrap break-words">{runError}</span>
          </div>
        )}
        {isRunning && logs.length === 0 && (
          <p className="text-white/30">Running…</p>
        )}
      </div>
    </div>
  );
};
