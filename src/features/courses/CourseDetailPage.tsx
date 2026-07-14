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
import type { CourseLevel, Enrollment } from '../../types';
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

/**
 * PR10 — course detail mirrors DemoCourseDetailPage hero + lesson list.
 * LOGIC LOCK: getById, enrollments, enroll mutation, continue → first lesson.
 */
export const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();

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
  const courseLessons = detail?.lessons ?? [];

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
  const progress = Math.round(enrollment?.progressPercent ?? enrollment?.progress ?? 0);
  const completedSet = useMemo(
    () => new Set(enrollment?.completedLessons ?? []),
    [enrollment?.completedLessons],
  );

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

  const outcomes = [
    course.shortDescription || course.description,
    `${course.totalLessons ?? courseLessons.length} structured lessons`,
    course.language ? `Hands-on ${course.language} practice` : 'Hands-on coding practice',
    isEnrolled ? 'Resume anytime from your dashboard' : 'Enroll free to unlock lessons',
  ].filter(Boolean) as string[];

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
                {course.totalLessons ?? courseLessons.length} lessons
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

          <div className="relative overflow-hidden rounded-lg bg-white/72 p-5 backdrop-blur-sm">
            {course.thumbnailUrl ? (
              <div className="pointer-events-none absolute inset-0 opacity-20">
                <Image src={course.thumbnailUrl} alt="" fill unoptimized className="object-cover" />
              </div>
            ) : null}
            <div className="relative">
              <p className="text-sm text-black/55">{isEnrolled ? 'Course progress' : 'Ready to start'}</p>
              <p className="mt-2 text-4xl font-semibold">{isEnrolled ? `${progress}%` : '—'}</p>
              <div className="mt-4 h-2 rounded-full bg-black/10">
                <div
                  className="h-2 rounded-full bg-black transition-all"
                  style={{ width: `${isEnrolled ? progress : 0}%` }}
                />
              </div>
              <Button
                onClick={() => (isEnrolled ? handleContinue() : enroll())}
                loading={enrolling}
                disabled={!isEnrolled && !courseObjectId}
                className="mt-5 w-full"
              >
                {isEnrolled ? (
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
        <div className="rounded-lg border border-black/10 bg-white p-5">
          <h2 className="text-xl font-semibold">Lessons</h2>
          {courseLessons.length === 0 ? (
            <EmptyState
              icon={<BookOpen size={36} />}
              title="No lessons yet"
              description="This course does not have published lessons"
            />
          ) : (
            <div className="mt-5 divide-y divide-black/10">
              {courseLessons.map((lesson, index) => {
                const done = completedSet.has(lesson._id);
                const isCurrent = continueLessonId === lesson._id && isEnrolled && !done;
                const locked = !!lesson.isLocked && !isEnrolled;

                return (
                  <button
                    key={lesson._id}
                    type="button"
                    onClick={() => {
                      if (locked) {
                        toast.error('Enroll to unlock this lesson');
                        return;
                      }
                      router.push(`/lessons/${lesson._id}`);
                    }}
                    className="flex w-full items-center gap-4 py-4 text-left transition hover:bg-black/[0.02]"
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
                      <span className="block font-medium text-ink">{lesson.title}</span>
                      <span className="mt-1 block text-sm text-black/50">
                        Lesson {lesson.order ?? lesson.orderIndex ?? index + 1}
                        {lesson.duration || lesson.estimatedTime
                          ? ` · ${lesson.duration ?? lesson.estimatedTime} min`
                          : ''}
                      </span>
                    </span>
                    {(lesson.duration ?? lesson.estimatedTime) ? (
                      <span className="shrink-0 text-sm text-black/45">
                        {lesson.duration ?? lesson.estimatedTime} min
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <aside className="rounded-lg border border-black/10 bg-white p-5">
          <h2 className="text-xl font-semibold">What you will learn</h2>
          <div className="mt-5 space-y-3">
            {outcomes.map((outcome) => (
              <div key={outcome} className="flex gap-3 text-sm text-black/65">
                <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-black" />
                <span className="line-clamp-3">{outcome}</span>
              </div>
            ))}
          </div>
          {course.tags?.length ? (
            <div className="mt-6 flex flex-wrap gap-2 border-t border-black/10 pt-5">
              {course.tags.map((tag) => (
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
