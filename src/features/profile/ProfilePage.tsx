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
    <div className="flex flex-col gap-5 animate-fade-in max-w-2xl mx-auto">
      <h1 className="font-mono font-bold text-2xl text-gray-100">Profile</h1>

      {/* Profile card */}
      <Card className="p-6">
        <div className="flex items-start gap-5">
          <div className="relative shrink-0">
            <Avatar src={user.avatarUrl} name={user.name} size="xl" />
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center hover:bg-violet-500 transition-colors"
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
              <h2 className="font-mono font-bold text-xl text-gray-100">{user.name}</h2>
              <Badge color={user.role === 'ADMIN' ? 'purple' : 'gray'}>{user.role}</Badge>
              <Badge color={user.planType === 'PREMIUM' ? 'amber' : 'gray'}>
                {user.planType}
              </Badge>
            </div>
            <p className="text-gray-600 font-mono text-sm mt-1">{user.email}</p>
            <p className="text-gray-700 font-mono text-xs mt-2">
              Member since {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: <Star size={16} className="text-violet-400" />, label: 'Total XP', value: (stats?.xp ?? 0).toLocaleString(), bg: 'bg-violet-500/10' },
          { icon: <Flame size={16} className="text-amber-400" />, label: 'Day streak', value: `${stats?.streak ?? 0} days`, bg: 'bg-amber-500/10' },
          { icon: <BookOpen size={16} className="text-emerald-400" />, label: 'Lessons completed', value: stats?.totalLessonsCompleted ?? 0, bg: 'bg-emerald-500/10' },
          { icon: <Trophy size={16} className="text-amber-400" />, label: 'Quizzes passed', value: stats?.totalQuizzesPassed ?? 0, bg: 'bg-amber-500/10' },
        ].map((item) => (
          <Card key={item.label} className="p-4 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.bg}`}>
              {item.icon}
            </div>
            <div>
              <p className="text-xs text-gray-600 font-mono">{item.label}</p>
              <p className="text-lg font-mono font-bold text-gray-100">{item.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Level card */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono font-semibold text-gray-200 text-sm">Level {stats?.level ?? 1}</span>
          <span className="text-xs text-gray-600 font-mono">{stats?.xp ?? 0} / {((stats?.level ?? 1)) * 1000} XP</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full transition-all duration-500"
            style={{ width: `${((stats?.xp ?? 0) % 1000) / 10}%` }}
          />
        </div>
      </Card>

      {/* Danger zone / plan */}
      {user.planType === 'FREE' && (
        <Card className="p-5 border-amber-500/10 bg-amber-500/5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-mono font-semibold text-gray-200 text-sm">Upgrade to Premium</h3>
              <p className="text-xs text-gray-500 font-mono mt-1">
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
