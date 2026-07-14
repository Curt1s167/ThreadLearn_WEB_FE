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
  } = useQuery({
    queryKey: ['my-rank'],
    queryFn: leaderboardService.getMyRank,
    enabled: !!user,
  });

  const entries = leaders ?? [];

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
        <DemoWhitePanel className="p-8 text-center">
          <AlertCircle className="mx-auto text-rose-500" size={32} />
          <h2 className="mt-4 text-xl font-semibold text-black">Could not load leaderboard</h2>
          <p className="mt-2 text-sm text-black/55">Check the API connection and try again.</p>
          <DemoPrimaryButton className="mt-5" onClick={() => refetch()}>
            Retry
          </DemoPrimaryButton>
        </DemoWhitePanel>
      ) : entries.length === 0 ? (
        <DemoWhitePanel className="p-8 text-center">
          <Trophy className="mx-auto text-black/30" size={32} />
          <h2 className="mt-4 text-xl font-semibold text-black">No leaderboard data yet</h2>
          <p className="mt-2 text-sm text-black/55">
            Complete lessons or pass quizzes to earn XP and appear here.
          </p>
        </DemoWhitePanel>
      ) : (
        <LeaderboardContent entries={entries} user={user} myRank={myRank} />
      )}
    </DemoPageRoot>
  );
};
