import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AssignmentWorkspace } from './AssignmentWorkspace';
import { codeAssignmentService, codeExecutionService } from '../../services';

vi.mock('next/dynamic', () => ({
  default: () => ({ value, onChange }: { value?: string; onChange?: (value: string) => void }) => (
    <textarea aria-label="Code editor" value={value ?? ''} onChange={(event) => onChange?.(event.target.value)} />
  ),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock('../../store', () => ({
  useAuthStore: (selector: (state: { user: { _id: string } }) => unknown) => selector({ user: { _id: 'student-1' } }),
}));

vi.mock('../../services', () => ({
  codeAssignmentService: {
    get: vi.fn(),
    historyMine: vi.fn(),
    runPublic: vi.fn(),
    submit: vi.fn(),
  },
  codeExecutionService: { run: vi.fn() },
}));

const assignment = {
  _id: 'assignment-1',
  lessonId: 'lesson-1',
  title: 'Sum numbers',
  description: 'Read N numbers and print their sum.',
  starterCode: 'console.log(0);',
  language: 'javascript',
  testCases: [{ index: 0, input: '5\n1 2 3 4 5', expectedOutput: '15', isHidden: false }],
  totalTestCases: 2,
  publicTestCases: 1,
  status: 'PUBLISHED',
  deadline: null,
  maxSubmissions: 5,
  timeLimitMs: 5000,
  memoryLimitKb: 131072,
};

function renderWorkspace() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><AssignmentWorkspace assignmentId="assignment-1" /></QueryClientProvider>);
}

describe('AssignmentWorkspace run experience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    vi.mocked(codeAssignmentService.get).mockResolvedValue(assignment as any);
    vi.mocked(codeAssignmentService.historyMine).mockResolvedValue({ items: [], total: 0, page: 1, limit: 20, totalPages: 0 } as any);
  });

  it('shows public input and preserves an execution error when actual output is empty', async () => {
    vi.mocked(codeAssignmentService.runPublic).mockResolvedValue({
      exerciseId: 'assignment-1', verdict: 'ERROR', testCasesPassed: 0, totalTestCases: 1,
      score: 0, executionTime: '0.001', memoryUsage: 1000,
      testResults: [{ index: 0, passed: false, isHidden: false, input: '5\n1 2 3 4 5', expectedOutput: '15', actualOutput: '', error: 'SyntaxError: Unexpected token' }],
    });
    renderWorkspace();

    await screen.findByRole('heading', { name: 'Sum numbers' });
    const runPublicButton = screen.getByRole('button', { name: 'Run public tests' });
    await waitFor(() => expect(runPublicButton).toBeEnabled());
    fireEvent.click(runPublicButton);

    expect(await screen.findByText('SyntaxError: Unexpected token')).toBeInTheDocument();
    expect(screen.getByLabelText('Public test 1 input')).toHaveTextContent('5 1 2 3 4 5');
    expect(screen.getByLabelText('Public test 1 actual output')).toHaveTextContent('(no output)');
    expect(codeAssignmentService.runPublic).toHaveBeenCalledWith('assignment-1', {
      sourceCode: 'console.log(0);', language: 'javascript',
    });
  });

  it('runs custom stdin without submitting or invoking assignment grading', async () => {
    vi.mocked(codeExecutionService.run).mockResolvedValue({
      _id: 'execution-1', stdout: '15\n', stderr: '', compileOutput: '',
      status: { id: 3, description: 'Accepted' }, runtime: '0.001', memory: 1000,
      language: 'javascript', languageId: 63, createdAt: new Date().toISOString(),
    });
    renderWorkspace();

    await screen.findByRole('heading', { name: 'Sum numbers' });
    fireEvent.change(screen.getByLabelText('Custom input (stdin)'), { target: { value: '5\n1 2 3 4 5' } });
    const runCustomButton = screen.getByRole('button', { name: 'Run custom input' });
    await waitFor(() => expect(runCustomButton).toBeEnabled());
    fireEvent.click(runCustomButton);

    await waitFor(() => expect(codeExecutionService.run).toHaveBeenCalledWith({
      sourceCode: 'console.log(0);', language: 'javascript', stdin: '5\n1 2 3 4 5',
      lessonId: 'lesson-1', exerciseId: 'assignment-1',
    }));
    expect(await screen.findByText('15')).toBeInTheDocument();
    expect(codeAssignmentService.runPublic).not.toHaveBeenCalled();
    expect(codeAssignmentService.submit).not.toHaveBeenCalled();
  });
});
