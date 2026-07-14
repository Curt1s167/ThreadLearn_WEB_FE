/**
 * Shared presentation helpers for demo-shell visual reskin (PR4+).
 * API data must still come from services — placeholders are UI-only.
 */

import React from 'react';
import { motion } from 'framer-motion';

/** Presentation-only placeholders. Do not use as business truth. */
export const UI_PLACEHOLDERS = {
  quizAttemptTitle: (quizId: string) => `Quiz · ${quizId.slice(-6).toUpperCase()}`,
  leaderboardSeason: 'Season 1 · Live ranks',
  /** Matches DemoDashboard AI aside copy shape */
  aiCoachUsageLine:
    '3 of 5 free reviews used today. Try a race condition scan in the lesson room.',
  recentActivityFallback: [
    'Complete a lesson to start your activity feed',
    'Pass a quiz to earn XP and climb the leaderboard',
    'Keep a daily streak for gamification bonuses',
  ] as string[],
  weekdays: ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const,
} as const;

export const COURSE_ACCENT_COLORS = [
  'bg-[#d9f99d]',
  'bg-[#f5d0fe]',
  'bg-[#bfdbfe]',
  'bg-[#fde68a]',
] as const;

export function DemoPill({
  children,
  tone = 'default',
}: {
  children: React.ReactNode;
  tone?: 'default' | 'lime' | 'pink' | 'blue';
}) {
  const tones = {
    default: 'bg-black text-white',
    lime: 'bg-[#d9f99d] text-black',
    pink: 'bg-[#f5d0fe] text-black',
    blue: 'bg-[#bfdbfe] text-black',
  };
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

/** Root spacing used by all Demo* pages */
export function DemoPageRoot({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`space-y-6 text-[#111111] ${className}`}>{children}</div>;
}

/** Dark ink hero island (dashboard progress, leaderboard) */
export function DemoHeroInk({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`rounded-lg bg-[#111827] p-6 text-white sm:p-8 ${className}`}
    >
      {children}
    </motion.section>
  );
}

/** White panel hero (quiz history style) */
export function DemoHeroWhite({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`rounded-lg bg-white p-6 sm:p-8 ${className}`}
    >
      {children}
    </motion.section>
  );
}

export function DemoDisplayTitle({ children }: { children: React.ReactNode }) {
  return <h1 className="mt-5 text-4xl font-light tracking-tight">{children}</h1>;
}

export function DemoMuted({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={`mt-3 max-w-2xl text-black/60 ${className}`}>{children}</p>;
}

export function DemoWhitePanel({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-lg border border-black/10 bg-white ${className}`}>
      {children}
    </div>
  );
}

export function DemoPrimaryButton({
  children,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-black/90 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function formatXp(value: number | undefined | null): string {
  const n = value ?? 0;
  return `${n.toLocaleString()} XP`;
}

export function formatPercent(value: number | undefined | null): string {
  return `${Math.round(value ?? 0)}%`;
}
