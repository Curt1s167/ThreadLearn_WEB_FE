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
  'bg-[#d8f4b2]',
  'bg-[#e5dcff]',
  'bg-[#cfe5ff]',
  'bg-[#ffe8a6]',
] as const;

export function DemoPill({
  children,
  tone = 'default',
}: {
  children: React.ReactNode;
  tone?: 'default' | 'lime' | 'pink' | 'blue';
}) {
  const tones = {
    default: 'bg-[#102b26] text-white',
    lime: 'bg-[#d9f99d] text-[#102b26]',
    pink: 'bg-[#e5dcff] text-[#33205d]',
    blue: 'bg-[#cfe5ff] text-[#123a68]',
  };
  return (
    <span className={`inline-flex self-start rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide ${tones[tone]}`}>
      {children}
    </span>
  );
}

/** Root spacing used by all Demo* pages */
export function DemoPageRoot({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`demo-page-root space-y-7 ${className}`}>{children}</div>;
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
      className={`demo-hero-ink relative overflow-hidden rounded-[1.5rem] p-6 text-white sm:p-8 ${className}`}
    >
      <div className="pointer-events-none absolute -right-24 -top-32 h-64 w-64 rounded-full bg-[#d9f99d]/15 blur-3xl" />
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
      className={`demo-hero-white rounded-[1.5rem] p-6 sm:p-8 ${className}`}
    >
      {children}
    </motion.section>
  );
}

export function DemoDisplayTitle({ children }: { children: React.ReactNode }) {
  return <h1 className="demo-display-title mt-5 text-3xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-4xl">{children}</h1>;
}

export function DemoMuted({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={`demo-muted mt-3 max-w-2xl text-sm leading-6 sm:text-base ${className}`}>{children}</p>;
}

export function DemoWhitePanel({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`demo-white-panel overflow-hidden rounded-[1.25rem] ${className}`}>
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
      className={`inline-flex items-center gap-2 rounded-full bg-[#102b26] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#16433a] active:translate-y-px ${className}`}
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
