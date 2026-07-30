'use client';

import React from 'react';
import { ContextualDiscussionRoom } from '../discussions/ContextualDiscussionRoom';
import type { CodeShare } from '../../types';

export const CommentsSection: React.FC<{ lessonId: string; onApplyCode?: (share: CodeShare) => void }> = ({ lessonId, onApplyCode }) => (
  <ContextualDiscussionRoom targetType="LESSON" targetId={lessonId} lessonId={lessonId} onApplyCode={onApplyCode} />
);
