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
  Award,
  CalendarDays,
} from 'lucide-react';
import { toast } from 'sonner';
import { coursesService, enrollmentsService, learningPlanService } from '../../services';
import { extractApiError, extractApiErrorCode } from '../../services/apiClient';
import { Button, EmptyState, Skeleton } from '../../components/shared';
import { ContextualDiscussionRoom } from '../discussions/ContextualDiscussionRoom';
import { useAuthStore } from '../../store';
import type { CourseGoalPriority, CourseLevel, CourseSection, Enrollment, Lesson, User } from '../../types';
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

const getEnrollmentCourseTitle = (enrollment?: Enrollment) => {
  if (!enrollment || typeof enrollment.courseId === 'string') return undefined;
  return enrollment.courseId.title;
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
  const [targetDate, setTargetDate] = React.useState('');
  const [priority, setPriority] = React.useState<CourseGoalPriority>('NORMAL');
  const { data: courseGoal } = useQuery({
    queryKey: ['course-goal', courseObjectId],
    queryFn: () => learningPlanService.getCourseGoal(courseObjectId!),
    enabled: isEnrolled && Boolean(courseObjectId),
  });
  useEffect(() => {
    if (!courseGoal) return;
    setTargetDate(courseGoal.targetDate.slice(0, 10));
    setPriority(courseGoal.priority);
  }, [courseGoal]);
  const { mutate: saveCourseGoal, isPending: savingCourseGoal } = useMutation({
    mutationFn: () => learningPlanService.updateCourseGoal(courseObjectId!, { targetDate, priority }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-goal', courseObjectId] });
      toast.success('Completion target saved.');
    },
    onError: () => toast.error('Could not save completion target.'),
  });
  const isPremiumCourse = Boolean(course?.isPremium);
  const canAccessPremiumCourses = hasPremiumCourseAccess(user);
  const requiresPremium = isPremiumCourse && !canAccessPremiumCourses;
  const progress = Math.round(enrollment?.progressPercent ?? enrollment?.progress ?? 0);
  const courseCompleted = Boolean(enrollment?.completed || progress >= 100);
  const completedSet = useMemo(
    () => new Set(enrollment?.completedLessons ?? []),
    [enrollment?.completedLessons],
  );
  const prerequisiteThreshold = course?.prerequisiteThreshold ?? 80;
  const prerequisites = useMemo(
    () =>
      (course?.prerequisites ?? []).map((prerequisiteId) => {
        const prerequisiteEnrollment = myEnrollments.find((item) => {
          const ref = getEnrollmentCourseRef(item);
          return ref.id === prerequisiteId || ref.slug === prerequisiteId;
        });
        const prerequisiteProgress = Math.round(
          prerequisiteEnrollment?.progressPercent ?? prerequisiteEnrollment?.progress ?? 0,
        );

        return {
          id: prerequisiteId,
          title: getEnrollmentCourseTitle(prerequisiteEnrollment) ?? `Prerequisite ${prerequisiteId.slice(-6)}`,
          progress: prerequisiteProgress,
          isMet: prerequisiteProgress >= prerequisiteThreshold,
          isEnrolled: !!prerequisiteEnrollment,
        };
      }),
    [course?.prerequisites, myEnrollments, prerequisiteThreshold],
  );
  const unmetPrerequisites = prerequisites.filter((item) => !item.isMet);
  const blockedByPrerequisites = !isEnrolled && unmetPrerequisites.length > 0;
  const firstUnmetPrerequisite = unmetPrerequisites[0];

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

  const handlePrerequisiteAction = () => {
    if (!firstUnmetPrerequisite) return;
    toast.info(
      `Finish ${firstUnmetPrerequisite.title} to ${prerequisiteThreshold}% before enrolling.`,
    );
    router.push(`/courses/${firstUnmetPrerequisite.id}`);
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
    onError: (error) => {
      const code = extractApiErrorCode(error);
      const message = extractApiError(error, 'Could not enroll in this course');
      toast.error(
        code === 'COURSE_PREREQUISITE_REQUIRED'
          ? 'Complete the required prerequisite before enrolling in this course.'
          : message,
      );
    },
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

      <section className={`${accent} course-detail-hero rounded-lg border p-6 sm:p-8`}>
        <div className="grid gap-7 lg:grid-cols-[1fr_340px] lg:items-end">
          <div>
            <div className="mb-5 flex flex-wrap gap-2">
              {course.level ? <DemoPill tone={levelTone(course.level)}>{course.level.toLowerCase()}</DemoPill> : null}
              {course.language ? <DemoPill tone="blue">{course.language}</DemoPill> : null}
              {course.isPremium ? <DemoPill>Premium</DemoPill> : null}
            </div>
            <h1 className="course-detail-hero-title max-w-4xl text-3xl font-semibold leading-tight tracking-[-0.035em] sm:text-4xl lg:text-5xl">{course.title}</h1>
            <p className="course-detail-hero-summary mt-5 max-w-2xl text-base leading-7">
              {course.shortDescription || course.description}
            </p>
            <div className="course-detail-hero-summary mt-5 flex flex-wrap gap-4 text-sm">
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
                {requiresPremium
                  ? 'Premium access required'
                  : blockedByPrerequisites
                    ? 'Prerequisite required'
                    : isEnrolled
                      ? courseCompleted
                        ? 'Course completed'
                        : 'Course progress'
                      : 'Ready to start'}
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
                  if (blockedByPrerequisites) {
                    handlePrerequisiteAction();
                    return;
                  }
                  if (isEnrolled) {
                    if (courseCompleted) {
                      router.push('/certificates');
                    } else {
                      handleContinue();
                    }
                    return;
                  }
                  enroll();
                }}
                loading={enrolling}
                disabled={!courseObjectId || (isEnrolled && !courseCompleted && !continueLessonId)}
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
                ) : courseCompleted ? (
                  <>
                    View certificate <Award size={16} />
                  </>
                ) : isEnrolled ? (
                  <>
                    Continue lesson <ArrowRight size={16} />
                  </>
                ) : blockedByPrerequisites ? (
                  <>
                    Continue prerequisite <ArrowRight size={16} />
                  </>
                ) : (
                  'Enroll'
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {isEnrolled && !courseCompleted ? (
        <section className="mt-6 rounded-lg border border-black/10 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2"><CalendarDays size={18} /><h2 className="font-semibold">Completion target</h2></div>
              <p className="mt-2 text-sm text-black/60">
                {courseGoal
                  ? courseGoal.status === 'ON_TRACK'
                    ? 'You are on track for this deadline.'
                    : courseGoal.status === 'AT_RISK'
                      ? 'Your current pace may miss this deadline.'
                      : 'This target needs attention.'
                  : 'Set a deadline so ThreadLearn can evaluate this course separately.'}
              </p>
            </div>
            {courseGoal ? <span className="rounded-full bg-black px-3 py-1 text-xs font-medium text-white">{courseGoal.status.replace('_', ' ')}</span> : null}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_150px_auto]">
            <input type="date" aria-label="Course completion target date" min={new Date().toISOString().slice(0, 10)} value={targetDate} onChange={(event) => setTargetDate(event.target.value)} className="min-h-11 rounded-lg border border-black/15 px-3 text-sm" />
            <select aria-label="Course goal priority" value={priority} onChange={(event) => setPriority(event.target.value as CourseGoalPriority)} className="min-h-11 rounded-lg border border-black/15 px-3 text-sm"><option value="HIGH">High priority</option><option value="NORMAL">Normal priority</option><option value="LOW">Low priority</option></select>
            <Button disabled={!targetDate} loading={savingCourseGoal} onClick={() => saveCourseGoal()} className="min-h-11">Save target</Button>
          </div>
          {courseGoal ? <p className="mt-3 text-xs text-black/45">{courseGoal.remainingMinutes} minutes remain · {courseGoal.sessionsRemaining} planned sessions · about {courseGoal.suggestedSessionMinutes} minutes per session.</p> : null}
        </section>
      ) : null}

      {blockedByPrerequisites ? (
        <section className="rounded-lg border border-[#d9f99d]/40 bg-[#d9f99d]/10 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#d9f99d] text-[#102b26]">
                <Lock size={17} />
              </span>
              <div>
                <h2 className="font-semibold text-ink">Prerequisite required</h2>
                <p className="mt-1 text-sm leading-6 text-black/60">
                  Premium access is active, but this course also requires prior progress.
                  Complete the prerequisite course to at least {prerequisiteThreshold}% before enrolling.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handlePrerequisiteAction}
              className="shrink-0"
            >
              Open prerequisite <ArrowRight size={15} />
            </Button>
          </div>

          <div className="mt-4 space-y-2">
            {unmetPrerequisites.map((item) => (
              <div
                key={item.id}
                className="rounded-md border border-black/10 bg-white/80 px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-medium text-ink">{item.title}</span>
                  <span className="text-black/55">
                    {item.progress}% / {prerequisiteThreshold}% required
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/10">
                  <div
                    className="h-full rounded-full bg-[#102b26]"
                    style={{ width: `${Math.min(item.progress, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

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
      {isEnrolled && courseObjectId ? (
        <section className="mt-6 rounded-lg border border-black/10 bg-white p-5 sm:p-6">
          <ContextualDiscussionRoom targetType="COURSE" targetId={courseObjectId} />
        </section>
      ) : null}
    </DemoPageRoot>
  );
};
