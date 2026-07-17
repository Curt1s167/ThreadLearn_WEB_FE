'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Clock, ExternalLink } from 'lucide-react';
import type { AIHistoryLog } from '../../types';
import { AnalysisResult, logToView, severityCounts } from './analysisResult';

const HistoryRow: React.FC<{ log: AIHistoryLog; defaultOpen: boolean }> = ({ log, defaultOpen }) => {
  const [open, setOpen] = useState(defaultOpen);
  const router = useRouter();
  const { high, medium, low } = severityCounts(log.issues ?? []);

  return (
    <article className="p-5">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <ChevronDown
            size={16}
            className={`shrink-0 text-black/40 transition-transform ${open ? 'rotate-0' : '-rotate-90'}`}
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium capitalize">{log.language ?? 'code'} analysis</p>
              <span className="flex items-center gap-1 text-xs text-black/45">
                <Clock size={12} />
                {new Date(log.createdAt).toLocaleString()}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {high > 0 && <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-700">{high} HIGH</span>}
              {medium > 0 && <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700">{medium} MED</span>}
              {low > 0 && <span className="rounded-full bg-black/[0.06] px-2 py-0.5 text-[11px] font-medium text-black/60">{low} LOW</span>}
              {(log.issues?.length ?? 0) === 0 && <span className="text-[11px] text-black/40">No issues</span>}
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => router.push(`/ai/history/${log._id}`)}
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-black/60 transition hover:border-black/25 hover:text-black"
        >
          View detail
          <ExternalLink size={12} />
        </button>
      </div>

      {open && <AnalysisResult view={logToView(log)} />}
    </article>
  );
};

export const HistoryList: React.FC<{ history: AIHistoryLog[] }> = ({ history }) => {
  return (
    <div className="divide-y divide-black/10">
      {history.map((log, i) => (
        <HistoryRow key={log._id} log={log} defaultOpen={i === 0} />
      ))}
    </div>
  );
};
