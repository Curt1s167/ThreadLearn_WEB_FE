'use client';

import React from 'react';
import { Crown, Medal } from 'lucide-react';
import { Avatar, Card } from '../../components/shared';
import type { LeaderboardEntry, User } from '../../types';

const RankIcon: React.FC<{ rank: number }> = ({ rank }) => {
  if (rank === 1) return <Crown size={16} className="text-amber-400" />;
  if (rank === 2) return <Medal size={16} className="text-gray-400" />;
  if (rank === 3) return <Medal size={16} className="text-amber-700" />;
  return <span className="text-xs text-gray-600 font-mono w-4 text-center">#{rank}</span>;
};

export function LeaderboardContent({
  entries,
  user,
}: {
  entries: LeaderboardEntry[];
  user?: User | null;
}) {
  const top3 = entries.slice(0, 3);

  return (
    <>
      {top3.length > 0 && (
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

      <Card className="overflow-hidden">
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
      </Card>
    </>
  );
}
