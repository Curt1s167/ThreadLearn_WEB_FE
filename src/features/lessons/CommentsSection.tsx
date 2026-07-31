'use client';

import React from 'react';
import { ContextualDiscussionRoom } from '../discussions/ContextualDiscussionRoom';
import type { CodeShare } from '../../types';

export const CommentsSection: React.FC<{ lessonId: string; exerciseId?: string; onApplyCode?: (share: CodeShare) => void }> = ({ lessonId, exerciseId, onApplyCode }) => (
  <ContextualDiscussionRoom targetType="LESSON" targetId={lessonId} lessonId={lessonId} exerciseId={exerciseId} onApplyCode={onApplyCode} />
);
