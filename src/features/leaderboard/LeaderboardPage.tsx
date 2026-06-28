'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Star, Crown, Medal, AlertCircle } from 'lucide-react';
import { leaderboardService } from '../../services';
import { useAuthStore } from '../../store';
import { Card, Avatar, Skeleton, EmptyState } from '../../components/shared';

const RankIcon: React.FC<{ rank: number }> = ({ rank }) => {
  if (rank === 1) return <Crown size={16} className="text-amber-400" />;
  if (rank === 2) return <Medal size={16} className="text-gray-400" />;
  if (rank === 3) return <Medal size={16} className="text-amber-700" />;
  return <span className="text-xs text-gray-600 font-mono w-4 text-center">#{rank}</span>;
};

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
  const top3 = entries.slice(0, 3);

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

      {/* Top 3 podium */}
      {!isLoading && !isError && top3.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[top3[1], top3[0], top3[2]].map((entry, i) => {
            if (!entry) return <div key={i} />;
            const sizes = ['h-24', 'h-32', 'h-24'];
            const crowns = [null, <Crown key="c" size={16} className="text-amber-400" />, null];
            return (
              <Card
                key={entry.rank}
                className={`flex flex-col items-center justify-end p-3 gap-1.5 ${sizes[i]} ${
                  entry.rank === 1 ? 'border-amber-500/20 bg-amber-500/5' : ''
                }`}
              >
                {crowns[i]}
                <Avatar src={entry.avatar} name={entry.name} size="md" />
                <p className="text-xs text-gray-300 font-mono font-medium truncate max-w-full px-1">
                  {entry.name.split(' ')[0]}
                </p>
                <p className="text-[10px] text-gray-600 font-mono">
                  {entry.xp.toLocaleString()} XP
                </p>
                <div className={`text-[10px] font-mono font-bold ${
                  entry.rank === 1 ? 'text-amber-400' : entry.rank === 2 ? 'text-gray-400' : 'text-amber-700'
                }`}>
                  #{entry.rank}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Rest of list */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-3 flex flex-col gap-2">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            icon={<AlertCircle size={36} />}
            title="Không thể tải leaderboard"
            description="Vui lòng thử lại sau"
          />
        ) : entries.length === 0 ? (
          <EmptyState
            icon={<Trophy size={36} />}
            title="Leaderboard chưa có dữ liệu"
            description="Hoàn thành bài học hoặc quiz để xuất hiện tại đây"
          />
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {entries.map((entry) => {
              const isMe = entry.userId === user?._id;
              return (
                <div
                  key={entry.rank}
                  className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                    isMe ? 'bg-violet-500/5' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="w-5 flex justify-center shrink-0">
                    <RankIcon rank={entry.rank} />
                  </div>
                  <Avatar src={entry.avatar} name={entry.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-mono truncate ${isMe ? 'text-violet-300 font-medium' : 'text-gray-300'}`}>
                      {entry.name}
                      {isMe && <span className="text-xs text-violet-500 ml-1.5">(you)</span>}
                    </p>
                    {entry.level != null && (
                      <p className="text-xs text-gray-600 font-mono">
                        Level {entry.level}
                      </p>
                    )}
                  </div>
                  <p className="text-sm font-mono text-gray-400 shrink-0">
                    {entry.xp.toLocaleString()} <span className="text-gray-600 text-xs">XP</span>
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
