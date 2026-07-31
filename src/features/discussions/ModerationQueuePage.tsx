'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { ModerationQueuePanel } from './ContextualDiscussionRoom';
import { DemoDisplayTitle, DemoHeroWhite, DemoMuted, DemoPageRoot, DemoPill } from '../ui-reskin/demo-ui';

export const ModerationQueuePage: React.FC = () => (
  <DemoPageRoot>
    <DemoHeroWhite>
      <DemoPill tone="blue"><ShieldCheck size={14} /> Community safety</DemoPill>
      <DemoDisplayTitle>Discussion moderation queue</DemoDisplayTitle>
      <DemoMuted>Administrators see all reports. Instructors only see courses assigned to them.</DemoMuted>
    </DemoHeroWhite>
    <ModerationQueuePanel />
  </DemoPageRoot>
);

