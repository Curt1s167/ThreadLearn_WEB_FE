'use client';

import React, { useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Lock,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { coursesService, enrollmentsService } from '../../services';
import { Button, EmptyState, Skeleton } from '../../components/shared';
import { useAuthStore } from '../../store';
import type { CourseLevel, CourseSection, Enrollment, Lesson, User } from '../../types';
import {
  COURSE_ACCENT_COLORS,
  DemoPageRoot,
  DemoPill,
} from '../ui-reskin/demo-ui';

const getEnrollmentCourseRef = (enrollment: Enrollment) => {
  if (typeof enrollment.courseId === 'string') {
    return { id: enrollment.courseId };
  }

  return {
    id: enrollment.courseId._id ?? enrollment.courseId.id,
    slug: enrollment.courseId.slug,
  };
};

const levelTone = (level?: CourseLevel): 'lime' | 'pink' | 'blue' | 'default' => {
  if (level === 'BEGINNER') return 'lime';
  if (level === 'INTERMEDIATE') return 'pink';
  if (level === 'ADVANCED') return 'blue';
  return 'default';
};

const hasPremiumCourseAccess = (user: User | null): boolean => {
  if (user?.role === 'ADMIN') return true;
  if (user?.planType !== 'PREMIUM') return false;

  const expiresAt = user.subscriptionExpiresAt ? Date.parse(user.subscriptionExpiresAt) : NaN;
  if (Number.isFinite(expiresAt) && expiresAt <= Date.now()) return false;

  // Legacy Premium accounts were granted before feature-level entitlements existed.
  const features = user.subscriptionFeatures;
  return !features || features.length === 0 || features.includes('PREMIUM_COURSES');
};

const isLessonAccessible = (
  lesson: Lesson,
  isEnrolled: boolean,
  isPremiumCourse: boolean,
  canAccessPremiumCourses: boolean,
) => {
  if (lesson.isLocked) return false;
  if (lesson.isPreview) return true;
  return isEnrolled && (!isPremiumCourse || canAccessPremiumCourses);
};

/**
 * PR10 — course detail mirrors DemoCourseDetailPage hero + lesson list.
 * LOGIC LOCK: getById, enrollments, enroll mutation, continue → first lesson.
 */
export const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuthStore();

  const {
    data: detail,
    isLoading: detailLoading,
    isError: detailError,
  } = useQuery({
    queryKey: ['course-detail', courseId],
    queryFn: () => coursesService.getById(courseId!),
    enabled: !!courseId,
  });

  const course = detail?.course;
  const courseObjectId = course?._id ?? course?.id;
  const courseLessons = useMemo(() => detail?.lessons ?? [], [detail?.lessons]);

  const { data: myEnrollments = [] } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: enrollmentsService.getMyEnrollments,
    enabled: isAuthenticated,
    retry: false,
  });

  const enrollment = useMemo(
    () =>
      myEnrollments.find((item) => {
        const ref = getEnrollmentCourseRef(item);
        return ref.id === courseObjectId || ref.id === courseId || ref.slug === courseId;
      }),
    [courseId, courseObjectId, myEnrollments],
  );

  const isEnrolled = !!enrollment;
  const isPremiumCourse = Boolean(course?.isPremium);
  const canAccessPremiumCourses = hasPremiumCourseAccess(user);
  const requiresPremium = isPremiumCourse && !canAccessPremiumCourses;
  const progress = Math.round(enrollment?.progressPercent ?? enrollment?.progress ?? 0);
  const completedSet = useMemo(
    () => new Set(enrollment?.completedLessons ?? []),
    [enrollment?.completedLessons],
  );

  const accent =
    COURSE_ACCENT_COLORS[(course?.title?.length ?? 0) % COURSE_ACCENT_COLORS.length];

  const continueLessonId = useMemo(() => {
    const canOpen = (lesson: Lesson) =>
      isLessonAccessible(lesson, isEnrolled, isPremiumCourse, canAccessPremiumCourses);
    const lastLesson = courseLessons.find((lesson) => lesson._id === enrollment?.lastLessonId);
    if (lastLesson && canOpen(lastLesson)) return lastLesson._id;

    const nextOpen = courseLessons.find((lesson) => !completedSet.has(lesson._id) && canOpen(lesson));
    return nextOpen?._id ?? courseLessons.find(canOpen)?._id;
  }, [
    canAccessPremiumCourses,
    completedSet,
    courseLessons,
    enrollment?.lastLessonId,
    isEnrolled,
    isPremiumCourse,
  ]);

  const handleContinue = () => {
    if (continueLessonId) {
      router.push(`/lessons/${continueLessonId}`);
      return;
    }
    toast.info('Không có bài học nào đang mở để tiếp tục.');
  };

  const { mutate: enroll, isPending: enrolling } = useMutation({
    mutationFn: () => {
      if (!courseObjectId) {
        throw new Error('Course id is missing');
      }
      return enrollmentsService.enroll(courseObjectId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['course-detail', courseId] });
      toast.success('Enrolled in course');
    },
    onError: () => toast.error('Could not enroll in this course'),
  });

  useEffect(() => {
    if (detailError) toast.error('Failed to load course');
  }, [detailError]);

  if (detailLoading) {
    return (
      <DemoPageRoot>
        <Skeleton className="h-56 rounded-lg" />
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Skeleton className="h-72 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
        </div>
      </DemoPageRoot>
    );
  }

  if (detailError || !course) {
    return (
      <EmptyState
        icon={<AlertCircle size={36} />}
        title="Course not found"
        description="The course could not be loaded"
        action={(
          <Button variant="outline" onClick={() => router.push('/courses')}>
            <ArrowLeft size={14} />
            Back to courses
          </Button>
        )}
      />
    );
  }

  const displayLessons = courseLessons;
  const displayLessonCount = course.totalLessons ?? displayLessons.length;
  const tags = course.tags ?? [];
  const displayOutcomes = course.shortDescription ? [course.shortDescription] : [];

  /** Group lessons under course sections for a clear syllabus index. */
  const curriculum = (() => {
    const sections = (detail?.sections ?? [])
      .slice()
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)) as CourseSection[];

    const bySection = new Map<string, Lesson[]>();
    const unassigned: Lesson[] = [];

    for (const lesson of displayLessons) {
      const sid = lesson.sectionId;
      if (sid) {
        const list = bySection.get(sid) ?? [];
        list.push(lesson);
        bySection.set(sid, list);
      } else {
        unassigned.push(lesson);
      }
    }

    const sortLessons = (items: Lesson[]) =>
      items
        .slice()
        .sort(
          (a, b) =>
            (a.orderIndex ?? a.order ?? 0) - (b.orderIndex ?? b.order ?? 0),
        );

    if (sections.length === 0 && displayLessons.length > 0) {
      return [
        {
          key: 'all',
          title: 'Lộ trình bài học',
          description: undefined as string | undefined,
          lessons: sortLessons(displayLessons),
        },
      ];
    }

    const modules = sections.map((section) => ({
      key: section._id,
      title: section.title,
      description: section.description,
      lessons: sortLessons(bySection.get(section._id) ?? []),
    }));

    if (unassigned.length > 0) {
      modules.push({
        key: 'other',
        title: 'Bài học khác',
        description: undefined,
        lessons: sortLessons(unassigned),
      });
    }

    return modules.filter((module) => module.lessons.length > 0);
  })();

  return (
    <DemoPageRoot>
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm text-black/50 transition hover:text-black"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      <section className={`${accent} rounded-lg p-6 sm:p-8`}>
        <div className="grid gap-7 lg:grid-cols-[1fr_340px] lg:items-end">
          <div>
            <div className="mb-5 flex flex-wrap gap-2">
              {course.level ? <DemoPill tone={levelTone(course.level)}>{course.level.toLowerCase()}</DemoPill> : null}
              {course.language ? <DemoPill tone="blue">{course.language}</DemoPill> : null}
              {course.isPremium ? <DemoPill>Premium</DemoPill> : null}
            </div>
            <h1 className="max-w-4xl text-4xl font-light tracking-tight sm:text-5xl">{course.title}</h1>
            <p className="mt-5 max-w-2xl text-black/65">
              {course.shortDescription || course.description}
            </p>
            <div className="mt-5 flex flex-wrap gap-4 text-sm text-black/55">
              <span className="inline-flex items-center gap-1.5">
                <BookOpen size={15} />
                {displayLessonCount} lessons
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users size={15} />
                {(course.totalEnrollments ?? 0).toLocaleString()} learners
              </span>
              {(course.estimatedDuration ?? 0) > 0 ? (
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={15} />
                  {course.estimatedDuration} min
                </span>
              ) : null}
            </div>
          </div>

          <div className="course-hero-status-card relative overflow-hidden rounded-2xl p-5 text-white">
            {course.thumbnailUrl ? (
              <div className="course-hero-status-image pointer-events-none absolute inset-0">
                <Image src={course.thumbnailUrl} alt="" fill unoptimized className="object-cover" />
              </div>
            ) : (
              <div className="pointer-events-none absolute inset-0 overflow-hidden bg-black/[0.04]">
                <div className="absolute -right-6 top-8 rotate-6 rounded bg-[#d9f99d] px-8 py-6 text-3xl font-light tracking-[0.2em] text-black/25">
                  {course.language || 'CODE'}
                </div>
                <div className="absolute bottom-5 left-5 right-5 rounded-lg bg-white/45 p-3 font-mono text-xs leading-5 text-black/35">
                  async function learn() {'{'}<br />
                  &nbsp;&nbsp;await practice();<br />
                  {'}'}
                </div>
              </div>
            )}
            <div className="course-hero-status-content relative">
              <p className="course-hero-status-label text-sm">
                {requiresPremium ? 'Premium access required' : isEnrolled ? 'Course progress' : 'Ready to start'}
              </p>
              <p className="mt-2 text-4xl font-semibold">{isEnrolled ? `${progress}%` : '—'}</p>
              <div className="course-hero-progress-track mt-4">
                <div
                  className="course-hero-progress-fill transition-all"
                  style={{ width: `${isEnrolled ? progress : 0}%` }}
                />
              </div>
              <Button
                onClick={() => {
                  if (requiresPremium) {
                    router.push('/pricing');
                    return;
                  }
                  if (isEnrolled) {
                    handleContinue();
                    return;
                  }
                  enroll();
                }}
                loading={enrolling}
                disabled={!courseObjectId || (isEnrolled && !continueLessonId)}
                className={`course-hero-status-action mt-5 w-full ${
                  requiresPremium
                    ? 'bg-white text-[#102b26] hover:bg-[#f2fff3]'
                    : 'course-hero-primary-action bg-[#d9f99d] text-[#102b26] hover:bg-[#bef264]'
                }`}
              >
                {requiresPremium ? (
                  <>
                    Unlock Premium <Lock size={16} />
                  </>
                ) : isEnrolled ? (
                  <>
                    Continue lesson <ArrowRight size={16} />
                  </>
                ) : (
                  'Enroll'
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="course-lessons-panel rounded-lg border border-black/10 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-black/40">Chỉ mục khóa học</p>
              <h2 className="mt-1 text-xl font-semibold text-ink">Lộ trình theo module</h2>
              <p className="mt-1 text-sm text-black/50">
                {curriculum.length} module · {displayLessonCount} bài · đọc theo thứ tự từ trên xuống
              </p>
            </div>
          </div>

          {curriculum.length === 0 ? (
            <EmptyState
              icon={<BookOpen size={32} />}
              title="No lessons available yet"
              description="Lessons will appear here when they are published for this course."
            />
          ) : <div className="mt-6 space-y-6">
            {curriculum.map((module, moduleIndex) => {
              const moduleDone = module.lessons.filter((l) => completedSet.has(l._id)).length;
              return (
                <div key={module.key} className="course-lesson-module overflow-hidden rounded-xl border border-black/10">
                  <div className="course-lesson-module-header flex flex-wrap items-start justify-between gap-3 border-b border-black/10 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-black/40">
                        Module {moduleIndex + 1}
                      </p>
                      <h3 className="mt-0.5 font-semibold text-ink">{module.title}</h3>
                      {module.description ? (
                        <p className="mt-1 text-sm text-black/55 line-clamp-2">{module.description}</p>
                      ) : null}
                    </div>
                    <span className="shrink-0 rounded-full bg-white border border-black/10 px-2.5 py-1 text-xs text-black/55">
                      {moduleDone}/{module.lessons.length} hoàn thành
                    </span>
                  </div>

                  <div className="course-lesson-module-list divide-y divide-black/10">
                    {module.lessons.map((lesson, index) => {
                      const globalIndex =
                        curriculum
                          .slice(0, moduleIndex)
                          .reduce((sum, m) => sum + m.lessons.length, 0) + index;
                      const done = completedSet.has(lesson._id);
                      const isCurrent = continueLessonId === lesson._id && isEnrolled && !done;
                      const locked = !isLessonAccessible(
                        lesson,
                        isEnrolled,
                        isPremiumCourse,
                        canAccessPremiumCourses,
                      );
                      const lockMessage = lesson.isLocked
                        ? 'Lesson locked by instructor'
                        : requiresPremium && !lesson.isPreview
                          ? 'Premium required'
                          : 'Enroll to unlock';

                      return (
                        <button
                          key={lesson._id}
                          type="button"
                          onClick={() => {
                            router.push(`/lessons/${lesson._id}`);
                          }}
                          disabled={locked}
                          title={locked ? lockMessage : undefined}
                          className="course-lesson-module-row flex w-full items-center gap-4 px-4 py-3.5 text-left transition disabled:cursor-not-allowed disabled:opacity-55"
                        >
                          <span
                            className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-medium ${
                              done
                                ? 'bg-black text-white'
                                : isCurrent
                                  ? 'bg-[#d9f99d] text-ink'
                                  : locked
                                    ? 'bg-black/[0.04] text-black/35'
                                    : 'bg-black/[0.04] text-black/55'
                            }`}
                          >
                            {locked ? <Lock size={16} /> : done ? <CheckCircle2 size={16} /> : globalIndex + 1}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block font-medium text-ink">{lesson.title}</span>
                            <span className="mt-1 block text-sm text-black/50">
                              {lesson.description
                                ? lesson.description
                                : `Bài ${lesson.order ?? lesson.orderIndex ?? globalIndex + 1}`}
                              {lesson.duration || lesson.estimatedTime
                                ? ` · ${lesson.duration ?? lesson.estimatedTime} phút`
                                : ''}
                              {lesson.isPreview ? ' · Preview' : ''}
                              {locked ? ` · ${lockMessage}` : ''}
                            </span>
                          </span>
                          {(lesson.duration ?? lesson.estimatedTime) ? (
                            <span className="hidden sm:inline shrink-0 text-sm text-black/45">
                              {lesson.duration ?? lesson.estimatedTime} phút
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-lg border border-black/10 bg-white p-5">
            <h2 className="text-xl font-semibold">What you will learn</h2>
            <div className="mt-5 space-y-3">
              {displayOutcomes.map((outcome) => (
                <div key={outcome} className="flex gap-3 text-sm text-black/65">
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-black" />
                  <span className="line-clamp-3">{outcome}</span>
                </div>
              ))}
            </div>
            {tags.length ? (
              <div className="mt-6 flex flex-wrap gap-2 border-t border-black/10 pt-5">
                {tags.map((tag) => (
                  <span key={tag} className="rounded bg-black/[0.04] px-2 py-1 text-xs text-black/55">
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {curriculum.length > 1 ? (
            <div className="rounded-lg border border-black/10 bg-white p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-black/40">Mục lục nhanh</p>
              <h2 className="mt-1 font-semibold text-ink">Các module</h2>
              <nav className="mt-4 space-y-2">
                {curriculum.map((module, index) => (
                  <div
                    key={module.key}
                    className="flex items-start gap-2 rounded-md bg-black/[0.03] px-3 py-2 text-sm"
                  >
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-black text-[10px] font-medium text-white">
                      {index + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium text-ink line-clamp-2">{module.title}</span>
                      <span className="text-xs text-black/45">{module.lessons.length} bài</span>
                    </span>
                  </div>
                ))}
              </nav>
            </div>
          ) : null}
        </aside>
      </section>
    </DemoPageRoot>
  );
};
