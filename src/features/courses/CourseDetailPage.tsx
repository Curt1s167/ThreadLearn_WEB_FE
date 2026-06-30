'use client';

import React, { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Clock,
  Lock,
  PlayCircle,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { coursesService, enrollmentsService, lessonsService } from '../../services';
import { Badge, Button, Card, EmptyState, Skeleton } from '../../components/shared';
import type { CourseLevel } from '../../types';

const levelColor: Record<CourseLevel, 'green' | 'amber' | 'red'> = {
  BEGINNER: 'green',
  INTERMEDIATE: 'amber',
  ADVANCED: 'red',
};

const getLevelColor = (level?: CourseLevel): 'green' | 'amber' | 'red' | 'gray' => {
  if (!level) return 'gray';
  return levelColor[level] ?? 'gray';
};

export const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: detail,
    isLoading: detailLoading,
    isError: detailError,
  } = useQuery({
    queryKey: ['course-detail', courseId],
    queryFn: () => coursesService.getById(courseId!),
    enabled: !!courseId,
  });

  const {
    data: lessons = [],
    isLoading: lessonsLoading,
    isError: lessonsError,
  } = useQuery({
    queryKey: ['course-lessons', courseId],
    queryFn: () => lessonsService.getByCourse(courseId!),
    enabled: !!courseId,
  });

  const { mutate: enroll, isPending: enrolling } = useMutation({
    mutationFn: () => enrollmentsService.enroll(courseId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
      toast.success('Enrolled in course');
    },
    onError: () => toast.error('Could not enroll in this course'),
  });

  useEffect(() => {
    if (detailError) toast.error('Failed to load course');
    if (lessonsError) toast.error('Failed to load lessons');
  }, [detailError, lessonsError]);

  const course = detail?.course;
  const courseLessons = lessons.length > 0 ? lessons : detail?.lessons ?? [];

  if (detailLoading) {
    return (
      <div className="flex flex-col gap-4 animate-fade-in">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" count={3} />
      </div>
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

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <button onClick={() => router.back()} className="btn-ghost self-start">
        <ArrowLeft size={14} />
        Back
      </button>

      <Card className="overflow-hidden">
        <div className="h-52 bg-gradient-to-br from-violet-950/60 to-black border-b border-white/[0.06] relative">
          {course.thumbnailUrl ? (
            <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen size={44} className="text-violet-500/50" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#111118] via-[#111118]/30 to-transparent" />
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge color={getLevelColor(course.level)}>{course.level ?? 'COURSE'}</Badge>
                {course.language && <span className="tag">{course.language}</span>}
                {course.isPremium && <Badge color="amber">Premium</Badge>}
              </div>
              <h1 className="font-mono font-bold text-2xl text-gray-100">{course.title}</h1>
              <p className="text-sm text-gray-500 font-mono mt-2 leading-relaxed">
                {course.shortDescription || course.description}
              </p>
            </div>
            <Button onClick={() => enroll()} loading={enrolling} className="shrink-0">
              <CheckCircle size={14} />
              Enroll
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
              <BookOpen size={14} className="text-violet-400 mb-2" />
              <p className="text-lg font-mono font-bold text-gray-100">{course.totalLessons ?? courseLessons.length}</p>
              <p className="text-xs text-gray-600 font-mono">lessons</p>
            </div>
            <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
              <Users size={14} className="text-emerald-400 mb-2" />
              <p className="text-lg font-mono font-bold text-gray-100">{course.totalEnrollments ?? 0}</p>
              <p className="text-xs text-gray-600 font-mono">learners</p>
            </div>
            <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
              <Clock size={14} className="text-amber-400 mb-2" />
              <p className="text-lg font-mono font-bold text-gray-100">{course.estimatedDuration ?? 0}</p>
              <p className="text-xs text-gray-600 font-mono">minutes</p>
            </div>
            <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
              <CheckCircle size={14} className="text-blue-400 mb-2" />
              <p className="text-lg font-mono font-bold text-gray-100">{course.status ?? 'published'}</p>
              <p className="text-xs text-gray-600 font-mono">status</p>
            </div>
          </div>
        </div>
      </Card>

      <div>
        <h2 className="font-mono font-semibold text-gray-200 text-sm mb-3">Lessons</h2>
        {lessonsLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-16 rounded-xl" count={3} />
          </div>
        ) : courseLessons.length === 0 ? (
          <EmptyState
            icon={<BookOpen size={36} />}
            title="No lessons yet"
            description="This course does not have published lessons"
          />
        ) : (
          <div className="flex flex-col gap-2">
            {courseLessons.map((lesson, index) => (
              <Card
                key={lesson._id}
                className="p-3 flex items-center gap-3 hover:border-violet-500/20 transition-all cursor-pointer"
                onClick={() => router.push(`/lessons/${lesson._id}`)}
              >
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                  {lesson.isLocked ? <Lock size={14} className="text-gray-600" /> : <PlayCircle size={14} className="text-violet-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 font-mono truncate">{lesson.title}</p>
                  <p className="text-xs text-gray-600 font-mono">
                    Lesson {lesson.order ?? index + 1}
                    {lesson.duration ? ` - ${lesson.duration} min` : ''}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
