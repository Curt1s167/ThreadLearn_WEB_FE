'use client';

import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, BookOpen, Flame, GraduationCap, Star, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { gamificationService } from '../../services';
import { Card, EmptyState, Skeleton } from '../../components/shared';

export const ProfileGamificationPage: React.FC = () => {
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

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5 animate-fade-in max-w-2xl mx-auto">
        <Skeleton className="h-9 w-40 rounded-lg" />
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
        title="Could not load profile stats"
        description="Please try again in a moment"
      />
    );
  }

  if (!stats) {
    return (
      <EmptyState
        icon={<Trophy size={36} />}
        title="No stats yet"
        description="Complete lessons and quizzes to build your profile stats"
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
      icon: <Star size={16} className="text-violet-400" />,
      label: 'Total XP',
      value: stats.xp.toLocaleString(),
      bg: 'bg-violet-500/10',
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
    <div className="flex flex-col gap-5 animate-fade-in max-w-2xl mx-auto">
      <div>
        <h1 className="font-mono font-bold text-2xl text-gray-100">Profile</h1>
        <p className="text-gray-600 font-mono text-sm mt-1">Learning progress and gamification stats</p>
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
            <GraduationCap size={22} className="text-violet-300" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="font-mono font-semibold text-gray-200 text-sm">Level {stats.level}</span>
              <span className="text-xs text-gray-600 font-mono">{stats.xp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full transition-all duration-500"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 font-mono mt-2">Last active: {lastActiveDate}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        {statCards.map((item) => (
          <Card key={item.label} className="p-4 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.bg}`}>
              {item.icon}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-600 font-mono">{item.label}</p>
              <p className="text-lg font-mono font-bold text-gray-100 truncate">{item.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-gray-600 font-mono">Highest streak</p>
          <p className="text-lg font-mono font-bold text-gray-100">{stats.highestStreak ?? currentStreak} days</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-600 font-mono">Courses completed</p>
          <p className="text-lg font-mono font-bold text-gray-100">{stats.coursesCompleted ?? 0}</p>
        </div>
      </Card>
    </div>
  );
};
