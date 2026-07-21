'use client';

import React, { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, Upload, Flame, Star, BookOpen, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '../../services/auth.service';
import { gamificationService } from '../../services';
import { useAuthStore } from '../../store';
import { Card, Avatar, Badge, Button } from '../../components/shared';

export const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: stats } = useQuery({
    queryKey: ['gamification-stats'],
    queryFn: gamificationService.getStats,
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await authService.uploadAvatar(file);
      if (user) setUser({ ...user, avatarUrl: result.avatarUrl });
      toast.success('Avatar updated!');
    } catch {
      toast.error('Failed to upload avatar');
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 animate-fade-in">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0b7668]">Learner account</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-ink">Profile</h1>
      </div>

      {/* Profile card */}
      <Card className="p-6 shadow-[0_14px_30px_rgb(16_43_38_/_0.06)]">
        <div className="flex items-start gap-5">
          <div className="relative shrink-0">
            <Avatar src={user.avatarUrl} name={user.name} size="xl" />
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#102b26] shadow-sm transition-colors hover:bg-[#16433a]"
            >
              <Upload size={11} className="text-white" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-semibold tracking-[-0.02em] text-ink">{user.name}</h2>
              <Badge color={user.role === 'ADMIN' ? 'purple' : 'gray'}>{user.role}</Badge>
              <Badge color={user.planType === 'PREMIUM' ? 'amber' : 'gray'}>
                {user.planType}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-ink-faint">{user.email}</p>
            <p className="mt-2 text-xs text-ink-faint">
              Member since {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: <Star size={16} className="text-[#0b7668]" />, label: 'Total XP', value: (stats?.xp ?? 0).toLocaleString(), bg: 'bg-[#0b7668]/10' },
          { icon: <Flame size={16} className="text-amber-400" />, label: 'Day streak', value: `${stats?.streak ?? 0} days`, bg: 'bg-amber-500/10' },
          { icon: <BookOpen size={16} className="text-emerald-400" />, label: 'Lessons completed', value: stats?.totalLessonsCompleted ?? 0, bg: 'bg-emerald-500/10' },
          { icon: <Trophy size={16} className="text-amber-400" />, label: 'Quizzes passed', value: stats?.totalQuizzesPassed ?? 0, bg: 'bg-amber-500/10' },
        ].map((item) => (
          <Card key={item.label} className="p-4 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.bg}`}>
              {item.icon}
            </div>
            <div>
              <p className="text-xs font-medium text-ink-faint">{item.label}</p>
              <p className="text-lg font-semibold text-ink">{item.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Level card */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-ink">Level {stats?.level ?? 1}</span>
          <span className="text-xs text-ink-faint">{stats?.xp ?? 0} / {((stats?.level ?? 1)) * 1000} XP</span>
        </div>
        <div className="h-2 bg-black/[0.04] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-[#0b7668] transition-all duration-500"
            style={{ width: `${((stats?.xp ?? 0) % 1000) / 10}%` }}
          />
        </div>
      </Card>

      {/* Danger zone / plan */}
      {user.planType === 'FREE' && (
        <Card className="p-5 border-amber-500/10 bg-amber-500/5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-mono font-semibold text-ink text-sm">Upgrade to Premium</h3>
              <p className="text-xs text-ink-muted font-mono mt-1">
                Unlock AI recommendations, Vector Search, and exclusive courses
              </p>
            </div>
            <Button variant="outline" className="shrink-0 text-amber-400 border-amber-500/30 hover:bg-amber-500/10">
              Upgrade
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
