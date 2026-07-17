'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AIHistoryLog } from '../../types';

interface Point {
  x: number;
  y: number;
  issueCount: number;
  date: string;
  log: AIHistoryLog;
}

const WIDTH = 640;
const HEIGHT = 160;
const PAD_X = 16;
const PAD_Y = 20;

export const HistoryTrendChart: React.FC<{ history: AIHistoryLog[] }> = ({ history }) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const router = useRouter();

  const { points, maxIssues, path } = useMemo(() => {
    if (history.length === 0) return { points: [] as Point[], maxIssues: 0, path: '' };

    // Oldest -> newest for a left-to-right trend line.
    const chrono = [...history].reverse();
    const counts = chrono.map((log) => log.issues?.length ?? 0);
    const max = Math.max(1, ...counts);

    const innerW = WIDTH - PAD_X * 2;
    const innerH = HEIGHT - PAD_Y * 2;
    const step = chrono.length > 1 ? innerW / (chrono.length - 1) : 0;

    const pts: Point[] = chrono.map((log, i) => {
      const x = PAD_X + step * i;
      const count = counts[i];
      const y = PAD_Y + innerH - (count / max) * innerH;
      return { x, y, issueCount: count, date: log.createdAt, log };
    });

    const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    return { points: pts, maxIssues: max, path: d };
  }, [history]);

  if (history.length < 2) return null;

  const hovered = hoverIdx != null ? points[hoverIdx] : null;

  return (
    <div className="rounded-lg border border-black/10 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.14em] text-black/45">Issues found over time</p>
        {hovered && (
          <p className="text-xs text-black/50">
            {new Date(hovered.date).toLocaleDateString()} · {hovered.issueCount} issue{hovered.issueCount !== 1 ? 's' : ''} · click to view
          </p>
        )}
      </div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="mt-3 w-full"
        preserveAspectRatio="none"
        style={{ height: 160 }}
      >
        {/* baseline */}
        <line x1={PAD_X} y1={HEIGHT - PAD_Y} x2={WIDTH - PAD_X} y2={HEIGHT - PAD_Y} stroke="#00000012" strokeWidth={1} />

        <path d={path} fill="none" stroke="#111827" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {points.map((p, i) => (
          <g key={i} onClick={() => router.push(`/ai/history/${p.log._id}`)}>
            <circle
              cx={p.x}
              cy={p.y}
              r={hoverIdx === i ? 5 : 3.5}
              fill={p.issueCount > 0 ? '#d9f99d' : '#111827'}
              stroke="#111827"
              strokeWidth={1.5}
              className="cursor-pointer transition-all"
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx((cur) => (cur === i ? null : cur))}
            />
            <rect
              x={p.x - 12}
              y={0}
              width={24}
              height={HEIGHT}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx((cur) => (cur === i ? null : cur))}
            />
          </g>
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-black/35">
        <span>{new Date(points[0].date).toLocaleDateString()}</span>
        <span>max {maxIssues} issue{maxIssues !== 1 ? 's' : ''}</span>
        <span>{new Date(points[points.length - 1].date).toLocaleDateString()}</span>
      </div>
    </div>
  );
};
