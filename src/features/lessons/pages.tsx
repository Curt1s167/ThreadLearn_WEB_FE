'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Bookmark,
  CheckCircle2,
  Clock,
  MessageCircle,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { bookmarksService, lessonsService } from '../../services';
import { Button, EmptyState } from '../../components/shared';
import { DemoPageRoot, DemoPill } from '../ui-reskin/demo-ui';

const LessonMarkdown = dynamic(
  () => import('./LessonMarkdown').then((module) => module.LessonMarkdown),
  { loading: () => <div className="h-32 skeleton rounded-lg" /> },
);
const CommentsSection = dynamic(
  () => import('./CommentsSection').then((module) => module.CommentsSection),
  { loading: () => <div className="h-24 skeleton rounded-lg" /> },
);
const NotesPanel = dynamic(
  () => import('./NotesPanel').then((module) => module.NotesPanel),
  { loading: () => <div className="h-32 skeleton rounded-lg" /> },
);

const getHttpStatus = (error: unknown) =>
  (error as { response?: { status?: number } })?.response?.status;

/**
 * PR10 — lesson room mirrors DemoLessonPage (content + sticky aside).
 * LOGIC LOCK: getById, bookmark toggle, complete mutation, quiz link, comments/notes.
 */
export const LessonPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activePanel, setActivePanel] = useState<'notes' | 'comments'>('notes');

  const {
    data: lesson,
    error,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['lesson', id],
    queryFn: () => lessonsService.getById(id!),
    enabled: !!id,
  });

  const isEnrollmentRequired = getHttpStatus(error) === 403;

  useEffect(() => {
    if (isError && !isEnrollmentRequired) toast.error('Failed to load lesson');
  }, [isEnrollmentRequired, isError]);

  const { data: bookmarksPage } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: bookmarksService.getAll,
    enabled: !!id,
    retry: false,
  });
  const isBookmarked = !!bookmarksPage?.data?.some((bm) => bm.targetId === id);

  const { mutate: toggleBookmark, isPending: bookmarking } = useMutation({
    mutationFn: () => bookmarksService.toggle(id!, lesson?.title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      toast.success(isBookmarked ? 'Bookmark removed' : 'Bookmarked');
    },
    onError: () => toast.error('Failed to toggle bookmark'),
  });

  const { mutate: completeLesson, isPending: completing } = useMutation({
    mutationFn: () => lessonsService.complete(id!),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lesson', id] });
      queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['gamification-stats'] });
      toast.success(data.xpAwarded ? `Lesson complete. +${data.xpAwarded} XP` : 'Lesson complete');
    },
    onError: () => toast.error('Failed to complete lesson'),
  });

  const duration = lesson?.estimatedTime ?? lesson?.duration ?? 0;
  const order = lesson?.orderIndex ?? lesson?.order;
  const content = lesson?.contentMarkdown ?? lesson?.content ?? '';
  const courseHref =
    typeof lesson?.courseId === 'string' ? `/courses/${lesson.courseId}` : '/courses';

  return (
    <DemoPageRoot>
      {isLoading ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_390px]">
          <div className="space-y-5">
            <div className="h-40 rounded-lg skeleton" />
            <div className="h-80 rounded-lg skeleton" />
          </div>
          <div className="h-64 rounded-lg skeleton" />
        </div>
      ) : isError ? (
        <EmptyState
          icon={<AlertCircle size={36} />}
          title={isEnrollmentRequired ? 'Enrollment required' : 'Could not load lesson'}
          description={
            isEnrollmentRequired
              ? 'Please enroll in this course before opening this lesson.'
              : 'Please try again in a moment'
          }
          action={(
            <Button variant="outline" onClick={() => router.back()}>
              Back
            </Button>
          )}
        />
      ) : lesson ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_390px]">
          <article className="space-y-5">
            <div className="rounded-lg bg-white p-6 sm:p-8">
              <Link href={courseHref} className="text-sm text-black/50 hover:text-black">
                Back to course
              </Link>
              <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-3 flex flex-wrap gap-2">
                    {order != null ? <DemoPill tone="default">Lesson #{order}</DemoPill> : null}
                    {duration > 0 ? (
                      <DemoPill tone="blue">
                        <span className="inline-flex items-center gap-1">
                          <Clock size={12} />
                          {duration} min
                        </span>
                      </DemoPill>
                    ) : null}
                    {lesson.videoUrl ? <DemoPill tone="pink">Video</DemoPill> : null}
                  </div>
                  <h1 className="text-4xl font-light tracking-tight text-ink">{lesson.title}</h1>
                  {lesson.attachmentUrl ? (
                    <a
                      href={lesson.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-block text-sm font-medium text-black/60 underline underline-offset-2 hover:text-black"
                    >
                      Download attachment
                    </a>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => toggleBookmark()}
                  disabled={bookmarking}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${
                    isBookmarked ? 'bg-[#d9f99d] text-ink' : 'bg-black text-white hover:bg-black/90'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <Bookmark size={14} className={isBookmarked ? 'fill-current' : ''} />
                    {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                  </span>
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-black/10 bg-white p-6 sm:p-8">
              {lesson.videoUrl ? (
                <div className="mb-6 aspect-video overflow-hidden rounded-lg border border-black/10 bg-black">
                  <iframe
                    src={lesson.videoUrl}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={lesson.title}
                  />
                </div>
              ) : null}
              <div className="prose prose-neutral max-w-none text-base leading-8 text-black/70 [&_a]:text-black [&_code]:rounded [&_code]:bg-black/[0.04] [&_code]:px-1 [&_h1]:text-ink [&_h2]:text-ink [&_h3]:text-ink [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-black/10 [&_pre]:bg-[#111827] [&_pre]:p-4 [&_pre]:text-[#d9f99d]">
                <LessonMarkdown content={content} />
              </div>
            </div>

            <div className="rounded-lg border border-black/10 bg-white p-6 xl:hidden">
              <div className="mb-4 flex gap-2">
                {(['notes', 'comments'] as const).map((panel) => (
                  <button
                    key={panel}
                    type="button"
                    onClick={() => setActivePanel(panel)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize ${
                      activePanel === panel ? 'bg-black text-white' : 'bg-black/[0.04] text-black/55'
                    }`}
                  >
                    {panel}
                  </button>
                ))}
              </div>
              {activePanel === 'notes' ? <NotesPanel lessonId={id!} /> : <CommentsSection lessonId={id!} />}
            </div>
          </article>

          <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
            <div className="rounded-lg bg-[#d9f99d] p-5">
              <Zap size={22} className="text-ink" />
              <h2 className="mt-4 text-xl font-semibold text-ink">Quiz check-in</h2>
              <p className="mt-3 text-sm text-black/65">
                Lock in this lesson with a short quiz. Timer and auto-submit stay on the quiz flow.
              </p>
              <button
                type="button"
                onClick={() => router.push(`/quiz/${id}`)}
                className="mt-5 rounded-full bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90"
              >
                Take quiz
              </button>
            </div>

            <div className="hidden rounded-lg border border-black/10 bg-white p-5 xl:block">
              <NotesPanel lessonId={id!} />
            </div>

            <div className="rounded-lg border border-black/10 bg-white p-5">
              <h2 className="font-semibold text-ink">Lesson checklist</h2>
              <div className="mt-4 space-y-3 text-sm">
                {[
                  { label: 'Read the explanation', done: true },
                  { label: 'Review the code / video', done: !!content || !!lesson.videoUrl },
                  { label: 'Mark lesson complete', done: false },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 text-black/70">
                    <span
                      className={`grid h-5 w-5 place-items-center rounded-full ${
                        item.done ? 'bg-black text-white' : 'bg-black/10'
                      }`}
                    >
                      {item.done ? <CheckCircle2 size={13} /> : null}
                    </span>
                    {item.label}
                  </div>
                ))}
              </div>
              <Button
                size="sm"
                className="mt-5 w-full"
                onClick={() => completeLesson()}
                loading={completing}
              >
                <CheckCircle2 size={14} />
                Mark complete
              </Button>
            </div>

            <div className="hidden rounded-lg border border-black/10 bg-white p-5 xl:block">
              <div className="mb-4 flex items-center gap-2">
                <MessageCircle size={18} />
                <h2 className="font-semibold text-ink">Discussion</h2>
              </div>
              <CommentsSection lessonId={id!} />
            </div>
          </aside>
        </div>
      ) : (
        <EmptyState
          icon={<AlertCircle size={36} />}
          title="Lesson not found"
          description="This lesson may have been removed"
          action={(
            <Button variant="outline" onClick={() => router.push('/courses')}>
              Browse courses
            </Button>
          )}
        />
      )}
    </DemoPageRoot>
  );
};

export const NotFoundPage: React.FC = () => {
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas-cream">
      <div className="text-center">
        <p className="text-[96px] font-light leading-none text-black/5">404</p>
        <h1 className="-mt-4 text-2xl font-semibold text-ink">Page not found</h1>
        <p className="mt-2 text-sm text-black/50">The page you are looking for does not exist.</p>
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="btn-primary mx-auto mt-6"
        >
          Go home
        </button>
      </div>
    </div>
  );
};
