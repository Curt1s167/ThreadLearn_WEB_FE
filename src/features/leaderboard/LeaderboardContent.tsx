'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { LeaderboardEntry, User } from '../../types';
import { formatXp } from '../ui-reskin/demo-ui';

const getUserId = (user?: User | null) => user?._id ?? user?.id;

/**
 * Row layout matches DemoLeaderboardPage:
 * sm:grid-cols-[70px_1fr_120px_120px] · #rank · name · Level N · XP
 * Highlight current user with lime strip (demo used rank #2 highlight).
 */
export function LeaderboardContent({
  entries,
  user,
  myRank,
}: {
  entries: LeaderboardEntry[];
  user?: User | null;
  myRank?: LeaderboardEntry;
}) {
  const userId = getUserId(user);
  const listEntries =
    myRank && !entries.some((entry) => entry.userId === myRank.userId)
      ? [...entries, myRank]
      : entries;

  return (
    <div className="overflow-hidden rounded-lg border border-black/10 bg-white">
      {listEntries.map((entry, index) => {
        const isMe = entry.userId === userId;
        return (
          <motion.div
            key={`${entry.userId}-${entry.rank}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: Math.min(index * 0.03, 0.3) }}
            className={`grid gap-3 border-b border-black/10 p-5 last:border-b-0 sm:grid-cols-[70px_1fr_120px_120px] sm:items-center ${
              isMe ? 'bg-[#d9f99d]/45' : ''
            }`}
          >
            <p className="text-2xl font-semibold text-black">#{entry.rank}</p>
            <p className="font-medium text-black">
              {entry.name}
              {isMe && (
                <span className="ml-2 text-xs font-semibold text-black/50">(you)</span>
              )}
            </p>
            <p className="text-sm text-black/55">
              Level {entry.level ?? '—'}
            </p>
            <p className="text-sm font-medium text-black">{formatXp(entry.xp)}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
