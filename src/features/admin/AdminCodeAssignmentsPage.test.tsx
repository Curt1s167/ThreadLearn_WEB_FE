import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminCodeAssignmentsPage } from './AdminCodeAssignmentsPage';
import { codeAssignmentService, coursesService, lessonsService } from '../../services';
import { useUIStore } from '../../store';

vi.mock('next/dynamic', () => ({
  default: () => () => <textarea aria-label="Starter code editor" />,
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock('../../services', () => ({
  codeAssignmentService: {
    listAllForAdmin: vi.fn(),
    submissionsForAdmin: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
  coursesService: { list: vi.fn() },
  lessonsService: { getByCourse: vi.fn(), getById: vi.fn() },
}));

const course = (_id: string, title: string) => ({ _id, id: _id, title, status: 'published' });
const lesson = (_id: string, courseId: string, title: string) => ({ _id, id: _id, courseId, title, lessonType: 'article' });

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><AdminCodeAssignmentsPage /></QueryClientProvider>);
}

describe('AdminCodeAssignmentsPage course and lesson selector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUIStore.getState().closeModal();
    vi.mocked(codeAssignmentService.listAllForAdmin).mockResolvedValue([]);
    vi.mocked(coursesService.list).mockResolvedValue({
      items: [course('course-a', 'Course A'), course('course-b', 'Course B')], total: 2, page: 1, limit: 100, totalPages: 1,
    } as any);
    vi.mocked(lessonsService.getByCourse).mockImplementation(async (courseId) => courseId === 'course-a'
      ? [lesson('lesson-a', 'course-a', 'Lesson A')]
      : [lesson('lesson-b', 'course-b', 'Lesson B')]);
  });

  it('loads lessons for the selected course and resets the prior lesson when the course changes', async () => {
    renderPage();

    const courseSelect = await screen.findByLabelText('Course');
    const lessonSelect = screen.getByLabelText('Lesson');
    expect(lessonSelect).toBeDisabled();
    await waitFor(() => expect(courseSelect).toBeEnabled());

    fireEvent.change(courseSelect, { target: { value: 'course-a' } });
    expect(courseSelect).toHaveValue('course-a');
    await waitFor(() => expect(lessonsService.getByCourse).toHaveBeenCalledWith('course-a'));
    await waitFor(() => expect(screen.getByLabelText('Lesson')).toContainHTML('Lesson A'));
    fireEvent.change(lessonSelect, { target: { value: 'lesson-a' } });
    expect(lessonSelect).toHaveValue('lesson-a');

    fireEvent.change(courseSelect, { target: { value: 'course-b' } });
    await waitFor(() => expect(screen.getByLabelText('Lesson')).toContainHTML('Lesson B'));
    expect(lessonSelect).toHaveValue('');
    expect(lessonsService.getByCourse).toHaveBeenCalledWith('course-b');
  });

  it('creates an assignment with the selected lesson id instead of a manually entered id', async () => {
    vi.mocked(codeAssignmentService.create).mockResolvedValue({} as any);
    renderPage();

    const courseSelect = await screen.findByLabelText('Course');
    await waitFor(() => expect(courseSelect).toBeEnabled());
    fireEvent.change(courseSelect, { target: { value: 'course-a' } });
    await waitFor(() => expect(lessonsService.getByCourse).toHaveBeenCalledWith('course-a'));
    await waitFor(() => expect(screen.getByLabelText('Lesson')).toContainHTML('Lesson A'));
    fireEvent.change(screen.getByLabelText('Lesson'), { target: { value: 'lesson-a' } });
    fireEvent.change(screen.getByPlaceholderText('Assignment title'), { target: { value: 'Assignment for lesson A' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save assignment' }));

    await waitFor(() => expect(codeAssignmentService.create).toHaveBeenCalledWith(expect.objectContaining({
      lessonId: 'lesson-a',
      title: 'Assignment for lesson A',
    })));
  });

  it('uses the project confirmation modal before deleting an assignment', async () => {
    const configuredAssignment = {
      _id: 'assignment-1', lessonId: 'lesson-a', title: 'Assignment for lesson A', status: 'PUBLISHED',
      totalTestCases: 2, testCases: [], language: 'javascript', description: '', starterCode: '',
      timeLimitMs: 5000, memoryLimitKb: 131072,
    };
    vi.mocked(codeAssignmentService.listAllForAdmin).mockResolvedValue([configuredAssignment] as any);
    vi.mocked(codeAssignmentService.remove).mockResolvedValue({ id: 'assignment-1' } as any);
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Delete Assignment for lesson A' }));
    expect(screen.getByRole('heading', { name: 'Delete code assignment' })).toBeInTheDocument();
    expect(screen.getByText(/Students will no longer be able/)).toBeInTheDocument();
    expect(codeAssignmentService.remove).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Delete assignment' }));
    await waitFor(() => expect(vi.mocked(codeAssignmentService.remove).mock.calls[0]?.[0]).toBe('assignment-1'));
  });
});
