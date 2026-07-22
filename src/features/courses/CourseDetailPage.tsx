'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
  Crown,
  Lock,
  Milestone,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { coursesService, enrollmentsService } from '../../services';
import { extractApiError, extractApiErrorCode } from '../../services/apiClient';
import { Button, EmptyState, Skeleton } from '../../components/shared';
import { useAuthStore } from '../../store';
import type { Course, CourseLevel, Enrollment } from '../../types';
import {
  COURSE_ACCENT_COLORS,
  DemoPageRoot,
  DemoPill,
} from '../ui-reskin/demo-ui';
import {
  buildFallbackLessons,
  buildFallbackOutcomes,
  buildFallbackTags,
} from '../ui-reskin/demo-fallbacks';

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

type EnrollmentBlockReason = 'premium' | 'prerequisite' | null;

const isPremiumActive = (planType?: string, expiresAt?: string) =>
  planType === 'PREMIUM' && (!expiresAt || new Date(expiresAt).getTime() > Date.now());

const getCourseRef = (course: Course) => course._id ?? course.id ?? '';

/**
 * PR10 — course detail mirrors DemoCourseDetailPage hero + lesson list.
 * LOGIC LOCK: getById, enrollments, enroll mutation, continue → first lesson.
 */
export const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuthStore();
  const [serverBlockReason, setServerBlockReason] = useState<EnrollmentBlockReason>(null);

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

  const { data: courseCatalog } = useQuery({
    queryKey: ['courses', 'access-catalog'],
    queryFn: () => coursesService.list({ limit: 100 }),
    enabled: Boolean(course?.prerequisites?.length),
    staleTime: 5 * 60 * 1000,
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
  const progress = Math.round(enrollment?.progressPercent ?? enrollment?.progress ?? 0);
  const completedSet = useMemo(
    () => new Set(enrollment?.completedLessons ?? []),
    [enrollment?.completedLessons],
  );

  const missingPrerequisites = useMemo(() => {
    const threshold = course?.prerequisiteThreshold ?? 80;
    const catalog = courseCatalog?.items ?? [];
    const coursesById = new Map(catalog.map((item) => [getCourseRef(item), item]));

    return (course?.prerequisites ?? [])
      .map((requiredCourseId) => {
        const prerequisiteEnrollment = myEnrollments.find((item) => getEnrollmentCourseRef(item).id === requiredCourseId);
        const progressPercent = Math.round(
          prerequisiteEnrollment?.progressPercent ?? prerequisiteEnrollment?.progress ?? 0,
        );
        return {
          id: requiredCourseId,
          course: coursesById.get(requiredCourseId),
          progressPercent,
          requiredProgress: threshold,
          isComplete: progressPercent >= threshold,
        };
      })
      .filter((prerequisite) => !prerequisite.isComplete);
  }, [course?.prerequisiteThreshold, course?.prerequisites, courseCatalog?.items, myEnrollments]);

  const localBlockReason: EnrollmentBlockReason = !isEnrolled && course?.isPremium && !isPremiumActive(
    user?.planType,
    user?.subscriptionExpiresAt,
  )
    ? 'premium'
    : !isEnrolled && missingPrerequisites.length > 0
      ? 'prerequisite'
      : null;
  const blockReason = serverBlockReason ?? localBlockReason;
  const firstMissingPrerequisite = missingPrerequisites[0];

  const accent =
    COURSE_ACCENT_COLORS[(course?.title?.length ?? 0) % COURSE_ACCENT_COLORS.length];

  const continueLessonId = useMemo(() => {
    if (enrollment?.lastLessonId) return enrollment.lastLessonId;
    const nextOpen = courseLessons.find((lesson) => !completedSet.has(lesson._id) && !lesson.isLocked);
    return nextOpen?._id ?? courseLessons[0]?._id;
  }, [completedSet, courseLessons, enrollment?.lastLessonId]);

  const handleContinue = () => {
    if (continueLessonId) {
      router.push(`/lessons/${continueLessonId}`);
      return;
    }
    router.push('/dashboard');
  };

  const { mutate: enroll, isPending: enrolling } = useMutation({
    mutationFn: () => {
      if (!courseObjectId) {
        throw new Error('Course id is missing');
      }
      return enrollmentsService.enroll(courseObjectId);
    },
    onSuccess: () => {
      setServerBlockReason(null);
      queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['course-detail', courseId] });
      toast.success('Enrolled in course');
    },
    onError: (error) => {
      const code = extractApiErrorCode(error);
      const message = extractApiError(error, 'Could not enroll in this course');
      if (code === 'COURSE_PREMIUM_REQUIRED') {
        setServerBlockReason('premium');
        return;
      }
      if (code === 'COURSE_PREREQUISITE_REQUIRED') {
        setServerBlockReason('prerequisite');
        return;
      }
      toast.error(message);
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

  const hasRealLessons = courseLessons.length > 0;
  const displayLessons = hasRealLessons
    ? courseLessons
    : buildFallbackLessons(courseObjectId ?? courseId ?? 'mock-course', course.language);
  const displayLessonCount = course.totalLessons ?? displayLessons.length;
  const tags = course.tags?.length ? course.tags : buildFallbackTags(course.language);
  const fallbackOutcomes = buildFallbackOutcomes(course.language, displayLessonCount);
  const outcomes = [
    course.shortDescription || course.description,
    `${displayLessonCount} structured lessons`,
    course.language ? `Hands-on ${course.language} practice` : 'Hands-on coding practice',
    isEnrolled ? 'Resume anytime from your dashboard' : 'Enroll free to unlock lessons',
  ].filter(Boolean) as string[];
  const displayOutcomes = outcomes.length >= 4 ? outcomes : fallbackOutcomes;
  const accessAction = () => {
    if (blockReason === 'premium') {
      router.push('/pricing');
      return;
    }
    if (firstMissingPrerequisite?.course) {
      router.push(`/courses/${firstMissingPrerequisite.course.slug ?? firstMissingPrerequisite.id}`);
      return;
    }
    router.push('/courses');
  };

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

      <section className={`course-detail-hero ${accent} relative overflow-hidden rounded-[1.5rem] border border-white/70 p-6 shadow-[0_18px_36px_rgb(16_43_38_/_0.08)] sm:p-8`}>
        <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_minmax(19rem,24rem)] xl:items-end">
          <div>
            <div className="mb-5 flex flex-wrap gap-2">
              {course.level ? <DemoPill tone={levelTone(course.level)}>{course.level.toLowerCase()}</DemoPill> : null}
              {course.language ? <DemoPill tone="blue">{course.language}</DemoPill> : null}
              {course.isPremium ? <DemoPill>Premium</DemoPill> : null}
            </div>
            <h1 className="course-detail-hero-title max-w-4xl text-4xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-5xl">{course.title}</h1>
            <p className="course-detail-hero-summary mt-5 max-w-2xl text-sm leading-6 sm:text-base">
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
                {isEnrolled ? 'Course progress' : blockReason ? 'Access requirement' : 'Ready to start'}
              </p>
              {isEnrolled ? (
                <>
                  <p className="mt-2 text-4xl font-semibold">{`${progress}%`}</p>
                  <div className="course-hero-progress-track mt-4">
                    <div
                      className="course-hero-progress-fill transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </>
              ) : !blockReason ? (
                <div className="course-hero-start-state mt-4">
                  <span className="course-hero-start-icon">
                    <BookOpen size={18} />
                  </span>
                  <div>
                    <p className="font-semibold text-white">Your learning path is ready</p>
                    <p className="course-hero-start-copy mt-1 text-sm">
                      Enroll to unlock {displayLessonCount} lessons and start at your own pace.
                    </p>
                  </div>
                </div>
              ) : null}
              {blockReason ? (
                <div className="course-hero-access-card mt-5 rounded-xl p-4 text-left">
                  <div className="flex gap-2.5">
                    <div className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ${blockReason === 'premium' ? 'bg-amber-400/20 text-amber-800' : 'bg-sky-500/10 text-sky-800'}`}>
                      {blockReason === 'premium' ? <Crown size={15} /> : <Milestone size={15} />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-black">
                        {blockReason === 'premium' ? 'Premium access required' : 'Complete a prerequisite first'}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-black/60">
                        {blockReason === 'premium'
                          ? 'This course is included with an active Premium plan.'
                          : firstMissingPrerequisite
                            ? `${firstMissingPrerequisite.course?.title ?? 'A required course'} needs ${firstMissingPrerequisite.requiredProgress}% completion. You are at ${firstMissingPrerequisite.progressPercent}%.`
                            : 'Finish the required course before enrolling.'}
                      </p>
                    </div>
                  </div>
                  <Button onClick={accessAction} className="course-hero-status-action mt-3 w-full" size="sm">
                    {blockReason === 'premium' ? 'View Premium plans' : firstMissingPrerequisite?.course ? 'Open required course' : 'Browse courses'}
                    <ArrowRight size={14} />
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => (isEnrolled ? handleContinue() : enroll())}
                  loading={enrolling}
                  disabled={!isEnrolled && !courseObjectId}
                  className="course-hero-status-action course-hero-primary-action mt-5 w-full bg-[#d9f99d] text-[#102b26] hover:bg-[#bef264]"
                >
                  {isEnrolled ? (
                    <>
                      Continue lesson <ArrowRight size={16} />
                    </>
                  ) : (
                    'Enroll'
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]">
        <div className="course-lessons-panel rounded-lg border border-black/10 bg-white p-4 sm:p-5">
          <h2 className="text-xl font-semibold">Lessons</h2>
          {!hasRealLessons ? (
            <p className="accent-surface-subtle mt-2 rounded-lg px-3 py-2 text-xs">
              Mock lesson preview from the demo flow. Replace when lessonsService data is available.
            </p>
          ) : null}
          {displayLessons.length > 0 ? (
            <div className="lesson-list mt-5 overflow-hidden rounded-xl border border-black/10">
              {displayLessons.map((lesson, index) => {
                const done = completedSet.has(lesson._id);
                const isCurrent = continueLessonId === lesson._id && isEnrolled && !done;
                const locked = !!lesson.isLocked && !isEnrolled;

                return (
                  <button
                    key={lesson._id}
                    type="button"
                    onClick={() => {
                      if (!hasRealLessons) {
                        toast.info('This is a mock lesson preview. Connect lesson data to open it.');
                        return;
                      }
                      if (locked) {
                        toast.error('Enroll to unlock this lesson');
                        return;
                      }
                      router.push(`/lessons/${lesson._id}`);
                    }}
                    className={`lesson-list-row grid w-full grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-4 text-left transition sm:grid-cols-[2.75rem_minmax(0,1fr)_auto] sm:px-5 ${
                      done ? 'lesson-list-row-complete' : isCurrent ? 'lesson-list-row-current' : ''
                    }`}
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
                      {locked ? <Lock size={16} /> : done ? <CheckCircle2 size={16} /> : index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="lesson-list-title block font-medium">{lesson.title}</span>
                      <span className="lesson-list-meta mt-1 block text-sm">
                        Lesson {lesson.order ?? lesson.orderIndex ?? index + 1}
                        {lesson.duration || lesson.estimatedTime
                          ? ` · ${lesson.duration ?? lesson.estimatedTime} min`
                          : ''}
                      </span>
                    </span>
                    {(lesson.duration ?? lesson.estimatedTime) ? (
                      <span className="lesson-list-duration shrink-0 text-sm">
                        {lesson.duration ?? lesson.estimatedTime} min
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <aside className="rounded-lg border border-black/10 bg-white p-5">
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
        </aside>
      </section>
    </DemoPageRoot>
  );
};
