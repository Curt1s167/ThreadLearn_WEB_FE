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

const WIDTH = 640;
const HEIGHT = 200;
const PAD_X = 16;
const PAD_Y = 20;
const GRID_LINES = 4;

const SEVERITY_COLORS = {
  high: '#f43f5e',
  medium: '#f59e0b',
  low: '#6b7280',
} as const;

export const HistoryTrendChart: React.FC<{ history: AIHistoryLog[] }> = ({ history }) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const router = useRouter();

  const { points, maxIssues, totalPath, highPath, mediumPath, lowPath, cachedCount } = useMemo(() => {
    if (history.length === 0) {
      return {
        points: [] as SeverityPoint[],
        maxIssues: 0,
        totalPath: '',
        highPath: '',
        mediumPath: '',
        lowPath: '',
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
      highPath: buildPath((p) => yFor(p.high)),
      mediumPath: buildPath((p) => yFor(p.medium)),
      lowPath: buildPath((p) => yFor(p.low)),
      cachedCount: chrono.filter((log) => log.cached).length,
    };
  }, [history]);

  if (history.length < 2) return null;

  const hovered = hoverIdx != null ? points[hoverIdx] : null;
  const innerH = HEIGHT - PAD_Y * 2;
  const gridValues = Array.from({ length: GRID_LINES + 1 }, (_, i) =>
    Math.round((maxIssues * (GRID_LINES - i)) / GRID_LINES)
  );
  const cachedPct = points.length > 0 ? Math.round((cachedCount / points.length) * 100) : 0;

  return (
    <div className="rounded-lg border border-black/10 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.14em] text-black/45">Issues found over time</p>
        <div className="flex items-center gap-3 text-xs text-black/50">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: SEVERITY_COLORS.high }} /> high
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: SEVERITY_COLORS.medium }} /> medium
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: SEVERITY_COLORS.low }} /> low
          </span>
          <span className="border-l border-black/10 pl-3">{cachedPct}% cached</span>
        </div>
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
        {gridValues.map((val, i) => {
          const y = PAD_Y + (innerH * i) / GRID_LINES;
          return (
            <g key={i}>
              <line x1={PAD_X} y1={y} x2={WIDTH - PAD_X} y2={y} stroke="#00000010" strokeWidth={1} />
              <text x={0} y={y + 3} fontSize={9} fill="#00000055">{val}</text>
            </g>
          );
        })}

        <path d={lowPath} fill="none" stroke={SEVERITY_COLORS.low} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 3" opacity={0.7} />
        <path d={mediumPath} fill="none" stroke={SEVERITY_COLORS.medium} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 3" opacity={0.7} />
        <path d={highPath} fill="none" stroke={SEVERITY_COLORS.high} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 3" opacity={0.7} />
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
