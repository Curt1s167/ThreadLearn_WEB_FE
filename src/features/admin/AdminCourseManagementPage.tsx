'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArchiveRestore,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  FilePlus2,
  GripVertical,
  Layers3,
  Lock,
  LockKeyholeOpen,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button, EmptyState, Input, Skeleton } from '../../components/shared';
import { ConfirmModal, Modal } from '../../components/shared/Modal';
import { extractApiError } from '../../services/apiClient';
import { adminService, coursesService, lessonsService, sectionsService } from '../../services';
import { useUIStore } from '../../store';
import type {
  Course,
  CourseCreatePayload,
  CourseLevel,
  CourseSection,
  CourseSectionPayload,
  CourseStatus,
  Lesson,
  LessonManagementPayload,
  User,
} from '../../types';
import {
  DemoDisplayTitle,
  DemoHeroWhite,
  DemoMuted,
  DemoPageRoot,
  DemoPill,
  DemoWhitePanel,
} from '../ui-reskin/demo-ui';

const COURSE_FORM = 'admin-course-form';
const LESSON_FORM = 'admin-course-lesson-form';
const SECTION_FORM = 'admin-course-section-form';
const COURSE_DELETE = 'admin-course-delete';
const LESSON_DELETE = 'admin-course-lesson-delete';
const SECTION_DELETE = 'admin-course-section-delete';

const getCourseId = (course: Course) => course.id ?? course._id;
const getUserId = (user: User) => user.id ?? user._id;
const instructorLabel = (instructor: User) => instructor.name || [instructor.firstName, instructor.lastName].filter(Boolean).join(' ') || instructor.email;
const getLessonId = (lesson: Lesson) => lesson.id ?? lesson._id;
const getSectionId = (section: CourseSection) => section.id ?? section._id;
const tagsFromInput = (value: string) => Array.from(new Set(value.split(',').map((tag) => tag.trim()).filter(Boolean)));
const subtitleTracksToInput = (tracks?: Lesson['subtitleTracks']) =>
  (tracks ?? []).map((track) => [track.language, track.label ?? '', track.url].join(' | ')).join('\n');
const subtitleTracksFromInput = (value: string) =>
  value
    .split('\n')
    .map((line) => line.split('|').map((part) => part.trim()))
    .map(([language = '', label = '', url = '']) => ({ language, label: label || undefined, url }))
    .filter((track) => track.language && track.url);
const formatDate = (value?: string) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString() : '—';
};
const statusClass = (status?: CourseStatus) => {
  if (status === 'published') return 'bg-emerald-100 text-emerald-800';
  if (status === 'hidden') return 'bg-amber-100 text-amber-800';
  if (status === 'archived' || status === 'deleted') return 'bg-rose-100 text-rose-800';
  return 'bg-black/5 text-black/60';
};

interface CourseFormProps {
  course: Course | null;
  courses: Course[];
  instructors: User[];
  onSaved: (courseId: string) => void;
}

const CourseForm: React.FC<CourseFormProps> = ({ course, courses, instructors, onSaved }) => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(course?.title ?? '');
  const [description, setDescription] = useState(course?.description ?? '');
  const [shortDescription, setShortDescription] = useState(course?.shortDescription ?? '');
  const [tags, setTags] = useState((course?.tags ?? []).join(', '));
  const [category, setCategory] = useState(course?.category ?? '');
  const [language, setLanguage] = useState(course?.language ?? 'javascript');
  const [level, setLevel] = useState<CourseLevel>(course?.level ?? 'BEGINNER');
  const [duration, setDuration] = useState(String(course?.estimatedDuration ?? 0));
  const [isPremium, setIsPremium] = useState(Boolean(course?.isPremium));
  const [price, setPrice] = useState(String(course?.price ?? 0));
  const [threshold, setThreshold] = useState(String(course?.prerequisiteThreshold ?? 80));
  const [prerequisites, setPrerequisites] = useState(course?.prerequisites ?? []);
  const [instructorId, setInstructorId] = useState(course?.instructorId ?? '');
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const save = useMutation({
    mutationFn: async () => {
      const payload: CourseCreatePayload = {
        title: title.trim(),
        description: description.trim(),
        shortDescription: shortDescription.trim() || undefined,
        tags: tagsFromInput(tags),
        category: category.trim() || undefined,
        language: language as CourseCreatePayload['language'],
        level,
        estimatedDuration: Number(duration),
        isPremium,
        price: isPremium ? Number(price) : 0,
        prerequisites,
        prerequisiteThreshold: Number(threshold),
        ...(!course && instructorId ? { instructorId } : {}),
      };
      const saved = course
        ? await coursesService.update(getCourseId(course), payload)
        : await coursesService.create(payload);
      const savedId = getCourseId(saved);
      if (thumbnail) await coursesService.uploadThumbnail(savedId, thumbnail);
      return savedId;
    },
    onSuccess: (courseId) => {
      toast.success(course ? 'Course updated' : 'Course created as a draft');
      onSaved(courseId);
    },
    onError: (error) => toast.error(extractApiError(error, 'Unable to save course')),
  });

  const assign = useMutation({
    mutationFn: (nextInstructorId: string) =>
      coursesService.assignInstructor(getCourseId(course!), {
        instructorId: nextInstructorId || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['admin-course-detail', getCourseId(course!)] });
      toast.success('Course instructor updated');
    },
    onError: (error) => toast.error(extractApiError(error, 'Unable to update course instructor')),
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = 'Title is required';
    if (!description.trim()) next.description = 'Description is required';
    if (!Number.isFinite(Number(duration)) || Number(duration) < 0) next.duration = 'Duration must be zero or greater';
    if (!Number.isFinite(Number(price)) || Number(price) < 0) next.price = 'Price must be zero or greater';
    if (!Number.isFinite(Number(threshold)) || Number(threshold) < 0 || Number(threshold) > 100) next.threshold = 'Use a value from 0 to 100';
    if (thumbnail && thumbnail.size > 2 * 1024 * 1024) next.thumbnail = 'Thumbnail must not exceed 2 MB';
    setErrors(next);
    if (Object.keys(next).length === 0) save.mutate();
  };

  const availablePrerequisites = courses.filter((item) => !course || getCourseId(item) !== getCourseId(course));

  return (
    <form className="flex flex-col gap-4" onSubmit={submit}>
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Course title" value={title} onChange={(event) => setTitle(event.target.value)} error={errors.title} autoFocus />
        <Input label="Category" value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Backend development" />
      </div>
      <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
        Description
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} className={`input-field min-h-28 resize-y ${errors.description ? 'border-rose-500/50' : ''}`} />
        {errors.description ? <span className="text-rose-600">{errors.description}</span> : null}
      </label>
      <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
        Short description
        <textarea value={shortDescription} onChange={(event) => setShortDescription(event.target.value)} className="input-field min-h-20 resize-y" maxLength={500} />
      </label>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">Language<select value={language} onChange={(event) => setLanguage(event.target.value)} className="input-field"><option value="javascript">JavaScript</option><option value="java">Java</option><option value="python">Python</option></select></label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">Level<select value={level} onChange={(event) => setLevel(event.target.value as CourseLevel)} className="input-field"><option value="BEGINNER">Beginner</option><option value="INTERMEDIATE">Intermediate</option><option value="ADVANCED">Advanced</option></select></label>
        <Input label="Duration (minutes)" type="number" min={0} value={duration} onChange={(event) => setDuration(event.target.value)} error={errors.duration} />
      </div>
      {!course ? <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">Instructor owner (optional)<select value={instructorId} onChange={(event) => setInstructorId(event.target.value)} className="input-field"><option value="">Unassigned</option>{instructors.map((instructor) => <option key={getUserId(instructor)} value={getUserId(instructor)}>{instructorLabel(instructor)} · {instructor.email}</option>)}</select><span className="text-[11px] font-normal text-black/50">Only an active Instructor can own a course. Ownership cannot be changed from general course editing.</span></label> : null}
      {course ? <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">Instructor owner<select value={instructorId} disabled={assign.isPending} onChange={(event) => { const nextInstructorId = event.target.value; setInstructorId(nextInstructorId); assign.mutate(nextInstructorId); }} className="input-field"><option value="">Unassigned</option>{course.instructorId && !instructors.some((instructor) => getUserId(instructor) === course.instructorId) ? <option value={course.instructorId}>Currently assigned (inactive or unavailable)</option> : null}{instructors.map((instructor) => <option key={getUserId(instructor)} value={getUserId(instructor)}>{instructorLabel(instructor)} · {instructor.email}</option>)}</select><span className="text-[11px] font-normal text-black/50">This uses the dedicated assignment API. Save course never sends instructorId.</span></label> : null}
      <Input label="Tags (comma separated)" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="async, nodejs, concurrency" />
      <div className="grid gap-4 rounded-xl border border-black/10 p-4 md:grid-cols-[1fr_12rem]">
        <label className="flex items-center gap-2 self-center text-sm font-medium text-ink"><input type="checkbox" checked={isPremium} onChange={(event) => setIsPremium(event.target.checked)} className="size-4 accent-black" />Premium course</label>
        <Input label="Price" type="number" min={0} disabled={!isPremium} value={price} onChange={(event) => setPrice(event.target.value)} error={errors.price} />
      </div>
      <div className="rounded-xl border border-black/10 p-4">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-medium text-ink">Prerequisites</p><p className="mt-1 text-xs text-black/55">Students must reach the required progress for each selected course.</p></div><div className="w-44"><Input label="Required progress (%)" type="number" min={0} max={100} value={threshold} onChange={(event) => setThreshold(event.target.value)} error={errors.threshold} /></div></div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {availablePrerequisites.map((item) => {
            const itemId = getCourseId(item);
            return <label key={itemId} className="flex items-center gap-2 rounded-lg bg-black/[0.025] p-2 text-sm"><input type="checkbox" checked={prerequisites.includes(itemId)} onChange={() => setPrerequisites((current) => current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId])} className="size-4 accent-black" />{item.title}</label>;
          })}
          {availablePrerequisites.length === 0 ? <p className="text-sm text-black/50">No other course is available as a prerequisite.</p> : null}
        </div>
      </div>
      <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">Thumbnail (PNG, JPG, WEBP, or GIF; max 2 MB)<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => setThumbnail(event.target.files?.[0] ?? null)} className="block text-sm file:mr-3 file:rounded-full file:border-0 file:bg-black file:px-3 file:py-1.5 file:text-xs file:text-white" />{errors.thumbnail ? <span className="text-rose-600">{errors.thumbnail}</span> : null}</label>
      <div className="flex justify-end border-t border-black/10 pt-4"><Button type="submit" loading={save.isPending}><Save size={14} />{course ? 'Save course' : 'Create draft'}</Button></div>
    </form>
  );
};

interface LessonFormProps { courseId: string; sections: CourseSection[]; lesson: Lesson | null; onSaved: () => void; }
const LessonForm: React.FC<LessonFormProps> = ({ courseId, sections, lesson, onSaved }) => {
  const [title, setTitle] = useState(lesson?.title ?? '');
  const [description, setDescription] = useState(lesson?.description ?? '');
  const [contentMarkdown, setContentMarkdown] = useState(lesson?.contentMarkdown ?? lesson?.content ?? '');
  const [sectionId, setSectionId] = useState(lesson?.sectionId ?? '');
  const [lessonType, setLessonType] = useState(lesson?.lessonType ?? 'article');
  const [videoUrl, setVideoUrl] = useState(lesson?.videoUrl ?? '');
  const [transcript, setTranscript] = useState(lesson?.transcript ?? '');
  const [transcriptLanguage, setTranscriptLanguage] = useState(lesson?.transcriptLanguage ?? '');
  const [subtitleTracks, setSubtitleTracks] = useState(subtitleTracksToInput(lesson?.subtitleTracks));
  const [attachments, setAttachments] = useState((lesson?.attachments ?? []).join('\n'));
  const [estimatedTime, setEstimatedTime] = useState(String(lesson?.estimatedTime ?? lesson?.duration ?? 0));
  const [isPreview, setIsPreview] = useState(Boolean(lesson?.isPreview));
  const [isLocked, setIsLocked] = useState(Boolean(lesson?.isLocked));
  const [error, setError] = useState('');
  const save = useMutation({
    mutationFn: async () => {
      const payload: LessonManagementPayload = { courseId, title: title.trim(), description: description.trim() || undefined, contentMarkdown: contentMarkdown || undefined, sectionId: sectionId || undefined, lessonType, videoUrl: videoUrl.trim() || undefined, transcript: transcript.trim() || undefined, transcriptLanguage: transcriptLanguage.trim() || undefined, subtitleTracks: subtitleTracksFromInput(subtitleTracks), attachments: attachments.split('\n').map((item) => item.trim()).filter(Boolean), estimatedTime: Number(estimatedTime), isPreview, isLocked };
      return lesson ? lessonsService.update(getLessonId(lesson), payload) : lessonsService.create(payload);
    },
    onSuccess: () => { toast.success(lesson ? 'Lesson updated' : 'Lesson created'); onSaved(); },
    onError: (requestError) => toast.error(extractApiError(requestError, 'Unable to save lesson')),
  });
  return <form className="flex max-h-[calc(100dvh-11rem)] flex-col gap-4 overflow-y-auto overscroll-contain pr-2" onSubmit={(event) => { event.preventDefault(); if (!title.trim()) { setError('Lesson title is required'); return; } if (!Number.isFinite(Number(estimatedTime)) || Number(estimatedTime) < 0) { setError('Estimated time must be zero or greater'); return; } setError(''); save.mutate(); }}>
    <div className="grid gap-4 md:grid-cols-2"><Input label="Lesson title" value={title} onChange={(event) => setTitle(event.target.value)} error={error} autoFocus /><label className="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">Section<select value={sectionId} onChange={(event) => setSectionId(event.target.value)} className="input-field"><option value="">No section</option>{sections.map((section) => <option key={getSectionId(section)} value={getSectionId(section)}>{section.title}</option>)}</select></label></div>
    <div className="grid gap-4 md:grid-cols-3"><label className="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">Type<select value={lessonType} onChange={(event) => setLessonType(event.target.value as NonNullable<LessonManagementPayload['lessonType']>)} className="input-field">{['article', 'video', 'coding', 'quiz', 'assignment', 'mixed'].map((type) => <option key={type} value={type}>{type}</option>)}</select></label><Input label="Estimated time (minutes)" type="number" min={0} value={estimatedTime} onChange={(event) => setEstimatedTime(event.target.value)} /><Input label="Video URL" type="url" value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} /></div>
    <div className="grid gap-4 md:grid-cols-2"><Input label="Transcript language" value={transcriptLanguage} onChange={(event) => setTranscriptLanguage(event.target.value)} placeholder="en, vi, ja" /><label className="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">Subtitle tracks (language | label | WebVTT URL, one per line)<textarea value={subtitleTracks} onChange={(event) => setSubtitleTracks(event.target.value)} className="input-field min-h-20 resize-y font-mono text-xs" placeholder="en | English | https://cdn.example.com/lesson.en.vtt\nvi | Tiếng Việt | https://cdn.example.com/lesson.vi.vtt" /></label></div>
    <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">Transcript (searchable text)<textarea value={transcript} onChange={(event) => setTranscript(event.target.value)} className="input-field min-h-36 resize-y" placeholder="Paste the lesson transcript here. This will be searchable for learners in the next phase." /></label>
    <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} className="input-field min-h-20 resize-y" /></label>
    <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">Lesson content (Markdown)<textarea value={contentMarkdown} onChange={(event) => setContentMarkdown(event.target.value)} className="input-field min-h-48 resize-y font-mono text-xs" placeholder="# Lesson title\n\nWrite the lesson content here..." /></label>
    <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">Attachment URLs (one per line)<textarea value={attachments} onChange={(event) => setAttachments(event.target.value)} className="input-field min-h-20 resize-y" /></label>
    <div className="flex flex-wrap gap-5"><label className="flex items-center gap-2 text-sm text-ink-muted"><input type="checkbox" checked={isPreview} onChange={(event) => setIsPreview(event.target.checked)} className="size-4 accent-black" />Preview lesson</label><label className="flex items-center gap-2 text-sm text-ink-muted"><input type="checkbox" checked={isLocked} onChange={(event) => setIsLocked(event.target.checked)} className="size-4 accent-black" />Locked lesson</label></div>
    <div className="flex justify-end border-t border-black/10 pt-4"><Button type="submit" loading={save.isPending}><Save size={14} />{lesson ? 'Save lesson' : 'Create lesson'}</Button></div>
  </form>;
};

interface SectionFormProps { courseId: string; section: CourseSection | null; onSaved: () => void; }
const SectionForm: React.FC<SectionFormProps> = ({ courseId, section, onSaved }) => {
  const [title, setTitle] = useState(section?.title ?? '');
  const [description, setDescription] = useState(section?.description ?? '');
  const [isPublished, setIsPublished] = useState(section?.isPublished ?? true);
  const [error, setError] = useState('');
  const save = useMutation({
    mutationFn: () => {
      const payload: CourseSectionPayload = { courseId, title: title.trim(), description: description.trim() || undefined, isPublished };
      return section ? sectionsService.update(getSectionId(section), payload) : sectionsService.create(payload);
    },
    onSuccess: () => { toast.success(section ? 'Section updated' : 'Section created'); onSaved(); },
    onError: (requestError) => toast.error(extractApiError(requestError, 'Unable to save section')),
  });
  return <form className="flex flex-col gap-4" onSubmit={(event) => { event.preventDefault(); if (!title.trim()) { setError('Section title is required'); return; } setError(''); save.mutate(); }}><Input label="Section title" value={title} onChange={(event) => setTitle(event.target.value)} error={error} autoFocus /><label className="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} className="input-field min-h-24 resize-y" /></label><label className="flex items-center gap-2 text-sm text-ink-muted"><input type="checkbox" checked={isPublished} onChange={(event) => setIsPublished(event.target.checked)} className="size-4 accent-black" />Visible in curriculum</label><div className="flex justify-end border-t border-black/10 pt-4"><Button type="submit" loading={save.isPending}><Save size={14} />{section ? 'Save section' : 'Create section'}</Button></div></form>;
};

/** Live administration surface for UC15–UC22 and UC54. */
export const AdminCourseManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { openModal, closeModal } = useUIStore();
  const [statusFilter, setStatusFilter] = useState<CourseStatus | 'all'>('all');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editingSection, setEditingSection] = useState<CourseSection | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null);
  const [sectionToDelete, setSectionToDelete] = useState<CourseSection | null>(null);
  const courseQuery = useQuery({ queryKey: ['admin-courses', statusFilter], queryFn: () => coursesService.list({ includeAll: true, status: statusFilter === 'all' ? undefined : statusFilter, limit: 100 }) });
  const courses = useMemo(() => courseQuery.data?.items ?? [], [courseQuery.data?.items]);
  const instructorQuery = useQuery({
    queryKey: ['admin-instructors', 'active', 'all-pages'],
    queryFn: async () => {
      const firstPage = await adminService.listInstructors({ page: 1, limit: 100, isActive: true });
      const instructors = [...firstPage.items];
      for (let page = 2; page <= firstPage.totalPages; page += 1) {
        const nextPage = await adminService.listInstructors({ page, limit: 100, isActive: true });
        instructors.push(...nextPage.items);
      }
      return instructors;
    },
  });

  const instructors = useMemo(() => instructorQuery.data ?? [], [instructorQuery.data]);
  const selectedCourse = useMemo(() => courses.find((course) => getCourseId(course) === selectedCourseId) ?? null, [courses, selectedCourseId]);
  const detailQuery = useQuery({ queryKey: ['admin-course-detail', selectedCourseId], queryFn: () => coursesService.getById(selectedCourseId!), enabled: Boolean(selectedCourseId) });
  const detail = detailQuery.data;
  const sections = useMemo(() => [...(detail?.sections ?? [])].sort((a, b) => a.orderIndex - b.orderIndex), [detail?.sections]);
  const lessons = useMemo(() => [...(detail?.lessons ?? [])].sort((a, b) => (a.orderIndex ?? a.order ?? 0) - (b.orderIndex ?? b.order ?? 0)), [detail?.lessons]);

  useEffect(() => {
    if (!selectedCourseId && courses[0]) setSelectedCourseId(getCourseId(courses[0]));
    if (selectedCourseId && !courses.some((course) => getCourseId(course) === selectedCourseId)) setSelectedCourseId(courses[0] ? getCourseId(courses[0]) : null);
  }, [courses, selectedCourseId]);
  useEffect(() => { if (courseQuery.isError) toast.error('Unable to load courses'); if (detailQuery.isError) toast.error('Unable to load course curriculum'); }, [courseQuery.isError, detailQuery.isError]);

  const invalidate = () => { queryClient.invalidateQueries({ queryKey: ['admin-courses'] }); queryClient.invalidateQueries({ queryKey: ['courses'] }); queryClient.invalidateQueries({ queryKey: ['admin-course-detail', selectedCourseId] }); queryClient.invalidateQueries({ queryKey: ['course-detail', selectedCourseId] }); };
  const statusMutation = useMutation({ mutationFn: ({ id, status }: { id: string; status: 'draft' | 'published' | 'hidden' }) => coursesService.setStatus(id, { status }), onSuccess: (_, input) => { invalidate(); toast.success(`Course set to ${input.status}`); }, onError: (error) => toast.error(extractApiError(error, 'Unable to change course status')) });
  const restoreMutation = useMutation({ mutationFn: coursesService.restore, onSuccess: () => { invalidate(); toast.success('Course restored as draft'); }, onError: (error) => toast.error(extractApiError(error, 'Unable to restore course')) });
  const removeCourseMutation = useMutation({ mutationFn: coursesService.remove, onSuccess: () => { invalidate(); setCourseToDelete(null); toast.success('Course removed safely'); }, onError: (error) => toast.error(extractApiError(error, 'Unable to remove course')) });
  const removeLessonMutation = useMutation({ mutationFn: lessonsService.delete, onSuccess: () => { invalidate(); setLessonToDelete(null); toast.success('Lesson removed safely'); }, onError: (error) => toast.error(extractApiError(error, 'Unable to remove lesson')) });
  const removeSectionMutation = useMutation({ mutationFn: sectionsService.remove, onSuccess: () => { invalidate(); setSectionToDelete(null); toast.success('Section removed; its lessons are unassigned'); }, onError: (error) => toast.error(extractApiError(error, 'Unable to remove section')) });
  const lockMutation = useMutation({ mutationFn: ({ id, locked }: { id: string; locked: boolean }) => lessonsService.setLock(id, locked), onSuccess: () => { invalidate(); toast.success('Lesson lock updated'); }, onError: (error) => toast.error(extractApiError(error, 'Unable to update lesson lock')) });
  const reorderMutation = useMutation({ mutationFn: (items: Array<{ id: string; orderIndex: number }>) => sectionsService.reorder(selectedCourseId!, items), onSuccess: () => { invalidate(); toast.success('Section order saved'); }, onError: (error) => toast.error(extractApiError(error, 'Unable to reorder sections')) });
  const moveSection = (section: CourseSection, direction: -1 | 1) => { const reordered = [...sections]; const currentIndex = reordered.findIndex((item) => getSectionId(item) === getSectionId(section)); const targetIndex = currentIndex + direction; if (targetIndex < 0 || targetIndex >= reordered.length) return; [reordered[currentIndex], reordered[targetIndex]] = [reordered[targetIndex], reordered[currentIndex]]; reorderMutation.mutate(reordered.map((item, index) => ({ id: getSectionId(item), orderIndex: index }))); };

  if (courseQuery.isLoading) return <DemoPageRoot><Skeleton className="h-36 rounded-lg" /><Skeleton className="mt-6 h-[38rem] rounded-lg" /></DemoPageRoot>;
  if (courseQuery.isError) return <EmptyState icon={<AlertCircle size={36} />} title="Could not load course management" description="Check your admin access, then try again." action={<Button variant="outline" onClick={() => invalidate()}>Retry</Button>} />;

  return <DemoPageRoot>
    <DemoHeroWhite><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><DemoPill tone="lime">Admin · UC15–UC22, UC54</DemoPill><BookOpen size={18} className="text-black/45" /></div><DemoDisplayTitle>Course management</DemoDisplayTitle><DemoMuted>Create and maintain courses, curriculum sections, lessons, media, and learner visibility through the live APIs.</DemoMuted></div><button type="button" onClick={() => { setEditingCourse(null); openModal(COURSE_FORM); }} className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-black/90"><Plus size={15} />New course</button></div></DemoHeroWhite>
    <div className="grid gap-6 xl:grid-cols-[minmax(19rem,0.8fr)_minmax(0,1.5fr)]">
      <DemoWhitePanel className="overflow-hidden"><div className="flex items-center justify-between border-b border-black/10 px-4 py-3"><p className="text-sm font-semibold text-ink">Courses ({courseQuery.data?.total ?? courses.length})</p><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as CourseStatus | 'all')} className="rounded-full border border-black/10 bg-white px-2.5 py-1.5 text-xs"><option value="all">All statuses</option>{['draft', 'published', 'hidden', 'archived', 'deleted'].map((status) => <option key={status} value={status}>{status}</option>)}</select></div>{courses.length === 0 ? <EmptyState icon={<BookOpen size={30} />} title="No courses found" description="Create the first course to begin authoring." action={<Button size="sm" onClick={() => { setEditingCourse(null); openModal(COURSE_FORM); }}><Plus size={13} />New course</Button>} /> : <div className="max-h-[46rem] divide-y divide-black/10 overflow-y-auto">{courses.map((course) => { const courseId = getCourseId(course); return <button type="button" key={courseId} onClick={() => setSelectedCourseId(courseId)} className={`block w-full px-4 py-3.5 text-left transition-colors ${courseId === selectedCourseId ? 'bg-[#d9f99d]/50' : 'hover:bg-black/[0.025]'}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-ink">{course.title}</p><p className="mt-1 line-clamp-1 text-xs text-black/55">{course.shortDescription || course.description}</p></div><span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${statusClass(course.status)}`}>{course.status ?? 'draft'}</span></div><div className="mt-2 flex gap-3 text-[11px] text-black/45"><span>{course.totalLessons ?? 0} lessons</span><span>{course.totalEnrollments ?? 0} learners</span><span>{course.isPremium ? 'Premium' : 'Free'}</span></div></button>; })}</div>}</DemoWhitePanel>
      <DemoWhitePanel className="min-w-0">{!selectedCourse ? <EmptyState icon={<BookOpen size={36} />} title="Select a course" description="Choose a course to manage its content and status." /> : detailQuery.isLoading ? <div className="space-y-4 p-5"><Skeleton className="h-32 rounded-lg" /><Skeleton className="h-56 rounded-lg" /></div> : detailQuery.isError || !detail ? <EmptyState icon={<AlertCircle size={36} />} title="Could not load this course" description="Try selecting it again." /> : <div><div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/10 p-5"><div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(selectedCourse.status)}`}>{selectedCourse.status ?? 'draft'}</span>{selectedCourse.isPremium ? <DemoPill tone="pink">Premium</DemoPill> : <DemoPill tone="blue">Free</DemoPill>}</div><h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink">{selectedCourse.title}</h2><p className="mt-1 text-sm text-black/55">{selectedCourse.totalLessons ?? lessons.length} lessons · Updated {formatDate(selectedCourse.updatedAt)}</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => { setEditingCourse(selectedCourse); openModal(COURSE_FORM); }}><Pencil size={13} />Edit</Button>{selectedCourse.status === 'deleted' || selectedCourse.status === 'archived' ? <Button variant="outline" size="sm" loading={restoreMutation.isPending} onClick={() => restoreMutation.mutate(getCourseId(selectedCourse))}><ArchiveRestore size={13} />Restore</Button> : <>{selectedCourse.status !== 'published' ? <Button size="sm" loading={statusMutation.isPending} onClick={() => statusMutation.mutate({ id: getCourseId(selectedCourse), status: 'published' })}><Eye size={13} />Publish</Button> : null}{selectedCourse.status !== 'hidden' ? <Button variant="outline" size="sm" loading={statusMutation.isPending} onClick={() => statusMutation.mutate({ id: getCourseId(selectedCourse), status: 'hidden' })}><EyeOff size={13} />Hide</Button> : null}{selectedCourse.status !== 'draft' ? <Button variant="outline" size="sm" loading={statusMutation.isPending} onClick={() => statusMutation.mutate({ id: getCourseId(selectedCourse), status: 'draft' })}><RotateCcw size={13} />Draft</Button> : null}<Button variant="danger" size="sm" onClick={() => { setCourseToDelete(selectedCourse); openModal(COURSE_DELETE); }}><Trash2 size={13} />Remove</Button></>}</div></div>
        <div className="grid gap-6 p-5 2xl:grid-cols-2"><section><div className="mb-3 flex items-center justify-between gap-2"><div className="flex items-center gap-2"><Layers3 size={17} /><h3 className="font-semibold text-ink">Curriculum sections</h3></div><Button size="sm" variant="outline" onClick={() => { setEditingSection(null); openModal(SECTION_FORM); }}><Plus size={13} />Section</Button></div>{sections.length === 0 ? <div className="rounded-lg border border-dashed border-black/15 p-4 text-sm text-black/50">No sections yet. Lessons can be assigned later.</div> : <div className="space-y-2">{sections.map((section, index) => <div key={getSectionId(section)} className="rounded-lg border border-black/10 p-3"><div className="flex gap-2"><GripVertical size={16} className="mt-0.5 shrink-0 text-black/35" /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-medium text-ink">{section.title}</p>{section.description ? <p className="mt-0.5 line-clamp-1 text-xs text-black/50">{section.description}</p> : null}</div>{!section.isPublished ? <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] text-black/55">Hidden</span> : null}</div><div className="mt-2 flex flex-wrap gap-1.5"><button type="button" onClick={() => moveSection(section, -1)} disabled={index === 0 || reorderMutation.isPending} className="rounded border border-black/10 p-1 text-black/55 disabled:opacity-35" aria-label="Move section up"><ChevronUp size={13} /></button><button type="button" onClick={() => moveSection(section, 1)} disabled={index === sections.length - 1 || reorderMutation.isPending} className="rounded border border-black/10 p-1 text-black/55 disabled:opacity-35" aria-label="Move section down"><ChevronDown size={13} /></button><button type="button" onClick={() => { setEditingSection(section); openModal(SECTION_FORM); }} className="rounded border border-black/10 px-2 py-1 text-[11px] text-black/65">Edit</button><button type="button" onClick={() => { setSectionToDelete(section); openModal(SECTION_DELETE); }} className="rounded border border-rose-200 px-2 py-1 text-[11px] text-rose-700">Delete</button></div></div></div></div>)}</div>}</section>
          <section><div className="mb-3 flex items-center justify-between gap-2"><div className="flex items-center gap-2"><FilePlus2 size={17} /><h3 className="font-semibold text-ink">Lessons</h3></div><Button size="sm" onClick={() => { setEditingLesson(null); openModal(LESSON_FORM); }}><Plus size={13} />Lesson</Button></div>{lessons.length === 0 ? <div className="rounded-lg border border-dashed border-black/15 p-4 text-sm text-black/50">Create at least one active lesson before publishing this course.</div> : <div className="space-y-2">{lessons.map((lesson, index) => { const section = sections.find((item) => getSectionId(item) === lesson.sectionId); return <div key={getLessonId(lesson)} className="rounded-lg border border-black/10 p-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm font-medium text-ink">{index + 1}. {lesson.title}</p><p className="mt-0.5 text-xs text-black/50">{section?.title ?? 'No section'} · {lesson.lessonType ?? 'article'} · {lesson.estimatedTime ?? 0} min</p></div><div className="flex shrink-0 items-center gap-1.5">{lesson.isPreview ? <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] text-sky-800">Preview</span> : null}{lesson.isLocked ? <Lock size={14} className="text-amber-700" /> : null}</div></div><div className="mt-2 flex flex-wrap gap-1.5"><button type="button" onClick={() => { setEditingLesson(lesson); openModal(LESSON_FORM); }} className="rounded border border-black/10 px-2 py-1 text-[11px] text-black/65">Edit</button><button type="button" onClick={() => lockMutation.mutate({ id: getLessonId(lesson), locked: !lesson.isLocked })} disabled={lockMutation.isPending} className="inline-flex items-center gap-1 rounded border border-black/10 px-2 py-1 text-[11px] text-black/65 disabled:opacity-40">{lesson.isLocked ? <LockKeyholeOpen size={11} /> : <Lock size={11} />}{lesson.isLocked ? 'Unlock' : 'Lock'}</button><button type="button" onClick={() => { setLessonToDelete(lesson); openModal(LESSON_DELETE); }} className="rounded border border-rose-200 px-2 py-1 text-[11px] text-rose-700">Delete</button></div></div>; })}</div>}</section></div>
      </div>}</DemoWhitePanel>
    </div>
    <Modal name={COURSE_FORM} title={editingCourse ? 'Edit course' : 'Create course'} description={editingCourse ? 'Update course information and prerequisites.' : 'New courses are drafts until they contain lessons.'} size="xl" onClose={() => setEditingCourse(null)}><CourseForm course={editingCourse} courses={courses} instructors={instructors} onSaved={(id) => { closeModal(); setEditingCourse(null); setSelectedCourseId(id); invalidate(); }} /></Modal>
    {selectedCourseId ? <><Modal name={LESSON_FORM} title={editingLesson ? 'Edit lesson' : 'Create lesson'} description="Lessons are assigned to this course." size="xl" onClose={() => setEditingLesson(null)}><LessonForm courseId={selectedCourseId} sections={sections} lesson={editingLesson} onSaved={() => { closeModal(); setEditingLesson(null); invalidate(); }} /></Modal><Modal name={SECTION_FORM} title={editingSection ? 'Edit section' : 'Create section'} description="Sections organize the curriculum and can be reordered." size="lg" onClose={() => setEditingSection(null)}><SectionForm courseId={selectedCourseId} section={editingSection} onSaved={() => { closeModal(); setEditingSection(null); invalidate(); }} /></Modal></> : null}
    <ConfirmModal name={COURSE_DELETE} title="Remove course" description={courseToDelete ? `Remove "${courseToDelete.title}"? This is a soft-delete; enrolled learners' data is preserved.` : 'Remove this course?'} confirmLabel="Remove course" danger onConfirm={() => { if (courseToDelete) removeCourseMutation.mutate(getCourseId(courseToDelete)); }} />
    <ConfirmModal name={LESSON_DELETE} title="Remove lesson" description={lessonToDelete ? `Remove "${lessonToDelete.title}"? It will no longer be available to learners.` : 'Remove this lesson?'} confirmLabel="Remove lesson" danger onConfirm={() => { if (lessonToDelete) removeLessonMutation.mutate(getLessonId(lessonToDelete)); }} />
    <ConfirmModal name={SECTION_DELETE} title="Remove section" description={sectionToDelete ? `Remove "${sectionToDelete.title}"? Its lessons will remain in the course without a section.` : 'Remove this section?'} confirmLabel="Remove section" danger onConfirm={() => { if (sectionToDelete) removeSectionMutation.mutate(getSectionId(sectionToDelete)); }} />
  </DemoPageRoot>;
};
