import {
  normalizeCodeAssignment,
  normalizeCodeAssignments,
  type CodeAssignmentWire,
} from './code-assignment-normalizer';

const assignment = (identifier: Partial<Pick<CodeAssignmentWire, 'id' | '_id'>>): CodeAssignmentWire => ({
  ...identifier,
  lessonId: 'lesson-1',
  title: 'Sum two values',
  description: '',
  starterCode: '',
  language: 'javascript',
  testCases: [],
  totalTestCases: 0,
  publicTestCases: 0,
  status: 'DRAFT',
  timeLimitMs: 1000,
  memoryLimitKb: 131072,
});

describe('code assignment API normalization', () => {
  it('maps the backend public id to the stable frontend _id', () => {
    expect(normalizeCodeAssignment(assignment({ id: 'assignment-1' }))).toMatchObject({ id: 'assignment-1', _id: 'assignment-1' });
  });

  it('keeps compatibility with legacy _id responses', () => {
    expect(normalizeCodeAssignment(assignment({ _id: 'assignment-legacy' }))).toMatchObject({ id: 'assignment-legacy', _id: 'assignment-legacy' });
  });

  it('deduplicates list entries by their canonical identifier', () => {
    expect(normalizeCodeAssignments([
      assignment({ id: 'assignment-1' }),
      assignment({ _id: 'assignment-1' }),
      assignment({ id: 'assignment-2' }),
    ]).map((item) => item._id)).toEqual(['assignment-1', 'assignment-2']);
  });

  it('rejects missing or conflicting identifiers', () => {
    expect(() => normalizeCodeAssignment(assignment({}))).toThrow('missing a stable identifier');
    expect(() => normalizeCodeAssignment(assignment({ id: 'public-id', _id: 'other-id' }))).toThrow('conflicting id and _id');
  });
});
