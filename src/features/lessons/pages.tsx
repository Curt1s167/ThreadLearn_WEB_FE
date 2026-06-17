import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle, XCircle, Clock, Zap, ChevronRight, ChevronLeft, ArrowLeft, Bookmark, Play, Bot,
  Paperclip, Download, List, ChevronDown, Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  aiService,
  codeExecutionService,
  quizService,
  lessonsService,
  bookmarksService,
  enrollmentsService,
} from '../../services';
import { Card, Button, Badge, CodeEditor } from '../../components/shared';
import { CommentsSection } from './CommentsSection';
import { NotesPanel } from './NotesPanel';
import { ExercisePanel } from './ExercisePanel';

// ─── Quiz Page ────────────────────────────────────────────────────────────────
export const QuizPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, number>>({});
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
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {quiz.timeLimit >= 60
                ? `${Math.floor(quiz.timeLimit / 60)} min${quiz.timeLimit % 60 ? ` ${quiz.timeLimit % 60} sec` : ''}`
                : `${quiz.timeLimit} sec`}
            </span>
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
                  {typeof opt === 'string' ? opt : opt.text}
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
  const [activeTab, setActiveTab] = useState<'content' | 'comments' | 'notes' | 'ide' | 'exercise'>('content');
  const [sourceCode, setSourceCode] = useState('console.log("Hello, ThreadLearn!");');
  const [stdin, setStdin] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [runResult, setRunResult] = useState<any>(null);
  const [lessonListOpen, setLessonListOpen] = useState(true);

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['lesson', id],
    queryFn: () => lessonsService.getById(id!),
    enabled: !!id,
  });

  // Sibling lessons for prev/next navigation. Loaded only after the active
  // lesson is in so we know its courseId.
  const { data: siblingLessons } = useQuery({
    queryKey: ['lessons-by-course', lesson?.courseId],
    queryFn: () => lessonsService.getByCourse(lesson!.courseId!),
    enabled: !!lesson?.courseId,
  });

  const { data: enrollment } = useQuery({
    queryKey: ['my-enrollment', lesson?.courseId],
    queryFn: () => enrollmentsService.getMyCourse(lesson!.courseId!),
    enabled: !!lesson?.courseId,
    retry: false,
  });

  const orderedLessons = React.useMemo(
    () =>
      [...(siblingLessons ?? [])].sort(
        (a, b) => (a.orderIndex ?? a.order ?? 0) - (b.orderIndex ?? b.order ?? 0)
      ),
    [siblingLessons]
  );
  const currentLessonIndex = orderedLessons.findIndex((item) => item._id === lesson?._id);
  const completedLessonIds = new Set(enrollment?.completedLessons ?? []);

  const navigation = React.useMemo(() => {
    if (!lesson || !orderedLessons.length) return { prev: null as null | { _id: string; title: string }, next: null as null | { _id: string; title: string } };
    const idx = orderedLessons.findIndex((l) => l._id === lesson._id);
    return {
      prev: idx > 0 ? orderedLessons[idx - 1] : null,
      next: idx >= 0 && idx < orderedLessons.length - 1 ? orderedLessons[idx + 1] : null,
    };
  }, [lesson, orderedLessons]);

  const { mutate: toggleBookmark } = useMutation({
    mutationFn: () => bookmarksService.toggle(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      toast.success('Bookmark toggled');
    },
  });

  const { data: executionHistory } = useQuery({
    queryKey: ['code-execution-history', id],
    queryFn: () => codeExecutionService.history(id!),
    enabled: !!id && activeTab === 'ide',
  });

  const { mutate: completeLesson, isPending: completing } = useMutation({
    mutationFn: () => lessonsService.complete(id!),
    onSuccess: (result) => {
      const xpRewarded = Number(result?.xpRewarded) || 0;
      toast.success(
        xpRewarded > 0
          ? `Lesson completed · +${xpRewarded} XP`
          : 'Lesson already completed'
      );
      queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['gamification-stats'] });
      queryClient.invalidateQueries({ queryKey: ['gamification-stats-bootstrap'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['my-rank'] });
      if (lesson?.courseId) {
        queryClient.invalidateQueries({ queryKey: ['my-enrollment', lesson.courseId] });
      }
    },
    onError: () => toast.error('Could not complete lesson'),
  });

  const { mutate: runCode, isPending: runningCode } = useMutation({
    mutationFn: () =>
      codeExecutionService.run({
        lessonId: id!,
        sourceCode,
        stdin,
        language,
      }),
    onSuccess: (result) => {
      setRunResult(result);
      queryClient.invalidateQueries({ queryKey: ['code-execution-history', id] });
      toast.success('Code executed');
    },
    onError: () => toast.error('Code execution failed'),
  });

  const { mutate: requestAi, isPending: aiPending } = useMutation({
    mutationFn: () =>
      aiService.recommendCode({
        lessonId: id!,
        inputCode: sourceCode,
        language,
        codeExecutionId: runResult?._id,
      }),
    onSuccess: () => toast.success('AI recommendation saved'),
    onError: () => toast.error('AI recommendation failed'),
  });

  return (
    <div className="flex flex-col gap-4 animate-fade-in text-gray-200">
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
            <Button variant="outline" size="sm" onClick={() => completeLesson()} loading={completing}>
              <CheckCircle size={13} />
              Complete
            </Button>
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
      ) : lesson ? (
        <>
          <Card className="overflow-hidden border-white/[0.12] bg-[#14141d]">
            <div className="px-4 py-3 flex items-center gap-4 flex-wrap">
            {((lesson.duration ?? lesson.estimatedTime ?? 0) > 0) && (
              <span className="flex items-center gap-1.5 text-xs text-gray-300 font-mono">
                <Clock size={11} />{lesson.duration ?? lesson.estimatedTime} min
              </span>
            )}
            {lesson.videoUrl && <Badge color="purple">Video</Badge>}
            {(lesson.attachments?.length ?? 0) > 0 && (
              <Badge color="amber">{lesson.attachments!.length} files</Badge>
            )}
            <span className="text-xs text-gray-300 font-mono">
              Lesson {Math.max(1, currentLessonIndex + 1)}
              {' / '}
              {orderedLessons.length || 1}
            </span>
            <button
              type="button"
              onClick={() => setLessonListOpen((open) => !open)}
              className="ml-auto inline-flex items-center gap-2 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-200 hover:bg-violet-500/20 hover:text-white transition-colors"
              aria-expanded={lessonListOpen}
            >
              <List size={14} />
              Course lessons
              <ChevronDown
                size={14}
                className={`transition-transform ${lessonListOpen ? 'rotate-180' : ''}`}
              />
            </button>
            </div>

            {lessonListOpen && (
              <div className="border-t border-white/[0.1] bg-black/20 p-3">
                <div className="mb-2 flex items-center justify-between px-1">
                  <p className="text-xs font-semibold text-gray-200">
                    Jump to any lesson
                  </p>
                  <p className="text-xs text-gray-400">
                    {completedLessonIds.size}/{orderedLessons.length} completed
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {orderedLessons.map((courseLesson, index) => {
                    const isCurrent = courseLesson._id === lesson._id;
                    const isCompleted = completedLessonIds.has(courseLesson._id);
                    const isLocked = Boolean(
                      courseLesson.isLocked ||
                      courseLesson.status === 'locked' ||
                      (!enrollment && !courseLesson.isPreview)
                    );

                    return (
                      <button
                        key={courseLesson._id}
                        type="button"
                        disabled={isLocked}
                        onClick={() => {
                          if (!isCurrent) router.push(`/lessons/${courseLesson._id}`);
                        }}
                        className={`flex min-h-14 items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
                          isCurrent
                            ? 'border-violet-400/60 bg-violet-500/15'
                            : isCompleted
                            ? 'border-emerald-500/30 bg-emerald-500/[0.07] hover:bg-emerald-500/10'
                            : 'border-white/[0.1] bg-white/[0.03] hover:border-violet-400/40 hover:bg-white/[0.07]'
                        } disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                            isCompleted
                              ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-300'
                              : isCurrent
                              ? 'border-violet-400/60 bg-violet-500/20 text-violet-200'
                              : 'border-white/20 text-gray-300'
                          }`}
                        >
                          {isCompleted ? <CheckCircle size={14} /> : isLocked ? <Lock size={12} /> : index + 1}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-gray-100">
                            {courseLesson.title}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-gray-400">
                            {isCurrent
                              ? 'Currently studying'
                              : isCompleted
                              ? 'Completed'
                              : isLocked
                              ? 'Enroll to unlock'
                              : courseLesson.isPreview
                              ? 'Preview lesson'
                              : `Lesson ${index + 1}`}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>

          {/* Lesson attachments: zips, PDFs, sample code etc. */}
          {(lesson.attachments?.length || lesson.attachmentUrl) && (
            <Card className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Paperclip size={12} className="text-amber-400" />
                <span className="text-xs font-mono font-semibold uppercase tracking-wide text-gray-300">
                  Attachments
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(lesson.attachments ?? (lesson.attachmentUrl ? [lesson.attachmentUrl] : [])).map(
                  (url, idx) => {
                    const name = decodeURIComponent(url.split('/').pop() || `attachment-${idx + 1}`);
                    const resolved = url.startsWith('/uploads/')
                      ? `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL ?? 'http://localhost:5000'}${url}`
                      : url;
                    return (
                      <a
                        key={`${url}-${idx}`}
                        href={resolved}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/[0.06] bg-black/30 text-xs font-mono text-gray-300 hover:border-amber-500/30 hover:bg-amber-500/5 transition-colors"
                      >
                        <Download size={11} className="text-amber-400" />
                        <span className="truncate max-w-[16rem]">{name}</span>
                      </a>
                    );
                  }
                )}
              </div>
            </Card>
          )}

          <div className="flex gap-1 border-b border-white/[0.06] pb-0.5">
            {(['content', 'comments', 'notes', 'ide', 'exercise'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-xs font-mono rounded-t-lg transition-colors ${
                  activeTab === tab
                    ? 'text-violet-300 bg-violet-500/10 border border-b-0 border-violet-500/20'
                    : 'text-gray-300 hover:bg-white/[0.06] hover:text-white'
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
              <div className="prose prose-invert prose-sm max-w-none font-mono text-gray-200 leading-relaxed [&_p]:text-gray-200 [&_li]:text-gray-200 [&_pre]:bg-black/40 [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-white/[0.1] [&_pre]:p-4 [&_code]:text-violet-200 [&_a]:text-violet-300 [&_h1]:text-white [&_h2]:text-gray-100 [&_h3]:text-gray-100 [&_blockquote]:border-violet-500/40 [&_blockquote]:text-gray-300">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {lesson.contentMarkdown || lesson.content || ''}
                </ReactMarkdown>
              </div>
              {lesson.codeSnippets && lesson.codeSnippets.length > 0 && (
                <div className="mt-6 flex flex-col gap-4">
                  <h3 className="font-mono text-sm font-semibold text-gray-200 uppercase tracking-wide flex items-center gap-2">
                    <span className="w-1 h-4 bg-violet-500 rounded-full" />
                    Code samples
                  </h3>
                  {lesson.codeSnippets.map((snippet, idx) => (
                    <div key={idx} className="flex flex-col gap-1.5">
                      {(snippet.description || snippet.language) && (
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-gray-400">{snippet.description ?? `Snippet ${idx + 1}`}</span>
                          <Badge color="purple">{snippet.language}</Badge>
                        </div>
                      )}
                      <CodeEditor
                        value={snippet.code}
                        language={snippet.language}
                        readOnly
                        height={Math.max(120, Math.min(360, snippet.code.split('\n').length * 22 + 30))}
                      />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
          {activeTab === 'comments' && (
            <Card className="p-4">
              <CommentsSection lessonId={id!} />
            </Card>
          )}
          {activeTab === 'notes' && <NotesPanel lessonId={id!} />}
          {activeTab === 'exercise' && <ExercisePanel lessonId={id!} />}
          {activeTab === 'ide' && (
            <Card className="p-4">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <select
                    value={language}
                    onChange={(event) => setLanguage(event.target.value)}
                    className="input-field max-w-44 text-xs"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                    <option value="c">C</option>
                  </select>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => runCode()} loading={runningCode}>
                      <Play size={12} />
                      Run
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => requestAi()} loading={aiPending} disabled={!sourceCode.trim()}>
                      <Bot size={12} />
                      AI
                    </Button>
                  </div>
                </div>
                <CodeEditor
                  value={sourceCode}
                  onChange={setSourceCode}
                  language={language}
                  height={300}
                />
                <textarea
                  value={stdin}
                  onChange={(event) => setStdin(event.target.value)}
                  rows={3}
                  className="input-field resize-y text-xs font-mono bg-black/30"
                  placeholder="stdin (optional)"
                />
                <div className="rounded-lg border border-white/[0.06] bg-black/30 p-3 min-h-28">
                  <div className="flex flex-wrap gap-3 text-[11px] text-gray-300 font-mono mb-2">
                    <span>Status: {runResult?.status?.description ?? runResult?.status ?? 'Idle'}</span>
                    <span>Runtime: {runResult?.runtime ?? '-'}</span>
                    <span>Memory: {runResult?.memory ?? '-'}</span>
                  </div>
                  <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                    {runResult?.stdout || runResult?.stderr || runResult?.compileOutput || 'Run code to see output.'}
                  </pre>
                </div>
                {executionHistory && executionHistory.length > 0 && (
                  <div className="rounded-lg border border-white/[0.06] overflow-hidden">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-300 font-mono border-b border-white/[0.1]">
                      Execution history
                    </div>
                    <div className="max-h-44 overflow-auto divide-y divide-white/[0.04]">
                      {executionHistory.slice(0, 5).map((item) => (
                        <button
                          key={item._id}
                          onClick={() => setRunResult(item)}
                          className="w-full px-3 py-2 text-left hover:bg-white/[0.03] transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                            <span className="text-gray-400">{item.language}</span>
                            <span className="text-gray-300">{item.status}</span>
                          </div>
                          <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                            {new Date(item.createdAt).toLocaleString()}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Prev / Complete & next nav bar */}
          {(navigation.prev || navigation.next) && (
            <Card className="p-3 flex items-center justify-between gap-3">
              <button
                onClick={() => navigation.prev && router.push(`/lessons/${navigation.prev._id}`)}
                disabled={!navigation.prev}
                className="flex items-center gap-1.5 text-xs font-medium font-mono text-gray-300 hover:text-white disabled:opacity-45 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} />
                <span className="truncate max-w-[10rem]">
                  {navigation.prev?.title ?? 'No previous lesson'}
                </span>
              </button>
              <Button
                size="sm"
                onClick={() => {
                  completeLesson(undefined, {
                    onSuccess: () => {
                      if (navigation.next) router.push(`/lessons/${navigation.next._id}`);
                    },
                  });
                }}
                loading={completing}
              >
                <CheckCircle size={12} />
                {navigation.next ? 'Complete & continue' : 'Complete lesson'}
              </Button>
              <button
                onClick={() => navigation.next && router.push(`/lessons/${navigation.next._id}`)}
                disabled={!navigation.next}
                className="flex items-center gap-1.5 text-xs font-medium font-mono text-gray-300 hover:text-white disabled:opacity-45 disabled:cursor-not-allowed transition-colors"
              >
                <span className="truncate max-w-[10rem]">
                  {navigation.next?.title ?? 'No next lesson'}
                </span>
                <ChevronRight size={14} />
              </button>
            </Card>
          )}
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
