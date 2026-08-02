'use client';

import dynamic from 'next/dynamic';
import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit3, Eye, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmModal } from '../../components/shared/Modal';
import { codeAssignmentService, coursesService, lessonsService } from '../../services';
import { useUIStore } from '../../store';
import type { AssignmentPayload, AssignmentTestCase, CodeAssignment } from '../../types';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });
const DELETE_ASSIGNMENT_MODAL = 'delete-code-assignment';

type FormTestCase = NonNullable<AssignmentPayload['testCases']>[number] & { clientId: string };
type AssignmentForm = Omit<AssignmentPayload, 'testCases'> & { testCases: FormTestCase[] };
type Identified = { _id?: string; id?: string };

const entityId = (entity: Identified): string | null => {
  const id = entity.id?.trim();
  const mongoId = entity._id?.trim();
  if (id && mongoId && id !== mongoId) return null;
  return id ?? mongoId ?? null;
};

const createTestCase = (isHidden = false): FormTestCase => ({
  clientId: crypto.randomUUID(),
  input: '',
  expectedOutput: '',
  isHidden,
});

const emptyForm = (): AssignmentForm => ({
  lessonId: '',
  title: '',
  description: '',
  starterCode: '',
  language: 'javascript',
  testCases: [createTestCase(), createTestCase(true)],
  timeLimitMs: 5000,
  memoryLimitKb: 131072,
  status: 'DRAFT',
  deadline: null,
  maxSubmissions: null,
});

const assignmentForm = (assignment: CodeAssignment): AssignmentForm => ({
  lessonId: assignment.lessonId,
  title: assignment.title,
  description: assignment.description,
  starterCode: assignment.starterCode,
  language: assignment.language,
  testCases: assignment.testCases.map((test) => ({
    clientId: test.id ?? crypto.randomUUID(),
    input: test.input ?? '',
    expectedOutput: test.expectedOutput ?? '',
    isHidden: test.isHidden,
    points: test.points,
  })),
  timeLimitMs: assignment.timeLimitMs,
  memoryLimitKb: assignment.memoryLimitKb,
  status: assignment.status,
  deadline: assignment.deadline ? new Date(assignment.deadline).toISOString().slice(0, 16) : null,
  maxSubmissions: assignment.maxSubmissions ?? null,
});

export function AdminCodeAssignmentsPage() {
  const client = useQueryClient();
  const { openModal } = useUIStore();
  const editRequest = useRef(0);
  const [editing, setEditing] = useState<CodeAssignment | null>(null);
  const [assignmentToDelete, setAssignmentToDelete] = useState<CodeAssignment | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [linkedLessonError, setLinkedLessonError] = useState<string | null>(null);
  const [form, setForm] = useState<AssignmentForm>(emptyForm());
  const assignments = useQuery({ queryKey: ['admin-code-assignments'], queryFn: codeAssignmentService.listAllForAdmin });
  const courses = useQuery({ queryKey: ['admin-code-assignment-courses'], queryFn: () => coursesService.list({ limit: 100 }) });
  const lessons = useQuery({
    queryKey: ['admin-code-assignment-lessons', selectedCourseId],
    queryFn: () => lessonsService.getByCourse(selectedCourseId),
    enabled: Boolean(selectedCourseId),
  });
  const assignmentSubmissions = useQuery({
    queryKey: ['admin-code-assignment-submissions', editing?._id],
    queryFn: () => codeAssignmentService.submissionsForAdmin(editing!._id),
    enabled: Boolean(editing?._id),
  });
  const testCases = useMemo(() => form.testCases, [form.testCases]);
  const validCourses = useMemo(() => (courses.data?.items ?? []).flatMap((course) => {
    const id = entityId(course);
    return id ? [{ course, id }] : [];
  }), [courses.data?.items]);
  const validLessons = useMemo(() => (lessons.data ?? []).flatMap((lesson) => {
    const id = entityId(lesson);
    return id ? [{ lesson, id }] : [];
  }), [lessons.data]);
  const warning = useMemo(() => ({
    public: testCases.filter((test) => !test.isHidden).length,
    hidden: testCases.filter((test) => test.isHidden).length,
  }), [testCases]);

  const resetEditor = () => {
    editRequest.current += 1;
    setEditing(null);
    setSelectedCourseId('');
    setLinkedLessonError(null);
    setForm(emptyForm());
  };

  const save = useMutation({
    mutationFn: () => {
      const { testCases: formTestCases, ...payload } = form;
      const cleanPayload = { ...payload, testCases: formTestCases.map(({ clientId, ...testCase }) => testCase) };
      return editing
        ? codeAssignmentService.update(editing._id, cleanPayload)
        : codeAssignmentService.create(cleanPayload);
    },
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['admin-code-assignments'] }),
        client.invalidateQueries({ queryKey: ['lesson-code-assignments', form.lessonId] }),
      ]);
      resetEditor();
      toast.success('Code assignment saved');
    },
    onError: (error: any) => toast.error(error?.response?.data?.message ?? 'Could not save assignment'),
  });
  const remove = useMutation({
    mutationFn: codeAssignmentService.remove,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['admin-code-assignments'] });
      setAssignmentToDelete(null);
      toast.success('Code assignment deleted');
    },
    onError: () => toast.error('Could not delete assignment'),
  });

  const selectCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    setLinkedLessonError(null);
    setForm((current) => ({ ...current, lessonId: '' }));
  };

  const edit = async (assignment: CodeAssignment) => {
    const request = editRequest.current + 1;
    editRequest.current = request;
    setEditing(assignment);
    setForm(assignmentForm(assignment));
    setSelectedCourseId('');
    setLinkedLessonError(null);
    try {
      const lesson = await client.fetchQuery({
        queryKey: ['admin-code-assignment-linked-lesson', assignment.lessonId],
        queryFn: () => lessonsService.getById(assignment.lessonId),
      });
      const courseId = lesson.courseId?.trim();
      if (request !== editRequest.current) return;
      if (!courseId) {
        setLinkedLessonError('The linked lesson is missing a stable identifier. Choose another lesson before saving.');
        return;
      }
      setSelectedCourseId(lesson.courseId);
    } catch {
      if (request === editRequest.current) {
        setLinkedLessonError('The lesson linked to this assignment no longer exists. Choose a valid course and lesson before saving.');
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateTest = (clientId: string, field: keyof AssignmentTestCase, value: string | boolean) => {
    setForm((current) => ({
      ...current,
      testCases: current.testCases.map((test) => test.clientId === clientId ? { ...test, [field]: value } : test),
    }));
  };

  const isSaveDisabled = save.isPending || !selectedCourseId || !form.lessonId || !form.title || Boolean(linkedLessonError) || lessons.isLoading;

  return <main className="mx-auto max-w-7xl space-y-6 p-6">
    <header className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-black/45">Admin</p>
      <h1 className="mt-2 text-3xl font-semibold text-ink">Code Assignments</h1>
      <p className="mt-2 text-sm text-black/60">Choose a course and lesson, then configure visible and hidden tests. Published assignments appear at the end of that lesson.</p>
    </header>

    <section className="rounded-xl border border-black/10 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">{editing ? 'Edit assignment' : 'New assignment'}</h2>
        {editing ? <button type="button" onClick={resetEditor} className="text-sm text-black/60">Cancel edit</button> : null}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <select aria-label="Course" value={selectedCourseId} onChange={(event) => selectCourse(event.target.value)} disabled={editing !== null || courses.isLoading} className="rounded-md border border-black/15 p-2 text-sm disabled:bg-black/[0.03]">
          <option value="">{courses.isLoading ? 'Loading courses…' : 'Select a course'}</option>
          {validCourses.map(({ course, id }) => <option key={id} value={id}>{course.title}{course.status ? ` (${course.status})` : ''}</option>)}
        </select>
        <select aria-label="Lesson" value={form.lessonId} onChange={(event) => { setLinkedLessonError(null); setForm((current) => ({ ...current, lessonId: event.target.value })); }} disabled={editing !== null || !selectedCourseId || lessons.isLoading || lessons.isError} className="rounded-md border border-black/15 p-2 text-sm disabled:bg-black/[0.03]">
          <option value="">{!selectedCourseId ? 'Select a course first' : lessons.isLoading ? 'Loading lessons…' : lessons.isError ? 'Could not load lessons' : validLessons.length ? 'Select a lesson' : 'No lessons in this course'}</option>
          {validLessons.map(({ lesson, id }) => <option key={id} value={id}>{lesson.title}{lesson.lessonType ? ` (${lesson.lessonType})` : ''}</option>)}
        </select>
        <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Assignment title" className="rounded-md border border-black/15 p-2 text-sm" />
        <select aria-label="Language" value={form.language} onChange={(event) => setForm({ ...form, language: event.target.value as AssignmentPayload['language'] })} className="rounded-md border border-black/15 p-2 text-sm"><option value="javascript">JavaScript</option><option value="python">Python</option><option value="java">Java</option><option value="cpp">C++</option><option value="c">C</option></select>
        <select aria-label="Status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as AssignmentPayload['status'] })} className="rounded-md border border-black/15 p-2 text-sm"><option value="DRAFT">Draft — students cannot see it</option><option value="PUBLISHED">Published — visible at the end of the lesson</option><option value="CLOSED">Closed — students cannot start it</option></select>
        <input type="number" min="100" value={form.timeLimitMs ?? 5000} onChange={(event) => setForm({ ...form, timeLimitMs: Number(event.target.value) })} placeholder="Time limit ms" className="rounded-md border border-black/15 p-2 text-sm" />
        <input type="number" min="16384" value={form.memoryLimitKb ?? 131072} onChange={(event) => setForm({ ...form, memoryLimitKb: Number(event.target.value) })} placeholder="Memory limit KB" className="rounded-md border border-black/15 p-2 text-sm" />
        <input type="number" min="1" value={form.maxSubmissions ?? ''} onChange={(event) => setForm({ ...form, maxSubmissions: event.target.value ? Number(event.target.value) : null })} placeholder="Unlimited submissions" className="rounded-md border border-black/15 p-2 text-sm" />
        <input type="datetime-local" value={form.deadline ?? ''} onChange={(event) => setForm({ ...form, deadline: event.target.value || null })} className="rounded-md border border-black/15 p-2 text-sm" />
      </div>
      {courses.isError ? <p className="mt-2 text-sm text-rose-700">Could not load courses. Reload the page and try again.</p> : null}
      {editing ? <p className="mt-2 text-sm text-black/55">The linked course and lesson are fixed after creation. Create a new assignment to target another lesson.</p> : null}
      {selectedCourseId && !lessons.isLoading && !lessons.isError && !validLessons.length ? <p className="mt-2 text-sm text-amber-700">This course does not contain any active lessons yet.</p> : null}
      {linkedLessonError ? <p role="alert" className="mt-2 text-sm text-rose-700">{linkedLessonError}</p> : null}
      <textarea value={form.description ?? ''} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Problem description" rows={5} className="mt-3 w-full rounded-md border border-black/15 p-2 text-sm" />
      <div className="mt-3 overflow-hidden rounded-md border border-black/15"><p className="bg-black/[0.03] px-3 py-2 text-xs font-semibold">Starter code</p><MonacoEditor height="220px" language={form.language === 'cpp' ? 'cpp' : form.language} value={form.starterCode ?? ''} onChange={(value) => setForm({ ...form, starterCode: value ?? '' })} options={{ minimap: { enabled: false }, automaticLayout: true }} /></div>
      <div className="mt-5">
        <div className="flex items-center justify-between"><h3 className="font-semibold">Test cases</h3><button type="button" onClick={() => setForm({ ...form, testCases: [...testCases, createTestCase()] })} className="inline-flex items-center gap-1 text-sm text-indigo-700"><Plus size={15} /> Add test</button></div>
        <p className={`mt-1 text-xs ${warning.public && warning.hidden ? 'text-emerald-700' : 'text-amber-700'}`}>{warning.public} public · {warning.hidden} hidden. Published assignments should have both.</p>
        <div className="mt-3 space-y-3">{testCases.map((test, index) => <div key={test.clientId} className="rounded-lg border border-black/10 p-3"><div className="mb-2 flex items-center justify-between"><label className="inline-flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={test.isHidden} onChange={(event) => updateTest(test.clientId, 'isHidden', event.target.checked)} /> Hidden test</label><button type="button" aria-label={`Remove test ${index + 1}`} onClick={() => setForm({ ...form, testCases: testCases.filter((item) => item.clientId !== test.clientId) })} className="text-rose-600"><Trash2 size={15} /></button></div><div className="grid gap-2 md:grid-cols-2"><textarea value={test.input ?? ''} onChange={(event) => updateTest(test.clientId, 'input', event.target.value)} placeholder="stdin" rows={3} className="rounded border border-black/15 p-2 font-mono text-xs" /><textarea value={test.expectedOutput ?? ''} onChange={(event) => updateTest(test.clientId, 'expectedOutput', event.target.value)} placeholder="expected output" rows={3} className="rounded border border-black/15 p-2 font-mono text-xs" /></div></div>)}</div>
      </div>
      <button type="button" disabled={isSaveDisabled} onClick={() => save.mutate()} className="mt-5 inline-flex items-center gap-2 rounded-md bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><Save size={15} /> {save.isPending ? 'Saving…' : 'Save assignment'}</button>
    </section>

    {editing ? <section className="overflow-hidden rounded-xl border border-black/10 bg-white"><div className="border-b border-black/10 p-5"><h2 className="font-semibold">Submissions for {editing.title}</h2></div>{assignmentSubmissions.isLoading ? <p className="p-5 text-sm text-black/50">Loading submissions…</p> : <div className="divide-y divide-black/10">{assignmentSubmissions.data?.items.map((submission) => <details key={submission._id} className="p-4"><summary className="cursor-pointer text-sm"><span className="font-medium">Attempt {submission.attemptNumber}</span> · {submission.score}% · {submission.verdict ?? submission.submissionStatus} · {new Date(submission.submittedAt).toLocaleString()}</summary><div className="mt-3 grid gap-3 lg:grid-cols-2"><pre className="overflow-auto rounded bg-slate-950 p-3 text-xs text-lime-200">{submission.sourceCode}</pre><div className="text-sm text-black/65"><p>{submission.testCasesPassed}/{submission.totalTestCases} tests · {submission.executionTime}s · {submission.memoryUsage} KB</p>{submission.aiFeedback?.summary ? <p className="mt-2">AI: {submission.aiFeedback.summary}</p> : null}{submission.similarityResult ? <p className="mt-2 text-amber-700">Similarity warning: {(submission.similarityResult.similarityScore * 100).toFixed(1)}%</p> : null}</div></div></details>)}{!assignmentSubmissions.data?.items.length ? <p className="p-5 text-sm text-black/50">No submissions yet.</p> : null}</div>}</section> : null}
    <section className="overflow-hidden rounded-xl border border-black/10 bg-white"><div className="border-b border-black/10 p-5"><h2 className="font-semibold">Configured assignments</h2></div>{assignments.isLoading ? <p className="p-5 text-sm text-black/50">Loading…</p> : <div className="divide-y divide-black/10">{assignments.data?.map((assignment) => <div key={assignment._id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-medium">{assignment.title}</p><p className="text-xs text-black/55">{assignment.status} · {assignment.totalTestCases} tests · lesson {assignment.lessonId.slice(-8)}</p></div><div className="flex gap-2"><a href={`/ide/assignments/${assignment._id}`} className="inline-flex items-center gap-1 rounded-md border border-black/15 px-3 py-2 text-xs"><Eye size={14} /> Preview</a><button type="button" onClick={() => { void edit(assignment); }} className="inline-flex items-center gap-1 rounded-md border border-black/15 px-3 py-2 text-xs"><Edit3 size={14} /> Edit</button><button type="button" aria-label={`Delete ${assignment.title}`} onClick={() => { setAssignmentToDelete(assignment); openModal(DELETE_ASSIGNMENT_MODAL); }} className="rounded-md border border-rose-200 px-3 py-2 text-xs text-rose-700"><Trash2 size={14} /></button></div></div>)}{!assignments.data?.length ? <p className="p-5 text-sm text-black/50">No assignments yet.</p> : null}</div>}</section>
    <ConfirmModal
      name={DELETE_ASSIGNMENT_MODAL}
      title="Delete code assignment"
      description={assignmentToDelete ? `Delete “${assignmentToDelete.title}”? Students will no longer be able to open or submit this assignment.` : 'Delete this code assignment?'}
      confirmLabel="Delete assignment"
      danger
      onConfirm={() => { if (assignmentToDelete) remove.mutate(assignmentToDelete._id); }}
    />
  </main>;
}
