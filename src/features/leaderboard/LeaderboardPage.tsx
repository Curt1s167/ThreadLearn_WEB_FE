'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { Trophy, AlertCircle } from 'lucide-react';
import { leaderboardService } from '../../services';
import { useAuthStore } from '../../store';
import { Card, Skeleton, EmptyState } from '../../components/shared';

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

      {user && myRankLoading ? (
        <Skeleton className="h-12 rounded-xl" />
      ) : myRankError ? (
        <Card className="p-3 border-rose-500/20 bg-rose-500/5 flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center">
            <AlertCircle size={14} className="text-rose-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-mono">My rank</p>
            <p className="text-sm font-mono text-rose-300">
              Could not load current rank
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
            title="Could not load leaderboard"
            description="Please try again later"
          />
        </Card>
      ) : entries.length === 0 ? (
        <Card className="overflow-hidden">
          <EmptyState
            icon={<Trophy size={36} />}
            title="No leaderboard data"
            description="Complete lessons or quizzes to appear here"
          />
        </Card>
      ) : (
        <LeaderboardContent entries={entries} user={user} myRank={myRank} />
      )}
    </div>
  );
};
