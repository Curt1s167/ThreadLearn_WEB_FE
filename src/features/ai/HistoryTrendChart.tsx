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

interface SeverityPoint extends Point {
  high: number;
  medium: number;
  low: number;
}

const WIDTH = 1200;
const HEIGHT = 200;
const PAD_X = 16;
const PAD_Y = 20;
const GRID_LINES = 4;

export const HistoryTrendChart: React.FC<{ history: AIHistoryLog[] }> = ({ history }) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const router = useRouter();

  const { points, maxIssues, totalPath, cachedCount } = useMemo(() => {
    if (history.length === 0) {
      return {
        points: [] as SeverityPoint[],
        maxIssues: 0,
        totalPath: '',
        cachedCount: 0,
      };
    }

    // Oldest -> newest for a left-to-right trend line.
    const chrono = [...history].reverse();
    const breakdowns = chrono.map((log) => {
      const issues = log.issues ?? [];
      return {
        high: issues.filter((i) => i.severity === 'high').length,
        medium: issues.filter((i) => i.severity === 'medium').length,
        low: issues.filter((i) => i.severity === 'low').length,
      };
    });
    const totals = breakdowns.map((b) => b.high + b.medium + b.low);
    const max = Math.max(1, ...totals);

    const innerW = WIDTH - PAD_X * 2;
    const innerH = HEIGHT - PAD_Y * 2;
    const step = chrono.length > 1 ? innerW / (chrono.length - 1) : 0;

    const yFor = (count: number) => PAD_Y + innerH - (count / max) * innerH;

    const pts: SeverityPoint[] = chrono.map((log, i) => {
      const x = PAD_X + step * i;
      const { high, medium, low } = breakdowns[i];
      return {
        x,
        y: yFor(totals[i]),
        issueCount: totals[i],
        date: log.createdAt,
        log,
        high,
        medium,
        low,
      };
    });

    const buildPath = (getY: (p: SeverityPoint) => number) =>
      pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${getY(p).toFixed(1)}`).join(' ');

    return {
      points: pts,
      maxIssues: max,
      totalPath: buildPath((p) => p.y),
      cachedCount: chrono.filter((log) => log.cached).length,
    };
  }, [history]);

  if (history.length < 2) return null;

  const hovered = hoverIdx != null ? points[hoverIdx] : null;
  const innerH = HEIGHT - PAD_Y * 2;
  // Cap grid lines to maxIssues so small counts (e.g. max=2) don't produce
  // duplicate rounded labels like "2, 2, 1, 1, 0" from Math.round bucketing.
  const gridCount = Math.min(GRID_LINES, maxIssues);
  const gridValues = Array.from(
    new Set(
      Array.from({ length: gridCount + 1 }, (_, i) =>
        Math.round((maxIssues * (gridCount - i)) / gridCount)
      )
    )
  );
  const cachedPct = points.length > 0 ? Math.round((cachedCount / points.length) * 100) : 0;

  return (
    <div className="rounded-lg border border-black/10 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.14em] text-black/45">Issues found over time</p>
        <span className="text-xs text-black/50">{cachedPct}% cached</span>
      </div>

      {hovered && (
        <p className="mt-1 text-xs text-black/50">
          {new Date(hovered.date).toLocaleDateString()} · {hovered.issueCount} total
          {' '}({hovered.high} high, {hovered.medium} med, {hovered.low} low) · click to view
        </p>
      )}

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="mt-3 w-full"
        preserveAspectRatio="none"
        style={{ height: 200 }}
      >
        {gridValues.map((val) => {
          const y = maxIssues > 0 ? PAD_Y + innerH - (val / maxIssues) * innerH : PAD_Y + innerH;
          return (
            <g key={val}>
              <line x1={PAD_X} y1={y} x2={WIDTH - PAD_X} y2={y} stroke="#00000010" strokeWidth={1} />
              <text x={0} y={y + 3} fontSize={9} fill="#00000055">{val}</text>
            </g>
          );
        })}

        <path d={totalPath} fill="none" stroke="#111827" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

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
