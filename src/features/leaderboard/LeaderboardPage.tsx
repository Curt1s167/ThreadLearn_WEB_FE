'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, RefreshCw, Trophy } from 'lucide-react';
import { leaderboardService } from '../../services';
import { useAuthStore } from '../../store';
import {
  DemoDisplayTitle,
  DemoHeroInk,
  DemoPageRoot,
  DemoPrimaryButton,
  DemoWhitePanel,
} from '../ui-reskin/demo-ui';

const LeaderboardContent = dynamic(
  () => import('./LeaderboardContent').then((module) => module.LeaderboardContent),
  {
    loading: () => (
      <DemoWhitePanel>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-[72px] animate-pulse border-b border-black/10 bg-[#f7f4ee]/80 last:border-b-0"
          />
        ))}
      </DemoWhitePanel>
    ),
  }
);

export const LeaderboardPage: React.FC = () => {
  const { user } = useAuthStore();

  const {
    data: leaders,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => leaderboardService.getTop(50),
  });

  const {
    data: myRank,
    isLoading: myRankLoading,
    isError: myRankError,
    refetch: refetchMyRank,
  } = useQuery({
    queryKey: ['my-rank'],
    queryFn: leaderboardService.getMyRank,
    enabled: !!user,
  });

  const entries = leaders ?? [];

  return (
    <DemoPageRoot>
      <DemoHeroInk>
        <Trophy size={28} className="text-[#d9f99d]" />
        <DemoDisplayTitle>Bảng xếp hạng</DemoDisplayTitle>
        <p className="mt-3 max-w-2xl text-white/60">
          Theo dõi thứ hạng dựa trên XP bạn nhận được khi hoàn thành bài học và bài kiểm tra.
        </p>

        {user && (
          <div className="mt-6 inline-flex flex-wrap items-center gap-3 rounded-lg bg-white/10 px-4 py-3 text-sm">
            {myRankLoading ? (
              <span className="text-white/60">Đang tải thứ hạng của bạn...</span>
            ) : myRankError ? (
              <button
                type="button"
                onClick={() => refetchMyRank()}
                className="flex items-center gap-2 text-rose-200 transition hover:text-white"
              >
                <AlertCircle size={16} />
                Không thể tải thứ hạng. Thử lại
                <RefreshCw size={14} />
              </button>
            ) : myRank ? (
              <>
                <span className="text-white/55">Thứ hạng của bạn</span>
                <span className="font-semibold text-[#d9f99d]">#{myRank.rank}</span>
                <span className="text-white/40">·</span>
                <span className="text-white/70">Cấp {myRank.level ?? 1}</span>
                <span className="text-white/40">·</span>
                <span className="text-white/80">{myRank.xp.toLocaleString()} XP</span>
              </>
            ) : (
              <span className="text-white/60">Hoàn thành bài học hoặc bài kiểm tra để xuất hiện tại đây.</span>
            )}
          </div>
        )}
      </DemoHeroInk>

      {isLoading ? (
        <DemoWhitePanel>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-[72px] animate-pulse border-b border-black/10 bg-[#f7f4ee]/80 last:border-b-0"
            />
          ))}
        </DemoWhitePanel>
      ) : isError ? (
        <DemoWhitePanel className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-black">Không thể tải bảng xếp hạng</h2>
              <p className="mt-1 text-sm text-black/55">
                Kết nối có thể đang gián đoạn. Hãy thử lại sau ít phút.
              </p>
            </div>
            <DemoPrimaryButton onClick={() => refetch()}>Thử lại</DemoPrimaryButton>
          </div>
        </DemoWhitePanel>
      ) : entries.length === 0 ? (
        <DemoWhitePanel className="p-8 text-center">
          <Trophy className="mx-auto text-black/30" size={32} />
          <h2 className="mt-4 text-xl font-semibold text-black">Chưa có dữ liệu xếp hạng</h2>
          <p className="mt-2 text-sm text-black/55">
            Học viên sẽ xuất hiện sau khi nhận XP từ bài học hoặc bài kiểm tra.
          </p>
        </DemoWhitePanel>
      ) : (
        <LeaderboardContent entries={entries} user={user} myRank={myRank} />
      )}
    </DemoPageRoot>
  );
};
