'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, BookOpen, Flame, GraduationCap, Star, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { gamificationService } from '../../services';
import { CountUpNumber, EmptyState, Skeleton } from '../../components/shared';

/**
 * PR9 — gamification stats widget in demo light language.
 * LOGIC LOCK: getStats query, level-up pop, toast on error.
 */
export const XpLevelStreakWidget: React.FC = () => {
  const previousLevelRef = useRef<number | null>(null);
  const [levelJustChanged, setLevelJustChanged] = useState(false);
  const {
    data: stats,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['gamification-stats'],
    queryFn: gamificationService.getStats,
  });
  const hasStats = Boolean(stats);
  const safeLevel = stats?.level ?? 1;

  useEffect(() => {
    if (isError) {
      toast.error('Failed to load gamification stats');
    }
  }, [isError]);

  useEffect(() => {
    if (!hasStats) return;
    if (previousLevelRef.current !== null && safeLevel > previousLevelRef.current) {
      setLevelJustChanged(true);
      const timeout = window.setTimeout(() => setLevelJustChanged(false), 260);
      previousLevelRef.current = safeLevel;
      return () => window.clearTimeout(timeout);
    }
    previousLevelRef.current = safeLevel;
  }, [hasStats, safeLevel]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-28 rounded-lg" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Skeleton className="h-24 rounded-lg" count={3} />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={<AlertCircle size={36} />}
        title="Could not load gamification stats"
        description="Please try again in a moment"
      />
    );
  }

  if (!stats) {
    return (
      <EmptyState
        icon={<Trophy size={36} />}
        title="No stats yet"
        description="Complete lessons and quizzes to build your stats"
      />
    );
  }

  const level = stats.level ?? 1;
  const xp = stats.xp ?? 0;
  const currentStreak = stats.currentStreak ?? stats.streak ?? 0;
  const totalLessonsCompleted = stats.totalLessonsCompleted ?? 0;
  const quizzesDone = stats.quizzesCompleted ?? stats.totalQuizzesPassed ?? 0;
  const highestStreak = stats.highestStreak ?? currentStreak;
  const coursesCompleted = stats.coursesCompleted ?? 0;
  const nextLevelXp = Math.max(level, 1) * 1000;
  const levelProgress = Math.min(100, ((xp % 1000) / 1000) * 100);
  const lastActiveDate = stats.lastActiveDate
    ? new Date(stats.lastActiveDate).toLocaleDateString()
    : 'No activity yet';

  const statCards = [
    {
      icon: <Star size={16} />,
      label: 'Total XP',
      value: <CountUpNumber value={xp} />,
      shell: 'bg-[#d9f99d]',
    },
    {
      icon: <Flame size={16} />,
      label: 'Current streak',
      value: `${currentStreak} days`,
      shell: 'bg-[#fde68a]',
    },
    {
      icon: <BookOpen size={16} />,
      label: 'Lessons completed',
      value: totalLessonsCompleted.toLocaleString(),
      shell: 'bg-[#bfdbfe]',
    },
    {
      icon: <Trophy size={16} />,
      label: 'Quizzes completed',
      value: quizzesDone.toLocaleString(),
      shell: 'bg-[#f5d0fe]',
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div
        className={`rounded-lg border border-black/10 bg-white p-6 shadow-sm transition-shadow duration-200 ${
          levelJustChanged ? 'ring-2 ring-[#d9f99d] motion-safe:animate-level-pop' : ''
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#d9f99d]">
            <GraduationCap size={26} className="text-ink" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-ink">Level {level}</span>
              <span className="text-xs text-black/50">
                <CountUpNumber value={xp} /> / {nextLevelXp.toLocaleString()} XP
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-black/5">
              <div
                className="h-full rounded-full bg-black transition-all duration-200"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-black/45">Last active: {lastActiveDate}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-black/10 bg-white p-4 shadow-sm transition motion-safe:hover:-translate-y-0.5"
          >
            <div
              className={`mb-3 flex h-8 w-8 items-center justify-center rounded-lg ${item.shell}`}
            >
              {item.icon}
            </div>
            <p className="text-xs text-black/45">{item.label}</p>
            <p className="mt-1 text-xl font-semibold text-ink">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-black/10 bg-[#f7f4ee] p-4">
          <p className="text-xs text-black/45">Highest streak</p>
          <p className="mt-1 text-2xl font-semibold text-ink">
            {highestStreak} days
          </p>
        </div>
        <div className="rounded-lg border border-black/10 bg-[#f7f4ee] p-4">
          <p className="text-xs text-black/45">Courses completed</p>
          <p className="mt-1 text-2xl font-semibold text-ink">
            {coursesCompleted}
          </p>
        </div>
      </div>
    </div>
  );
};
