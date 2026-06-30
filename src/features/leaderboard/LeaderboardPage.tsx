'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Star, AlertCircle } from 'lucide-react';
import { leaderboardService } from '../../services';
import { useAuthStore } from '../../store';
import { Card, Avatar, Skeleton, EmptyState } from '../../components/shared';

const LeaderboardContent = dynamic(
  () => import('./LeaderboardContent').then((module) => module.LeaderboardContent),
  {
    loading: () => (
      <>
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Card className="p-3 flex flex-col gap-2">
          <Skeleton className="h-12 rounded-lg" count={8} />
        </Card>
      </>
    ),
  }
);

export const LeaderboardPage: React.FC = () => {
  const { user } = useAuthStore();

  const {
    data: leaders,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => leaderboardService.getTop(50),
  });

  const {
    data: myRank,
    isLoading: myRankLoading,
    isError: myRankError,
  } = useQuery({
    queryKey: ['my-rank'],
    queryFn: leaderboardService.getMyRank,
    enabled: !!user,
  });

  const entries = leaders ?? [];

  return (
    <div className="flex flex-col gap-5 animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center py-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Trophy size={24} className="text-amber-400" />
          <h1 className="font-mono font-bold text-2xl text-gray-100">Leaderboard</h1>
        </div>
        <p className="text-gray-600 font-mono text-sm">Top learners by XP — updated in real-time</p>
      </div>

      {/* My rank */}
      {user && myRankLoading ? (
        <Skeleton className="h-20 rounded-xl" />
      ) : myRank ? (
        <Card className="p-3 border-violet-500/20 bg-violet-500/5 flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <Star size={14} className="text-violet-400" />
          </div>
          <Avatar src={myRank.avatar} name={myRank.name} size="md" />
          <div className="flex-1">
            <p className="text-xs text-gray-500 font-mono">Hạng của tôi</p>
            <p className="text-sm font-mono font-semibold text-violet-300">
              #{myRank.rank} · {myRank.name}
            </p>
            <p className="text-xs text-gray-600 font-mono">
              {myRank.xp.toLocaleString()} XP
              {myRank.level != null ? ` · Level ${myRank.level}` : ''}
            </p>
          </div>
        </Card>
      ) : myRankError ? (
        <Card className="p-3 border-rose-500/20 bg-rose-500/5 flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center">
            <AlertCircle size={14} className="text-rose-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-mono">Hạng của tôi</p>
            <p className="text-sm font-mono text-rose-300">
              Không thể tải hạng hiện tại
            </p>
          </div>
        </Card>
      ) : null}

      {isLoading ? (
        <Card className="p-3 flex flex-col gap-2">
          <Skeleton className="h-12 rounded-lg" count={8} />
        </Card>
      ) : isError ? (
        <Card className="overflow-hidden">
          <EmptyState
            icon={<AlertCircle size={36} />}
            title="Không thể tải leaderboard"
            description="Vui lòng thử lại sau"
          />
        </Card>
      ) : entries.length === 0 ? (
        <Card className="overflow-hidden">
          <EmptyState
            icon={<Trophy size={36} />}
            title="Leaderboard chưa có dữ liệu"
            description="Hoàn thành bài học hoặc quiz để xuất hiện tại đây"
          />
        </Card>
      ) : (
        <LeaderboardContent entries={entries} user={user} />
      )}
    </div>
  );
};
