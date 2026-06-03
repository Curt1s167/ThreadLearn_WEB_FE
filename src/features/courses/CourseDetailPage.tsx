'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, CheckCircle2, Clock, Lock, Play, Star, Users } from 'lucide-react';
import { toast } from 'sonner';
import { coursesService, enrollmentsService } from '../../services';
import { Badge, Button, Card, EmptyState, Skeleton } from '../../components/shared';

export const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'reviews'>('overview');
  const [rating, setRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['course-detail', courseId],
    queryFn: () => coursesService.getById(courseId!),
    enabled: !!courseId,
  });

  const { data: enrollment } = useQuery({
    queryKey: ['my-enrollment', courseId],
    queryFn: () => enrollmentsService.getMyCourse(courseId!),
    enabled: !!courseId,
    retry: false,
  });

  const { mutate: enroll, isPending } = useMutation({
    mutationFn: () => enrollmentsService.enroll(courseId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-enrollment', courseId] });
      queryClient.invalidateQueries({ queryKey: ['course-detail', courseId] });
      toast.success('Enrolled successfully');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Could not enroll in this course');
    },
  });

  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ['course-reviews', courseId],
    queryFn: () => coursesService.getReviews(courseId!),
    enabled: !!courseId,
  });

  const { mutate: submitReview, isPending: reviewing } = useMutation({
    mutationFn: () => coursesService.review(courseId!, { rating, content: reviewContent || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-reviews', courseId] });
      queryClient.invalidateQueries({ queryKey: ['course-detail', courseId] });
      setReviewContent('');
      toast.success('Review saved');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Could not save review'),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5 animate-fade-in">
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" count={3} />
      </div>
    );
  }

  if (error || !data?.course) {
    return (
      <EmptyState
        icon={<BookOpen size={34} />}
        title="Course not found"
        description="This course is unavailable or you do not have access."
        action={<Button variant="outline" onClick={() => router.push('/courses')}>Back to courses</Button>}
      />
    );
  }

  const { course, lessons } = data;
  const availableLessons = lessons ?? [];
  const firstLesson = availableLessons.find((lesson) => lesson.isPreview) ?? availableLessons[0];
  const resumeLessonId = (enrollment as any)?.lastLessonId ?? firstLesson?._id;
  const progress = (enrollment as any)?.progressPercent ?? enrollment?.progress ?? 0;

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <button onClick={() => router.back()} className="btn-ghost self-start">
        <ArrowLeft size={14} />
        Back
      </button>

      <section className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
        <Card className="overflow-hidden">
          <div className="h-52 bg-black/30 border-b border-white/[0.06] relative">
            {course.thumbnailUrl ? (
              <img src={course.thumbnailUrl} alt={course.title} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <BookOpen size={44} className="text-violet-500/50" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#111118] via-[#111118]/30 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
              <Badge color="purple">{course.language}</Badge>
              <Badge color="green">{course.level}</Badge>
              {course.isPremium && <Badge color="amber">Premium</Badge>}
            </div>
          </div>
          <div className="p-5">
            <h1 className="font-mono text-2xl font-bold text-gray-100">{course.title}</h1>
            <p className="mt-2 text-sm text-gray-500 font-mono leading-relaxed">
              {course.shortDescription || course.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600 font-mono">
              <span className="flex items-center gap-1"><BookOpen size={12} />{course.totalLessons ?? availableLessons.length} lessons</span>
              <span className="flex items-center gap-1"><Users size={12} />{course.totalEnrollments ?? 0} students</span>
              <span className="flex items-center gap-1"><Clock size={12} />{course.estimatedDuration ?? 0} min</span>
              <span className="flex items-center gap-1"><Star size={12} />{course.averageRating ?? 0} ({course.totalReviews ?? 0})</span>
            </div>
          </div>
        </Card>

        <Card className="p-5 h-fit">
          {enrollment ? (
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-gray-500 mb-2">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full bg-violet-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <Button onClick={() => resumeLessonId && router.push(`/lessons/${resumeLessonId}`)} disabled={!resumeLessonId}>
                <Play size={14} />
                Continue learning
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-gray-500 font-mono">
                Enroll to unlock non-preview lessons, notes, comments, bookmarks, code execution and AI recommendations.
              </p>
              <Button onClick={() => enroll()} loading={isPending}>
                <CheckCircle2 size={14} />
                Enroll
              </Button>
              {firstLesson?.isPreview && (
                <Button variant="outline" onClick={() => router.push(`/lessons/${firstLesson._id}`)}>
                  Preview lesson
                </Button>
              )}
            </div>
          )}
        </Card>
      </section>

      <div className="flex gap-1 border-b border-white/[0.06]">
        {(['overview', 'curriculum', 'reviews'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 text-xs font-mono rounded-t-lg transition-colors ${
              activeTab === tab
                ? 'text-violet-300 bg-violet-500/10 border border-b-0 border-violet-500/20'
                : 'text-gray-600 hover:text-gray-400'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <Card className="p-5">
          <h2 className="font-mono text-sm font-semibold text-gray-300 mb-3">Overview</h2>
          <p className="text-sm text-gray-500 font-mono leading-relaxed whitespace-pre-wrap">
            {course.description}
          </p>
        </Card>
      )}

      {activeTab === 'curriculum' && (
      <Card className="p-4">
        <h2 className="font-mono text-sm font-semibold text-gray-300 mb-3">Curriculum</h2>
        <div className="divide-y divide-white/[0.04]">
          {availableLessons.length > 0 ? (
            availableLessons.map((lesson, index) => (
              <button
                key={lesson._id}
                onClick={() => router.push(`/lessons/${lesson._id}`)}
                className="w-full flex items-center justify-between gap-3 py-3 text-left hover:bg-white/[0.03] rounded-lg px-2 transition-colors"
              >
                <span className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-gray-700 font-mono w-6">{index + 1}</span>
                  <span className="text-sm text-gray-300 font-mono truncate">{lesson.title}</span>
                </span>
                <span className="flex items-center gap-2 shrink-0">
                  {lesson.isPreview && <Badge color="green">Preview</Badge>}
                  {(lesson.isLocked || lesson.status === 'locked') && <Lock size={13} className="text-gray-600" />}
                </span>
              </button>
            ))
          ) : (
            <EmptyState title="No lessons yet" description="This course has no published lessons." />
          )}
        </div>
      </Card>
      )}

      {activeTab === 'reviews' && (
        <Card className="p-4">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="font-mono text-sm font-semibold text-gray-300">Reviews</h2>
            <Badge color="purple">{course.averageRating ?? 0} average</Badge>
          </div>
          {enrollment && (
            <div className="mb-4 rounded-lg border border-white/[0.06] p-3">
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => setRating(value)}
                    className={value <= rating ? 'text-amber-400' : 'text-gray-700'}
                  >
                    <Star size={15} />
                  </button>
                ))}
              </div>
              <textarea
                value={reviewContent}
                onChange={(event) => setReviewContent(event.target.value)}
                rows={3}
                className="input-field resize-none text-xs"
                placeholder="Share what worked well or what could improve..."
              />
              <Button size="sm" className="mt-2" loading={reviewing} onClick={() => submitReview()}>
                Save review
              </Button>
            </div>
          )}
          {reviewsLoading ? (
            <Skeleton className="h-20 rounded-xl" count={3} />
          ) : reviews && reviews.length > 0 ? (
            <div className="divide-y divide-white/[0.04]">
              {reviews.map((review) => (
                <div key={review._id} className="py-3">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-amber-400">{'★'.repeat(review.rating)}</span>
                    <span className="text-gray-700">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  {review.content && <p className="mt-1 text-sm text-gray-500 font-mono">{review.content}</p>}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No reviews yet" description="Reviews appear after enrolled students reach enough progress." />
          )}
        </Card>
      )}
    </div>
  );
};
