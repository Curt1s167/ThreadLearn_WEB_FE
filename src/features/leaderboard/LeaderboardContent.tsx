'use client';

import React from 'react';
import { Crown, Medal, Sparkles } from 'lucide-react';
import { Avatar, Card, CountUpNumber } from '../../components/shared';
import type { LeaderboardEntry, User } from '../../types';

const RankIcon: React.FC<{ rank: number }> = ({ rank }) => {
  if (rank === 1) return <Crown size={16} className="text-amber-400" />;
  if (rank === 2) return <Medal size={16} className="text-gray-300" />;
  if (rank === 3) return <Medal size={16} className="text-amber-600" />;
  return <span className="text-xs text-gray-500 font-mono w-4 text-center">#{rank}</span>;
};

const podiumMeta: Record<number, {
  label: string;
  medalClass: string;
  shellClass: string;
  heightClass: string;
}> = {
  1: {
    label: 'GOLD',
    medalClass: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
    shellClass: 'border-amber-400/30 bg-amber-400/10 shadow-lg shadow-amber-400/10',
    heightClass: 'h-36',
  },
  2: {
    label: 'SILVER',
    medalClass: 'bg-gray-300/10 text-gray-300 border-gray-300/20',
    shellClass: 'border-white/10 bg-white/[0.04]',
    heightClass: 'h-28',
  },
  3: {
    label: 'BRONZE',
    medalClass: 'bg-amber-700/15 text-amber-500 border-amber-700/25',
    shellClass: 'border-amber-700/20 bg-amber-700/10',
    heightClass: 'h-28',
  },
};

const getUserId = (user?: User | null) => user?._id ?? user?.id;

export function LeaderboardContent({
  entries,
  user,
  myRank,
}: {
  entries: LeaderboardEntry[];
  user?: User | null;
  myRank?: LeaderboardEntry;
}) {
  const top3 = entries.slice(0, 3);
  const userId = getUserId(user);
  const listEntries = myRank && !entries.some((entry) => entry.userId === myRank.userId)
    ? [...entries, myRank]
    : entries;

  return (
    <>
      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-3 items-end">
          {[top3[1], top3[0], top3[2]].map((entry, index) => {
            if (!entry) return <div key={index} />;
            const meta = podiumMeta[entry.rank] ?? podiumMeta[3];

            return (
              <Card
                key={entry.rank}
                className={`relative flex flex-col items-center justify-end p-3 gap-1.5 transition-all duration-200 ${meta.heightClass} ${meta.shellClass}`}
              >
                {entry.rank === 1 && (
                  <Sparkles size={15} className="absolute top-3 right-3 text-amber-300 motion-safe:animate-pulse" />
                )}
                <div className={`absolute top-3 left-3 rounded-full border px-2 py-0.5 text-[9px] font-mono font-bold ${meta.medalClass}`}>
                  {meta.label}
                </div>
                <Avatar
                  src={entry.avatar}
                  name={entry.name}
                  size={entry.rank === 1 ? 'lg' : 'md'}
                  className={entry.rank === 1 ? 'ring-2 ring-amber-400/40 ring-offset-2 ring-offset-surface' : ''}
                />
                <p className="text-xs text-gray-300 font-mono font-medium truncate max-w-full px-1 mt-1">
                  {entry.name.split(' ')[0]}
                </p>
                <p className="text-[10px] text-gray-500 font-mono">
                  <CountUpNumber value={entry.xp} suffix=" XP" />
                </p>
                <div className={`text-[10px] font-mono font-bold ${
                  entry.rank === 1 ? 'text-amber-300' : entry.rank === 2 ? 'text-gray-300' : 'text-amber-600'
                }`}>
                  #{entry.rank}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="divide-y divide-white/[0.04]">
          {listEntries.map((entry) => {
            const isMe = entry.userId === userId;

            return (
              <div
                key={`${entry.userId}-${entry.rank}`}
                className={`flex items-center gap-3 px-4 py-2.5 transition-colors duration-150 ${
                  isMe
                    ? 'sticky bottom-0 z-10 border-t border-accent-500/25 bg-accent-500/10 shadow-glow-sm'
                    : 'hover:bg-white/[0.02]'
                }`}
              >
                <div className="w-5 flex justify-center shrink-0">
                  <RankIcon rank={entry.rank} />
                </div>
                <Avatar src={entry.avatar} name={entry.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-mono truncate ${isMe ? 'text-accent-300 font-semibold' : 'text-gray-300'}`}>
                    {entry.name}
                    {isMe && (
                      <span className="text-[10px] text-accent-200 ml-2 rounded-full border border-accent-500/25 bg-accent-500/10 px-1.5 py-0.5">
                        BẠN
                      </span>
                    )}
                  </p>
                  {entry.level != null && (
                    <p className="text-xs text-gray-500 font-mono">
                      Level {entry.level}
                    </p>
                  )}
                </div>
                <p className="text-sm font-mono text-gray-300 shrink-0">
                  <CountUpNumber value={entry.xp} /> <span className="text-gray-500 text-xs">XP</span>
                </p>
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
}
