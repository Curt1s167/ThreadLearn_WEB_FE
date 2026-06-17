'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit3, Eye, EyeOff, Plus, Save, Search, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button, Card, EmptyState, Skeleton } from '@/components/shared';
import { coursesService, lessonsService, sectionsService } from '@/services';
import type { Course, CourseCreatePayload, CourseLevel, CourseStatus, Lesson, Section } from '@/types';

const emptyForm: CourseCreatePayload = {
  title: '',
  description: '',
  shortDescription: '',
  language: 'javascript',
  level: 'BEGINNER',
  status: 'draft',
  isPremium: false,
  price: 0,
  tags: [],
  category: '',
  estimatedDuration: 0,
  prerequisites: [],
  prerequisiteThreshold: 80,
};

interface LessonFormState {
  title: string;
  description: string;
  contentMarkdown: string;
  lessonType: 'article' | 'video' | 'coding' | 'mixed';
  isPreview: boolean;
  videoUrl: string;
  estimatedTime: number;
  codeSnippets: { language: string; code: string; description?: string }[];
  sectionId: string;
}

const emptyLessonForm: LessonFormState = {
  title: '',
  description: '',
  contentMarkdown: '',
  lessonType: 'article',
  isPreview: false,
  videoUrl: '',
  estimatedTime: 0,
  codeSnippets: [],
  sectionId: '',
};

export default function AdminCourses() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Course | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [form, setForm] = useState<CourseCreatePayload>(emptyForm);
  const [lessonForm, setLessonForm] = useState<LessonFormState>(emptyLessonForm);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-courses', search],
    queryFn: () => coursesService.list({ search: search || undefined, includeAll: true, limit: 50 }),
  });

  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!form.title.trim() || !form.description.trim()) {
        throw new Error('Title and description are required');
      }
      return editing ? coursesService.update(editing._id, form) : coursesService.create(form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      toast.success(editing ? 'Course updated' : 'Course created');
      resetForm();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || error.message || 'Could not save course'),
  });

  const visibilityMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: CourseStatus }) =>
      coursesService.setVisibility(id, status as 'published' | 'hidden' | 'draft'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      toast.success('Course visibility updated');
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Could not update visibility'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => coursesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      toast.success('Course deleted');
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Could not delete course'),
  });

  const startEdit = (course: Course) => {
    setEditing(course);
    setForm({
      title: course.title,
      description: course.description,
      shortDescription: course.shortDescription || '',
      thumbnailUrl: course.thumbnailUrl || '',
      language: course.language,
      level: course.level,
      category: course.category || '',
      status: course.status || 'draft',
      isPremium: !!course.isPremium,
      price: course.price || 0,
      tags: course.tags || [],
      estimatedDuration: course.estimatedDuration || 0,
      prerequisites: course.prerequisites || [],
      prerequisiteThreshold: course.prerequisiteThreshold ?? 80,
    });
  };

  const courses = data?.items ?? [];
  const { data: adminLessons, isLoading: lessonsLoading } = useQuery({
    queryKey: ['admin-lessons', selectedCourse?._id],
    queryFn: () => lessonsService.getByCourse(selectedCourse!._id),
    enabled: !!selectedCourse,
  });

  const { data: adminSections } = useQuery({
    queryKey: ['admin-sections', selectedCourse?._id],
    queryFn: () => sectionsService.listByCourse(selectedCourse!._id),
    enabled: !!selectedCourse,
  });

  const [sectionDraft, setSectionDraft] = useState('');

  const sectionAddMutation = useMutation({
    mutationFn: () =>
      sectionsService.create({
        courseId: selectedCourse!._id,
        title: sectionDraft.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sections', selectedCourse?._id] });
      setSectionDraft('');
      toast.success('Section added');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Could not add section'),
  });

  const sectionDeleteMutation = useMutation({
    mutationFn: (id: string) => sectionsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sections', selectedCourse?._id] });
      queryClient.invalidateQueries({ queryKey: ['admin-lessons', selectedCourse?._id] });
      toast.success('Section deleted');
    },
  });

  const lessonMutation = useMutation({
    mutationFn: () =>
      lessonsService.create({
        courseId: selectedCourse!._id,
        title: lessonForm.title,
        description: lessonForm.description || undefined,
        contentMarkdown: lessonForm.contentMarkdown,
        lessonType: lessonForm.lessonType,
        isPreview: lessonForm.isPreview,
        videoUrl: lessonForm.videoUrl || undefined,
        estimatedTime: lessonForm.estimatedTime || undefined,
        codeSnippets: lessonForm.codeSnippets.filter((s) => s.code.trim()),
        sectionId: lessonForm.sectionId || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-lessons', selectedCourse?._id] });
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      setLessonForm(emptyLessonForm);
      toast.success('Lesson created');
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Could not create lesson'),
  });

  const lockMutation = useMutation({
    mutationFn: ({ id, locked }: { id: string; locked: boolean }) => lessonsService.setLock(id, locked),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-lessons', selectedCourse?._id] });
      toast.success('Lesson lock updated');
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: (id: string) => lessonsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-lessons', selectedCourse?._id] });
      toast.success('Lesson deleted');
    },
  });

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold text-gray-100">Course management</h1>
          <p className="text-sm text-gray-600 font-mono">Create, edit, publish, hide and soft-delete courses.</p>
        </div>
        <div className="relative w-full lg:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="input-field pl-9"
            placeholder="Search admin courses..."
          />
        </div>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 lg:grid-cols-2">
          <input
            className="input-field"
            placeholder="Course title"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
          />
          <div className="flex flex-col gap-1">
            <input
              className="input-field"
              placeholder="Thumbnail URL (or upload below)"
              value={form.thumbnailUrl || ''}
              onChange={(event) => setForm((prev) => ({ ...prev, thumbnailUrl: event.target.value }))}
            />
            {editing && (
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="text-[11px] font-mono text-gray-500 file:mr-2 file:px-2 file:py-1 file:bg-violet-500/10 file:border-0 file:rounded file:text-violet-300 file:text-[11px] file:cursor-pointer hover:file:bg-violet-500/15"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  try {
                    const result = await coursesService.uploadThumbnail(editing._id, file);
                    setForm((prev) => ({ ...prev, thumbnailUrl: result?.thumbnailUrl ?? prev.thumbnailUrl }));
                    queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
                    toast.success('Thumbnail uploaded');
                  } catch (err: any) {
                    toast.error(err?.response?.data?.message ?? 'Upload failed.');
                  }
                  event.target.value = '';
                }}
              />
            )}
            {form.thumbnailUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.thumbnailUrl.startsWith('/uploads/') ? `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL ?? 'http://localhost:5000'}${form.thumbnailUrl}` : form.thumbnailUrl}
                alt="thumbnail preview"
                className="mt-1 max-h-24 rounded border border-white/[0.06] object-cover"
              />
            )}
          </div>
          <textarea
            className="input-field resize-none lg:col-span-2"
            placeholder="Short description"
            rows={2}
            value={form.shortDescription || ''}
            onChange={(event) => setForm((prev) => ({ ...prev, shortDescription: event.target.value }))}
          />
          <textarea
            className="input-field resize-none lg:col-span-2"
            placeholder="Full description"
            rows={4}
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          />
          <select className="input-field" value={form.language} onChange={(event) => setForm((prev) => ({ ...prev, language: event.target.value }))}>
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
          </select>
          <select className="input-field" value={form.level} onChange={(event) => setForm((prev) => ({ ...prev, level: event.target.value as CourseLevel }))}>
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>
          <input
            className="input-field"
            placeholder="Tags, comma separated"
            value={(form.tags || []).join(', ')}
            onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean) }))}
          />
          <input
            className="input-field"
            placeholder="Category (eg. concurrency, algorithms)"
            value={form.category || ''}
            onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
          />
          <input
            className="input-field"
            type="number"
            min={0}
            placeholder="Estimated duration (minutes)"
            value={form.estimatedDuration || 0}
            onChange={(event) => setForm((prev) => ({ ...prev, estimatedDuration: Number(event.target.value) || 0 }))}
          />
          <input
            className="input-field"
            type="number"
            min={1}
            placeholder="Price (USD)"
            value={form.price || 0}
            onChange={(event) => setForm((prev) => ({ ...prev, price: Number(event.target.value) || 0 }))}
            disabled={!form.isPremium}
          />
          <label className="flex items-center gap-2 text-sm text-gray-400 font-mono">
            <input
              type="checkbox"
              checked={!!form.isPremium}
              onChange={(event) => setForm((prev) => ({ ...prev, isPremium: event.target.checked }))}
            />
            Premium course
          </label>
          <div className="lg:col-span-2 grid gap-2 lg:grid-cols-[1fr_140px]">
            <select
              multiple
              className="input-field h-24"
              value={(form.prerequisites || []) as string[]}
              onChange={(event) => {
                const selected = Array.from(event.target.selectedOptions).map((o) => o.value);
                setForm((prev) => ({ ...prev, prerequisites: selected }));
              }}
            >
              {courses
                .filter((c) => c._id !== editing?._id)
                .map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title} ({c.level})
                  </option>
                ))}
            </select>
            <input
              className="input-field"
              type="number"
              min={0}
              max={100}
              placeholder="Threshold %"
              value={form.prerequisiteThreshold ?? 80}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, prerequisiteThreshold: Number(event.target.value) || 0 }))
              }
            />
          </div>
          <p className="lg:col-span-2 text-[11px] text-gray-600 font-mono">
            Prerequisites: Cmd/Ctrl+click để chọn nhiều. Threshold = % progress yêu cầu trên course tiên quyết.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
            {editing ? <Save size={14} /> : <Plus size={14} />}
            {editing ? 'Save changes' : 'Create course'}
          </Button>
          {editing && (
            <Button variant="outline" onClick={resetForm}>
              <X size={14} />
              Cancel
            </Button>
          )}
        </div>
      </Card>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-20 rounded-xl" count={4} />
        </div>
      ) : courses.length > 0 ? (
        <div className="flex flex-col gap-2">
          {courses.map((course) => (
            <Card key={course._id} className="p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-mono text-sm font-semibold text-gray-200 truncate">{course.title}</h2>
                  <Badge color={course.status === 'published' ? 'green' : course.status === 'hidden' ? 'amber' : 'gray'}>
                    {course.status || 'draft'}
                  </Badge>
                  {course.isPremium && <Badge color="amber">Premium</Badge>}
                </div>
                <p className="mt-1 text-xs text-gray-600 font-mono line-clamp-1">{course.shortDescription || course.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => startEdit(course)}>
                  <Edit3 size={12} />
                  Edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedCourse(course)}>
                  Lessons
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => visibilityMutation.mutate({ id: course._id, status: course.status === 'published' ? 'hidden' : 'published' })}
                  loading={visibilityMutation.isPending}
                >
                  {course.status === 'published' ? <EyeOff size={12} /> : <Eye size={12} />}
                  {course.status === 'published' ? 'Hide' : 'Publish'}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => window.confirm('Soft delete this course?') && deleteMutation.mutate(course._id)}
                  loading={deleteMutation.isPending}
                >
                  <Trash2 size={12} />
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="No courses found" description="Create the first course or adjust your search." />
      )}

      {selectedCourse && (
        <Card className="p-4">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-mono text-sm font-semibold text-gray-200">Lessons for {selectedCourse.title}</h2>
              <p className="text-xs text-gray-600 font-mono">Create, lock/unlock and soft-delete lessons.</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setSelectedCourse(null)}>
              <X size={12} />
              Close
            </Button>
          </div>
          <div className="mb-4 rounded-lg border border-white/[0.06] bg-black/20 p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase tracking-wide text-gray-500">
                Sections (UC54) — gom bài học thành chương
              </h3>
              <div className="flex items-center gap-2">
                <input
                  className="input-field text-xs max-w-44"
                  placeholder="Chương mới…"
                  value={sectionDraft}
                  onChange={(event) => setSectionDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && sectionDraft.trim()) sectionAddMutation.mutate();
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  loading={sectionAddMutation.isPending}
                  disabled={!sectionDraft.trim()}
                  onClick={() => sectionAddMutation.mutate()}
                >
                  <Plus size={12} />
                  Add
                </Button>
              </div>
            </div>
            {adminSections && adminSections.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {adminSections.map((s: Section) => (
                  <span
                    key={s._id}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-violet-500/20 bg-violet-500/10 text-[11px] font-mono text-violet-200"
                  >
                    <span>{s.orderIndex + 1}. {s.title}</span>
                    <button
                      onClick={() => window.confirm(`Delete section "${s.title}"?`) && sectionDeleteMutation.mutate(s._id)}
                      className="text-rose-300 hover:text-rose-200"
                      title="Delete section (lessons inside become un-grouped)"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-gray-600 font-mono">
                Chưa có chương nào. Thêm chương trước nếu muốn nhóm các bài học.
              </p>
            )}
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <input
              className="input-field"
              placeholder="Lesson title"
              value={lessonForm.title}
              onChange={(event) => setLessonForm((prev) => ({ ...prev, title: event.target.value }))}
            />
            <select
              className="input-field"
              value={lessonForm.lessonType}
              onChange={(event) => setLessonForm((prev) => ({ ...prev, lessonType: event.target.value as LessonFormState['lessonType'] }))}
            >
              <option value="article">Article</option>
              <option value="video">Video</option>
              <option value="coding">Coding</option>
              <option value="mixed">Mixed</option>
            </select>
            <select
              className="input-field"
              value={lessonForm.sectionId}
              onChange={(event) => setLessonForm((prev) => ({ ...prev, sectionId: event.target.value }))}
              disabled={!adminSections || adminSections.length === 0}
            >
              <option value="">Không thuộc chương nào</option>
              {(adminSections ?? []).map((s: Section) => (
                <option key={s._id} value={s._id}>
                  {s.orderIndex + 1}. {s.title}
                </option>
              ))}
            </select>
            <input
              className="input-field lg:col-span-2"
              placeholder="Short description"
              value={lessonForm.description}
              onChange={(event) => setLessonForm((prev) => ({ ...prev, description: event.target.value }))}
            />
            <input
              className="input-field"
              placeholder="Video URL (YouTube/Vimeo)"
              value={lessonForm.videoUrl}
              onChange={(event) => setLessonForm((prev) => ({ ...prev, videoUrl: event.target.value }))}
              disabled={lessonForm.lessonType === 'article'}
            />
            <input
              className="input-field"
              type="number"
              min={0}
              placeholder="Estimated time (minutes)"
              value={lessonForm.estimatedTime}
              onChange={(event) => setLessonForm((prev) => ({ ...prev, estimatedTime: Number(event.target.value) || 0 }))}
            />
            <textarea
              className="input-field resize-none lg:col-span-2 font-mono text-xs"
              rows={5}
              placeholder="Markdown content"
              value={lessonForm.contentMarkdown}
              onChange={(event) => setLessonForm((prev) => ({ ...prev, contentMarkdown: event.target.value }))}
            />
            <div className="lg:col-span-2 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wide text-gray-600 font-mono">
                  Code snippets in lesson
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setLessonForm((prev) => ({
                      ...prev,
                      codeSnippets: [
                        ...prev.codeSnippets,
                        { language: selectedCourse?.language ?? 'javascript', code: '' },
                      ],
                    }))
                  }
                >
                  <Plus size={12} />
                  Add snippet
                </Button>
              </div>
              {lessonForm.codeSnippets.map((snippet, idx) => (
                <div key={idx} className="rounded-lg border border-white/[0.06] bg-black/20 p-2 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      className="input-field text-xs max-w-44"
                      placeholder="Caption"
                      value={snippet.description || ''}
                      onChange={(event) =>
                        setLessonForm((prev) => ({
                          ...prev,
                          codeSnippets: prev.codeSnippets.map((s, i) =>
                            i === idx ? { ...s, description: event.target.value } : s
                          ),
                        }))
                      }
                    />
                    <select
                      className="input-field text-xs max-w-32"
                      value={snippet.language}
                      onChange={(event) =>
                        setLessonForm((prev) => ({
                          ...prev,
                          codeSnippets: prev.codeSnippets.map((s, i) =>
                            i === idx ? { ...s, language: event.target.value } : s
                          ),
                        }))
                      }
                    >
                      <option value="javascript">JS</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                      <option value="c">C</option>
                    </select>
                    <button
                      onClick={() =>
                        setLessonForm((prev) => ({
                          ...prev,
                          codeSnippets: prev.codeSnippets.filter((_, i) => i !== idx),
                        }))
                      }
                      className="text-rose-400 hover:text-rose-300"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <textarea
                    className="input-field text-xs font-mono bg-black/40 resize-y"
                    rows={4}
                    placeholder="Snippet code"
                    spellCheck={false}
                    value={snippet.code}
                    onChange={(event) =>
                      setLessonForm((prev) => ({
                        ...prev,
                        codeSnippets: prev.codeSnippets.map((s, i) =>
                          i === idx ? { ...s, code: event.target.value } : s
                        ),
                      }))
                    }
                  />
                </div>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-400 font-mono">
              <input
                type="checkbox"
                checked={lessonForm.isPreview}
                onChange={(event) => setLessonForm((prev) => ({ ...prev, isPreview: event.target.checked }))}
              />
              Preview lesson (Guest có thể xem)
            </label>
          </div>
          <Button className="mt-3" size="sm" loading={lessonMutation.isPending} onClick={() => lessonMutation.mutate()} disabled={!lessonForm.title.trim()}>
            <Plus size={12} />
            Add lesson
          </Button>

          <div className="mt-4 divide-y divide-white/[0.04]">
            {lessonsLoading ? (
              <Skeleton className="h-14 rounded-xl" count={3} />
            ) : adminLessons && adminLessons.length > 0 ? (
              adminLessons.map((lesson) => (
                <div key={lesson._id} className="py-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <p className="font-mono text-sm text-gray-300 truncate">{lesson.title}</p>
                    <p className="font-mono text-xs text-gray-700">
                      {lesson.lessonType} | order {lesson.orderIndex ?? lesson.order ?? 0}
                      {(lesson.attachments?.length ?? 0) > 0 && ` | ${lesson.attachments!.length} file(s)`}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="text-[11px] font-mono text-gray-500 cursor-pointer hover:text-violet-300 transition-colors">
                      <input
                        type="file"
                        className="hidden"
                        onChange={async (event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          try {
                            await lessonsService.uploadAttachment(lesson._id, file);
                            queryClient.invalidateQueries({ queryKey: ['admin-lessons', selectedCourse?._id] });
                            toast.success('Attachment uploaded');
                          } catch (err: any) {
                            toast.error(err?.response?.data?.message ?? 'Upload failed.');
                          }
                          event.target.value = '';
                        }}
                      />
                      📎 Upload file
                    </label>
                    <Button size="sm" variant="outline" onClick={() => lockMutation.mutate({ id: lesson._id, locked: !lesson.isLocked })}>
                      {lesson.isLocked ? 'Unlock' : 'Lock'}
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => window.confirm('Soft delete this lesson?') && deleteLessonMutation.mutate(lesson._id)}>
                      <Trash2 size={12} />
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="No lessons yet" description="Add the first lesson for this course." />
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
