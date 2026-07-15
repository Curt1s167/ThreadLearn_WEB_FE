'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Trophy } from 'lucide-react';
import { leaderboardService } from '../../services';
import { useAuthStore } from '../../store';
import {
  DemoDisplayTitle,
  DemoHeroInk,
  DemoPageRoot,
  DemoPrimaryButton,
  DemoWhitePanel,
  UI_PLACEHOLDERS,
} from '../ui-reskin/demo-ui';
import type { LeaderboardEntry } from '../../types';

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

const FALLBACK_LEADERS: LeaderboardEntry[] = [
  { rank: 1, userId: 'mock-leader-1', name: 'Vo Van Tin', level: 12, xp: 5920 },
  { rank: 2, userId: 'mock-leader-2', name: 'Nguyen Minh Anh', level: 7, xp: 1840 },
  { rank: 3, userId: 'mock-leader-3', name: 'Ha Van An', level: 7, xp: 1760 },
  { rank: 4, userId: 'mock-leader-4', name: 'Tran Khoa', level: 6, xp: 1420 },
];

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
  } = useQuery({
    queryKey: ['my-rank'],
    queryFn: leaderboardService.getMyRank,
    enabled: !!user,
  });

  const entries = leaders ?? [];
  const useMockLeaders = !isLoading && (isError || entries.length === 0);
  const visibleEntries = useMockLeaders ? FALLBACK_LEADERS : entries;

  return (
    <DemoPageRoot>
      {/* Layout mirrors DemoLeaderboardPage hero + white list */}
      <DemoHeroInk>
        <Trophy size={28} className="text-[#d9f99d]" />
        <DemoDisplayTitle>Leaderboard and gamification</DemoDisplayTitle>
        <p className="mt-3 max-w-2xl text-white/60">
          Rankings from the leaderboard API, updated after quiz and lesson XP side-effects.
        </p>
        <p className="mt-4 text-xs uppercase tracking-[0.18em] text-white/40">
          {UI_PLACEHOLDERS.leaderboardSeason}
        </p>

        {user && (
          <div className="mt-6 inline-flex flex-wrap items-center gap-3 rounded-lg bg-white/10 px-4 py-3 text-sm">
            {myRankLoading ? (
              <span className="text-white/60">Loading your rank…</span>
            ) : myRankError ? (
              <span className="flex items-center gap-2 text-rose-200">
                <AlertCircle size={16} />
                Could not load your rank
              </span>
            ) : myRank ? (
              <>
                <span className="text-white/55">Your position</span>
                <span className="font-semibold text-[#d9f99d]">#{myRank.rank}</span>
                <span className="text-white/40">·</span>
                <span className="text-white/80">{myRank.xp.toLocaleString()} XP</span>
              </>
            ) : (
              <span className="text-white/60">Complete a quiz to appear on the board</span>
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
        <>
          <DemoWhitePanel className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-black">Could not load leaderboard</h2>
                <p className="mt-1 text-sm text-black/55">Showing demo leaderboard preview.</p>
              </div>
              <DemoPrimaryButton onClick={() => refetch()}>Retry</DemoPrimaryButton>
            </div>
          </DemoWhitePanel>
          <LeaderboardContent entries={visibleEntries} user={user} myRank={myRank} />
        </>
      ) : useMockLeaders ? (
        <>
          <DemoWhitePanel className="p-4 text-sm text-black/65">
            Mock leaderboard preview from the demo flow. Real XP ranks will replace this list.
          </DemoWhitePanel>
          <LeaderboardContent entries={visibleEntries} user={user} myRank={myRank} />
        </>
      ) : (
        <LeaderboardContent entries={visibleEntries} user={user} myRank={myRank} />
      )}
    </DemoPageRoot>
  );
};
