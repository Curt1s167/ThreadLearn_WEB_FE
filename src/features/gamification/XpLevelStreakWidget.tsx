'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, BookOpen, Flame, GraduationCap, Star, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { gamificationService } from '../../services';
import { Card, CountUpNumber, EmptyState, Skeleton } from '../../components/shared';

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

  useEffect(() => {
    if (isError) {
      toast.error('Failed to load gamification stats');
    }
  }, [isError]);

  useEffect(() => {
    if (!stats?.level) return;
    if (previousLevelRef.current !== null && stats.level > previousLevelRef.current) {
      setLevelJustChanged(true);
      const timeout = window.setTimeout(() => setLevelJustChanged(false), 260);
      previousLevelRef.current = stats.level;
      return () => window.clearTimeout(timeout);
    }
    previousLevelRef.current = stats.level;
  }, [stats?.level]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-28 rounded-xl" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-xl" count={4} />
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

  const currentStreak = stats.currentStreak ?? stats.streak ?? 0;
  const nextLevelXp = Math.max(stats.level, 1) * 1000;
  const levelProgress = Math.min(100, ((stats.xp % 1000) / 1000) * 100);
  const lastActiveDate = stats.lastActiveDate
    ? new Date(stats.lastActiveDate).toLocaleDateString()
    : 'No activity yet';

  const statCards = [
    {
      icon: <Star size={16} className="text-ink-muted" />,
      label: 'Total XP',
      value: stats.xp.toLocaleString(),
      bg: 'bg-brand-lime/40',
    },
    {
      icon: <Flame size={16} className="text-amber-400" />,
      label: 'Current streak',
      value: `${currentStreak} days`,
      bg: 'bg-amber-500/10',
    },
    {
      icon: <BookOpen size={16} className="text-emerald-400" />,
      label: 'Lessons completed',
      value: stats.totalLessonsCompleted.toLocaleString(),
      bg: 'bg-emerald-500/10',
    },
    {
      icon: <Trophy size={16} className="text-sky-400" />,
      label: 'Quizzes completed',
      value: (stats.quizzesCompleted ?? stats.totalQuizzesPassed ?? 0).toLocaleString(),
      bg: 'bg-sky-500/10',
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <Card className={`p-5 transition-shadow duration-200 ${levelJustChanged ? 'border-accent-500/40 shadow-glow motion-safe:animate-level-pop' : ''}`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-lime/40 flex items-center justify-center shrink-0">
            <GraduationCap size={22} className="text-ink" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="font-mono font-semibold text-ink text-sm">Level {stats.level}</span>
              <span className="text-xs text-ink-muted font-mono">
                <CountUpNumber value={stats.xp} /> / {nextLevelXp.toLocaleString()} XP
              </span>
            </div>
            <div className="h-2 bg-black/[0.04] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent-600 to-accent-400 rounded-full transition-all duration-200"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
            <p className="text-xs text-ink-muted font-mono mt-2">Last active: {lastActiveDate}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        {statCards.map((item) => (
          <Card key={item.label} className="p-4 flex items-center gap-3 transition-all duration-200 motion-safe:hover:-translate-y-0.5 hover:border-black/10">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.bg} ${item.label === 'Current streak' ? 'shadow-sm shadow-amber-400/20' : ''}`}>
              {item.icon}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-ink-muted font-mono">{item.label}</p>
              <p className="text-lg font-mono font-bold text-ink truncate">
                {item.label === 'Total XP' ? <CountUpNumber value={stats.xp} /> : item.value}
              </p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-ink-muted font-mono">Highest streak</p>
          <p className="text-lg font-mono font-bold text-ink">{stats.highestStreak ?? currentStreak} days</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-ink-muted font-mono">Courses completed</p>
          <p className="text-lg font-mono font-bold text-ink">{stats.coursesCompleted ?? 0}</p>
        </div>
      </Card>
    </div>
  );
};
