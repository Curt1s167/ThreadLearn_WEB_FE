import type { CodeShare } from '../../types';
import { isShareExerciseCompatible, isShareLanguageMismatch, lessonDraftKey } from './pages';

const share = {
  exerciseId: 'exercise-1',
  language: 'python',
} as CodeShare;

describe('lesson draft and compare policy', () => {
  it('namespaces drafts by user, lesson, and exercise', () => {
    expect(lessonDraftKey('user-a', 'lesson-a', 'exercise-a')).toBe(
      'threadlearn:lesson-draft:user-a:lesson-a:exercise-a',
    );
    expect(lessonDraftKey('user-a', 'lesson-a', 'exercise-b')).not.toBe(
      lessonDraftKey('user-a', 'lesson-a', 'exercise-a'),
    );
  });

  it('blocks a different exercise and detects normalized language mismatch', () => {
    expect(isShareExerciseCompatible(share, 'exercise-2')).toBe(false);
    expect(isShareExerciseCompatible(share, 'exercise-1')).toBe(true);
    expect(isShareLanguageMismatch(share, 'py')).toBe(false);
    expect(isShareLanguageMismatch(share, 'javascript')).toBe(true);
  });
});
