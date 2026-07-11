'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle, CheckCircle, Clock, Zap, ArrowLeft, Bookmark,
} from 'lucide-react';
import { toast } from 'sonner';
import { lessonsService, bookmarksService } from '../../services';
import { Card, Button, Badge, EmptyState } from '../../components/shared';

const LessonMarkdown = dynamic(
  () => import('./LessonMarkdown').then((module) => module.LessonMarkdown),
  { loading: () => <div className="h-32 skeleton rounded-lg" /> }
);
const CommentsSection = dynamic(
  () => import('./CommentsSection').then((module) => module.CommentsSection),
  { loading: () => <div className="h-24 skeleton rounded-lg" /> }
);
const NotesPanel = dynamic(
  () => import('./NotesPanel').then((module) => module.NotesPanel),
  { loading: () => <div className="h-32 skeleton rounded-lg" /> }
);



// ─── Lesson Viewer Page ───────────────────────────────────────────────────────
const getHttpStatus = (error: unknown) =>
  (error as { response?: { status?: number } })?.response?.status;

export const LessonPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'content' | 'comments' | 'notes'>('content');

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

  const { mutate: toggleBookmark } = useMutation({
    mutationFn: () => bookmarksService.toggle(id!, lesson?.title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      toast.success('Bookmark toggled');
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

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => router.back()} className="btn-ghost shrink-0">
            <ArrowLeft size={14} />
          </button>
          {isLoading ? (
            <div className="h-5 w-48 skeleton rounded" />
          ) : (
            <h1 className="font-mono font-bold text-xl text-gray-100 truncate">{lesson?.title}</h1>
          )}
        </div>
        {lesson && (
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => toggleBookmark()} className="btn-ghost" title="Bookmark">
              <Bookmark size={14} />
            </button>
            <button onClick={() => router.push(`/quiz/${id}`)} className="btn-outline text-sm">
              <Zap size={13} />
              Take quiz
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <div className="h-4 skeleton rounded w-3/4" />
          <div className="h-4 skeleton rounded" />
          <div className="h-4 skeleton rounded w-5/6" />
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
              <ArrowLeft size={14} />
              Back
            </Button>
          )}
        />
      ) : lesson ? (
        <>
          <Card className="px-4 py-2.5 flex items-center gap-4 flex-wrap">
            {duration > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-600 font-mono">
                <Clock size={11} />{duration} min
              </span>
            )}
            {lesson.videoUrl && <Badge color="purple">Video</Badge>}
            {lesson.attachmentUrl && (
              <a href={lesson.attachmentUrl} target="_blank" rel="noreferrer" className="text-xs text-violet-400 hover:text-violet-300 font-mono">
                Attachment
              </a>
            )}
            {order != null && <span className="text-xs text-gray-700 font-mono">Order: #{order}</span>}
            <Button size="sm" variant="outline" onClick={() => completeLesson()} loading={completing} className="ml-auto">
              <CheckCircle size={12} />
              Mark complete
            </Button>
          </Card>

          <div className="flex gap-1 border-b border-white/[0.06] pb-0.5">
            {(['content', 'comments', 'notes'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-xs font-mono rounded-t-lg transition-colors ${
                  activeTab === tab
                    ? 'text-violet-300 bg-violet-500/10 border border-b-0 border-violet-500/20'
                    : 'text-gray-600 hover:text-gray-400'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === 'content' && (
            <Card className="p-6">
              {lesson.videoUrl && (
                <div className="mb-5 rounded-xl overflow-hidden border border-white/[0.05] bg-black aspect-video">
                  <iframe src={lesson.videoUrl} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                </div>
              )}
              <div className="prose prose-invert prose-sm max-w-none font-mono text-gray-300 leading-relaxed [&_pre]:bg-black/40 [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-white/[0.06] [&_pre]:p-4 [&_code]:text-violet-300 [&_a]:text-violet-400 [&_h1]:text-gray-100 [&_h2]:text-gray-200 [&_h3]:text-gray-200 [&_blockquote]:border-violet-500/30 [&_blockquote]:text-gray-500">
                <LessonMarkdown content={content} />
              </div>
            </Card>
          )}
          {activeTab === 'comments' && (
            <Card className="p-4">
              <CommentsSection lessonId={id!} />
            </Card>
          )}
          {activeTab === 'notes' && <NotesPanel lessonId={id!} />}
        </>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-gray-500 font-mono">Lesson not found</p>
        </Card>
      )}
    </div>
  );
};

// ─── 404 Page ─────────────────────────────────────────────────────────────────
export const NotFoundPage: React.FC = () => {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-center">
        <p className="font-mono font-bold text-[96px] text-white/5 leading-none">404</p>
        <h1 className="font-mono font-bold text-2xl text-gray-300 -mt-4">Page not found</h1>
        <p className="text-gray-600 font-mono text-sm mt-2">The page you are looking for does not exist.</p>
        <button onClick={() => router.push('/dashboard')} className="btn-primary mt-6 mx-auto">
          Go home
        </button>
      </div>
    </div>
  );
};
