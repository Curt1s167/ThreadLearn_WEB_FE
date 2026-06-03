'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Save, Trash2, X, FlaskConical, Code2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button, Card, CodeEditor, EmptyState, Skeleton } from '@/components/shared';
import { coursesService, lessonsService, exercisesService } from '@/services';
import type { Course, Lesson } from '@/types';

interface TestCaseForm {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  points: number;
}

interface ExerciseForm {
  title: string;
  description: string;
  starterCode: string;
  language: string;
  timeLimitMs: number;
  testCases: TestCaseForm[];
}

const emptyForm: ExerciseForm = {
  title: '',
  description: '',
  starterCode: '',
  language: 'javascript',
  timeLimitMs: 5000,
  testCases: [{ input: '', expectedOutput: '', isHidden: false, points: 1 }],
};

export default function AdminExercises() {
  const queryClient = useQueryClient();
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ExerciseForm>(emptyForm);

  const { data: coursesPage, isLoading: coursesLoading } = useQuery({
    queryKey: ['admin-courses-list'],
    queryFn: () => coursesService.list({ limit: 100, includeAll: true }),
  });
  const courses = coursesPage?.items ?? [];

  const { data: lessons, isLoading: lessonsLoading } = useQuery({
    queryKey: ['admin-lessons', selectedCourseId],
    queryFn: () => lessonsService.getByCourse(selectedCourseId),
    enabled: !!selectedCourseId,
  });

  const { data: exercises, isLoading: exercisesLoading } = useQuery({
    queryKey: ['admin-exercises', selectedLessonId],
    queryFn: () => exercisesService.listByLesson(selectedLessonId),
    enabled: !!selectedLessonId,
  });

  // Auto-select first course/lesson once loaded so admin lands somewhere useful.
  useEffect(() => {
    if (!selectedCourseId && courses.length) {
      setSelectedCourseId(courses[0]._id);
    }
  }, [courses, selectedCourseId]);

  useEffect(() => {
    if (!selectedLessonId && lessons?.length) {
      setSelectedLessonId((lessons[0] as Lesson)._id);
    }
    if (selectedLessonId && lessons?.length && !lessons.some((l: Lesson) => l._id === selectedLessonId)) {
      setSelectedLessonId(lessons[0]._id);
    }
  }, [lessons, selectedLessonId]);

  const courseLanguage = useMemo(
    () => courses.find((c) => c._id === selectedCourseId)?.language,
    [courses, selectedCourseId]
  );

  useEffect(() => {
    if (!editingId && courseLanguage) {
      setForm((prev) => ({ ...prev, language: courseLanguage as string }));
    }
  }, [editingId, courseLanguage]);

  const resetForm = () => {
    setEditingId(null);
    setForm({ ...emptyForm, language: (courseLanguage as string) ?? 'javascript' });
  };

  const startEdit = (ex: any) => {
    setEditingId(ex._id);
    setForm({
      title: ex.title ?? '',
      description: ex.description ?? '',
      starterCode: ex.starterCode ?? '',
      language: ex.language ?? 'javascript',
      timeLimitMs: ex.timeLimitMs ?? 5000,
      testCases: (ex.testCases?.length ? ex.testCases : [{ input: '', expectedOutput: '', isHidden: false, points: 1 }]).map(
        (tc: any) => ({
          input: tc.input ?? '',
          expectedOutput: tc.expectedOutput ?? '',
          isHidden: !!tc.isHidden,
          points: tc.points ?? 1,
        })
      ),
    });
  };

  const updateTestCase = (idx: number, patch: Partial<TestCaseForm>) => {
    setForm((prev) => ({
      ...prev,
      testCases: prev.testCases.map((tc, i) => (i === idx ? { ...tc, ...patch } : tc)),
    }));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        lessonId: selectedLessonId,
        title: form.title.trim(),
        description: form.description.trim(),
        starterCode: form.starterCode,
        language: form.language,
        timeLimitMs: Number(form.timeLimitMs),
        testCases: form.testCases
          .filter((tc) => tc.expectedOutput.length > 0)
          .map((tc) => ({
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            isHidden: tc.isHidden,
            points: Number(tc.points) || 1,
          })),
      };
      if (!payload.title) throw new Error('Title is required.');
      if (!payload.testCases.length) throw new Error('At least one test case with expected output is required.');
      if (editingId) {
        return exercisesService.update(editingId, payload);
      }
      return exercisesService.create(payload);
    },
    onSuccess: () => {
      toast.success(editingId ? 'Exercise updated.' : 'Exercise created.');
      queryClient.invalidateQueries({ queryKey: ['admin-exercises', selectedLessonId] });
      resetForm();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Save failed.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => exercisesService.remove(id),
    onSuccess: () => {
      toast.success('Exercise deleted.');
      queryClient.invalidateQueries({ queryKey: ['admin-exercises', selectedLessonId] });
      if (editingId) resetForm();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? 'Delete failed.'),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <FlaskConical size={16} className="text-violet-400" />
        <h1 className="font-mono font-bold text-lg text-gray-100">Exercises (UC66)</h1>
      </div>

      <Card className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wide text-gray-600 font-mono">Course</span>
          <select
            value={selectedCourseId}
            onChange={(e) => {
              setSelectedCourseId(e.target.value);
              setSelectedLessonId('');
              resetForm();
            }}
            className="input-field text-xs"
          >
            <option value="">{coursesLoading ? 'Loading…' : 'Select course'}</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title} {c.status ? `· ${c.status}` : ''}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wide text-gray-600 font-mono">Lesson</span>
          <select
            value={selectedLessonId}
            onChange={(e) => {
              setSelectedLessonId(e.target.value);
              resetForm();
            }}
            className="input-field text-xs"
            disabled={!selectedCourseId}
          >
            <option value="">{lessonsLoading ? 'Loading…' : 'Select lesson'}</option>
            {(lessons as Lesson[] | undefined)?.map((l) => (
              <option key={l._id} value={l._id}>
                {l.title}
              </option>
            ))}
          </select>
        </label>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
        {/* Exercise list for the chosen lesson */}
        <Card className="p-3 flex flex-col gap-2 max-h-[60vh] overflow-auto">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-mono text-gray-500">Exercises</span>
            <Button
              size="sm"
              variant="outline"
              onClick={resetForm}
              disabled={!selectedLessonId}
              title="New exercise"
            >
              <Plus size={12} />
              New
            </Button>
          </div>
          {!selectedLessonId ? (
            <EmptyState icon={<Code2 size={18} />} title="Pick a lesson" description="Chọn course + lesson để xem exercises." />
          ) : exercisesLoading ? (
            <>
              <Skeleton className="h-10 rounded-lg" />
              <Skeleton className="h-10 rounded-lg" />
            </>
          ) : !exercises?.length ? (
            <EmptyState icon={<FlaskConical size={18} />} title="No exercises" description="Tạo exercise đầu tiên ở khung phải." />
          ) : (
            exercises.map((ex: any) => (
              <div
                key={ex._id}
                className={`group rounded-lg border px-2 py-2 transition-colors ${
                  editingId === ex._id
                    ? 'bg-violet-500/10 border-violet-500/30'
                    : 'border-white/[0.06] hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <button onClick={() => startEdit(ex)} className="flex-1 text-left">
                    <p className="text-xs font-mono text-gray-200 truncate">{ex.title}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Badge color="purple">{ex.language}</Badge>
                      <span className="text-[10px] text-gray-600 font-mono">
                        {ex.testCases?.length ?? 0} cases · {ex.totalPoints ?? 0} pts
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete exercise "${ex.title}"?`)) deleteMutation.mutate(ex._id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-rose-400 hover:text-rose-300"
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </Card>

        {/* Editor */}
        <Card className="p-4 flex flex-col gap-3">
          {!selectedLessonId ? (
            <EmptyState
              icon={<FlaskConical size={20} />}
              title="Select a lesson first"
              description="Chọn course + lesson để bắt đầu tạo exercise."
            />
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-mono text-gray-200">
                  {editingId ? 'Edit exercise' : 'New exercise'}
                </h2>
                {editingId && (
                  <Button size="sm" variant="ghost" onClick={resetForm}>
                    <X size={12} />
                    Cancel
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] uppercase tracking-wide text-gray-600 font-mono">Title</span>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    className="input-field text-xs"
                    placeholder="Sum two numbers"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] uppercase tracking-wide text-gray-600 font-mono">Language</span>
                  <select
                    value={form.language}
                    onChange={(e) => setForm((p) => ({ ...p, language: e.target.value }))}
                    className="input-field text-xs"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                    <option value="c">C</option>
                  </select>
                </label>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wide text-gray-600 font-mono">Description</span>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="input-field text-xs resize-y"
                  placeholder="Problem statement…"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wide text-gray-600 font-mono">Starter code</span>
                <CodeEditor
                  value={form.starterCode}
                  onChange={(v) => setForm((p) => ({ ...p, starterCode: v }))}
                  language={form.language}
                  height={200}
                />
              </label>

              <label className="flex flex-col gap-1 max-w-44">
                <span className="text-[11px] uppercase tracking-wide text-gray-600 font-mono">
                  Time limit (ms)
                </span>
                <input
                  type="number"
                  min={100}
                  max={30000}
                  value={form.timeLimitMs}
                  onChange={(e) => setForm((p) => ({ ...p, timeLimitMs: Number(e.target.value) }))}
                  className="input-field text-xs"
                />
              </label>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] uppercase tracking-wide text-gray-600 font-mono">Test cases</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setForm((p) => ({
                        ...p,
                        testCases: [...p.testCases, { input: '', expectedOutput: '', isHidden: false, points: 1 }],
                      }))
                    }
                  >
                    <Plus size={12} />
                    Add case
                  </Button>
                </div>
                <div className="flex flex-col gap-2">
                  {form.testCases.map((tc, idx) => (
                    <div key={idx} className="rounded-lg border border-white/[0.06] p-2 grid grid-cols-1 md:grid-cols-2 gap-2 bg-black/20">
                      <div className="flex items-center justify-between md:col-span-2">
                        <span className="text-[11px] text-gray-500 font-mono">Case #{idx + 1}</span>
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] text-gray-500 font-mono flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={tc.isHidden}
                              onChange={(e) => updateTestCase(idx, { isHidden: e.target.checked })}
                            />
                            hidden
                          </label>
                          <label className="text-[11px] text-gray-500 font-mono flex items-center gap-1">
                            pts
                            <input
                              type="number"
                              min={0}
                              value={tc.points}
                              onChange={(e) => updateTestCase(idx, { points: Number(e.target.value) })}
                              className="input-field text-[11px] w-14"
                            />
                          </label>
                          {form.testCases.length > 1 && (
                            <button
                              onClick={() =>
                                setForm((p) => ({
                                  ...p,
                                  testCases: p.testCases.filter((_, i) => i !== idx),
                                }))
                              }
                              className="text-rose-400 hover:text-rose-300"
                              title="Remove"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                      <textarea
                        value={tc.input}
                        onChange={(e) => updateTestCase(idx, { input: e.target.value })}
                        placeholder="stdin"
                        rows={2}
                        spellCheck={false}
                        className="input-field text-[11px] font-mono bg-black/30 resize-y"
                      />
                      <textarea
                        value={tc.expectedOutput}
                        onChange={(e) => updateTestCase(idx, { expectedOutput: e.target.value })}
                        placeholder="expected stdout"
                        rows={2}
                        spellCheck={false}
                        className="input-field text-[11px] font-mono bg-black/30 resize-y"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
                  <Save size={12} />
                  {editingId ? 'Update' : 'Create'}
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
