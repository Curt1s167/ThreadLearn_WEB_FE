'use client';

import React from 'react';
import { XpLevelStreakWidget } from '../gamification';

export const ProfileGamificationPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-5 animate-fade-in max-w-2xl mx-auto">
      <div>
        <h1 className="font-mono font-bold text-2xl text-gray-100">Profile</h1>
        <p className="text-gray-600 font-mono text-sm mt-1">Learning progress and gamification stats</p>
      </div>
      <XpLevelStreakWidget />
    </div>
  );
};
