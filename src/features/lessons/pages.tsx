'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle, CheckCircle, XCircle, Clock, Zap, ChevronRight, ArrowLeft, Bookmark,
} from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { quizService, lessonsService, bookmarksService } from '../../services';
import { Card, Button, Badge, EmptyState } from '../../components/shared';
import { CommentsSection } from './CommentsSection';
import { NotesPanel } from './NotesPanel';

// ─── Quiz Page ────────────────────────────────────────────────────────────────
export const QuizPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [startedAt] = useState(new Date().toISOString());
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);

  const { data: quiz, isLoading } = useQuery({
    queryKey: ['quiz', lessonId],
    queryFn: () => quizService.getByLesson(lessonId!),
    enabled: !!lessonId,
  });

  const { mutate: submit, isPending } = useMutation({
    mutationFn: () =>
      quizService.submit({
        quizId: quiz!._id,
        answers,
        startTime: startedAt,
      }),
    onSuccess: (data) => {
      setResult({ score: data.score, passed: data.passed });
    },
    onError: () => toast.error('Failed to submit quiz'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 font-mono text-sm animate-pulse">Loading quiz...</div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <Card className="p-8 text-center max-w-md mx-auto">
        <p className="text-gray-400 font-mono">No quiz found for this lesson</p>
        <Button variant="ghost" onClick={() => router.back()} className="mt-4 mx-auto">
          <ArrowLeft size={14} />
          Go back
        </Button>
      </Card>
    );
  }

  if (result) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 max-w-md mx-auto animate-slide-in">
        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${
          result.passed ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-rose-500/10 border border-rose-500/20'
        }`}>
          {result.passed
            ? <CheckCircle size={36} className="text-emerald-400" />
            : <XCircle size={36} className="text-rose-400" />}
        </div>
        <div className="text-center">
          <h2 className="font-mono font-bold text-2xl text-gray-100">
            {result.passed ? 'Quiz passed!' : 'Better luck next time'}
          </h2>
          <p className="text-gray-500 font-mono text-sm mt-1">
            Score: <span className={result.passed ? 'text-emerald-400' : 'text-rose-400'}>
              {result.score.toFixed(0)}%
            </span>
          </p>
        </div>
        {result.passed && (
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-violet-400" />
            <span className="text-sm font-mono text-violet-300">+{quiz.xpReward} XP earned!</span>
          </div>
        )}
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft size={13} />
            Back to lesson
          </Button>
          <Button onClick={() => { setResult(null); setAnswers({}); }}>
            Retry quiz
          </Button>
        </div>
      </div>
    );
  }

  const allAnswered = quiz.questions.every((q) => answers[q._id] !== undefined);

  return (
    <div className="flex flex-col gap-5 animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="btn-ghost">
          <ArrowLeft size={14} />
        </button>
        <div className="flex-1">
          <h1 className="font-mono font-bold text-xl text-gray-100">{quiz.title}</h1>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-600 font-mono">
            <span className="flex items-center gap-1"><Clock size={11} />{Math.floor(quiz.timeLimit / 60)} min</span>
            <span className="flex items-center gap-1"><Zap size={11} />{quiz.xpReward} XP reward</span>
            <span>{quiz.questions.length} questions</span>
          </div>
        </div>
        <Badge color="purple">{Object.keys(answers).length}/{quiz.questions.length}</Badge>
      </div>

      <div className="flex flex-col gap-4">
        {quiz.questions.map((q, qi) => (
          <Card key={q._id} className="p-4">
            <p className="text-sm font-mono text-gray-200 mb-3">
              <span className="text-gray-600 mr-2">{qi + 1}.</span>
              {q.questionText}
            </p>
            <div className="flex flex-col gap-2">
              {q.options.map((opt, oi) => (
                <button
                  key={oi}
                  onClick={() => setAnswers((prev) => ({ ...prev, [q._id]: oi }))}
                  className={`text-left p-3 rounded-lg border text-sm font-mono transition-all ${
                    answers[q._id] === oi
                      ? 'bg-violet-500/10 border-violet-500/40 text-violet-300'
                      : 'border-white/[0.06] text-gray-400 hover:border-white/20 hover:text-gray-200 hover:bg-white/[0.03]'
                  }`}
                >
                  <span className="text-gray-600 mr-2">{String.fromCharCode(65 + oi)}.</span>
                  {opt}
                </button>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <div className="flex justify-end pb-6">
        <Button onClick={() => submit()} disabled={!allAnswered} loading={isPending} size="lg">
          Submit answers
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
};

// ─── Lesson Viewer Page ───────────────────────────────────────────────────────
export const LessonPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'content' | 'comments' | 'notes'>('content');

  const { data: lesson, isLoading, isError } = useQuery({
    queryKey: ['lesson', id],
    queryFn: () => lessonsService.getById(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (isError) toast.error('Failed to load lesson');
  }, [isError]);

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
          title="Could not load lesson"
          description="Please try again in a moment"
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
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
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
