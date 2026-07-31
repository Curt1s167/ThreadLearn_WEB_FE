import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import type { CodeShare } from '../../types';
import { LessonCodeRunner } from './pages';

const makeShare = (overrides: Partial<CodeShare> = {}): CodeShare => ({
  _id: 'share-1', authorId: 'solver-1', targetType: 'LESSON', targetId: 'lesson-1',
  lessonId: 'lesson-1', exerciseId: 'exercise-1', language: 'python', sourceCode: 'print("solution")',
  status: 'Accepted', stdout: '', stderr: '', compileOutput: '', runtime: '0', memory: 0,
  visibility: 'COURSE', createdAt: new Date().toISOString(),
  ...overrides,
});

function renderRunner(share: CodeShare | null, props: Partial<React.ComponentProps<typeof LessonCodeRunner>> = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}><LessonCodeRunner
    lessonId="lesson-1" courseId="course-1" language="python" exerciseId="exercise-1"
    initialCode={'print("draft")'} requestedShare={share} onApplyHandled={vi.fn()} {...props}
  /></QueryClientProvider>);
}

describe('LessonCodeRunner Compare & Apply', () => {
  it('keeps the draft on cancel and changes only local draft after explicit confirmation', () => {
    const { rerender } = renderRunner(makeShare());
    expect(screen.getByRole('dialog', { name: 'So sánh trước khi áp dụng mã' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }));
    expect(screen.getByLabelText('Lesson code editor')).toHaveValue('print("draft")');

    const queryClient = new QueryClient();
    rerender(<QueryClientProvider client={queryClient}><LessonCodeRunner
      lessonId="lesson-1" courseId="course-1" language="python" exerciseId="exercise-1"
      initialCode={'print("draft")'} requestedShare={makeShare()} onApplyHandled={vi.fn()}
    /></QueryClientProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận áp dụng' }));
    expect(screen.getByLabelText('Lesson code editor')).toHaveValue('print("solution")');
    expect(screen.getByText(/Run the code currently/)).toBeInTheDocument();
  });

  it('requires explicit confirmation for a language mismatch and traps keyboard focus', () => {
    renderRunner(makeShare({ language: 'javascript' }));
    const confirm = screen.getByRole('button', { name: 'Xác nhận áp dụng' });
    expect(confirm).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox'));
    expect(confirm).toBeEnabled();
    confirm.focus();
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Đóng' }));
  });
});
