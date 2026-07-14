'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const XpLevelStreakWidget = dynamic(
  () => import('../gamification').then((module) => module.XpLevelStreakWidget),
  {
    loading: () => (
      <div className="flex flex-col gap-5">
        <div className="h-28 rounded-xl skeleton" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 rounded-xl skeleton" />
          <div className="h-24 rounded-xl skeleton" />
          <div className="h-24 rounded-xl skeleton" />
          <div className="h-24 rounded-xl skeleton" />
        </div>
      </div>
    ),
  }
);

export const ProfileGamificationPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-5 animate-fade-in max-w-2xl mx-auto">
      <div>
        <h1 className="font-mono font-bold text-2xl text-ink">Profile</h1>
        <p className="text-ink-faint font-mono text-sm mt-1">Learning progress and gamification stats</p>
      </div>
      <XpLevelStreakWidget />
    </div>
  );
};
