import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  CheckCircle, XCircle, Clock, Zap, ChevronRight, ArrowLeft, Code2,
} from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { quizService, lessonsService } from '../../services';
import { useExercise } from '../../hooks/useCodeExecution';
import { useNotes } from '../../hooks/useNotes';
import { Card, Button, Badge } from '../../components/shared';
import { CommentPanel } from '../comment/CommentPanel';
import { NotePanel } from '../note/NotePanel';
import { WebIDE } from '../ide/WebIDE';
import { VerdictPanel } from '../ide/VerdictPanel';
import { BookmarkButton } from '../bookmark/BookmarkButton';
import type { RunCodeResult, NoteV2 } from '../../types';

function applyNoteHighlights(notes: NoteV2[]) {
  const body = document.getElementById('lesson-body');
  if (!body) return;

  // Strip previous highlight wrappers so re-runs don't compound-wrap nor
  // skip nodes whose offsets shifted after the first pass.
  body.querySelectorAll('mark[data-note-highlight]').forEach((el) => {
    const parent = el.parentNode;
    if (!parent) return;
    while (el.firstChild) parent.insertBefore(el.firstChild, el);
    parent.removeChild(el);
    parent.normalize();
  });

  notes.forEach((note) => {
    if (!note.anchorText || note.anchorText.length < 2) return;
    const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const idx = (node.textContent ?? '').indexOf(note.anchorText);
      if (idx < 0) continue;
      try {
        const range = document.createRange();
        range.setStart(node, idx);
        range.setEnd(node, idx + note.anchorText.length);
        const mark = document.createElement('mark');
        mark.setAttribute('data-note-highlight', note._id);
        mark.className = 'bg-amber-400/20 text-amber-200 rounded px-0.5 cursor-help';
        mark.title = note.noteContent.slice(0, 120);
        range.surroundContents(mark);
        break; // only highlight first occurrence of this anchorText
      } catch {
        // Range crosses element boundaries — skip this match
      }
    }
  });
}

export const QuizPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [startedAt] = useState(new Date().toISOString());
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);

  const { data: quiz, isLoading } = useQuery({
    queryKey: ['quiz', lessonId],
    queryFn: () => quizService.getByLesson(lessonId!),
    enabled: !!lessonId,
  });

  const { mutate: submit, isPending } = useMutation({
    mutationFn: () => quizService.submit({
      quizId: quiz!._id,
      answers: Object.entries(answers).map(([questionId, selectedOption]) => ({ questionId, selectedOption })),
      startedAt,
    }),
    onSuccess: (data) => setResult({ score: data!.score, passed: data!.passed }),
    onError: () => toast.error('Failed to submit quiz'),
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="text-gray-600 font-mono text-sm animate-pulse">Loading quiz...</div></div>;
  if (!quiz) return <Card className="p-8 text-center max-w-md mx-auto"><p className="text-gray-400 font-mono">No quiz found</p><Button variant="ghost" onClick={() => navigate(-1 as any)} className="mt-4 mx-auto"><ArrowLeft size={14}/> Go back</Button></Card>;

  if (result) return (
    <div className="flex flex-col items-center gap-5 max-w-md mx-auto animate-slide-in">
      <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${result.passed ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-rose-500/10 border border-rose-500/20'}`}>
        {result.passed ? <CheckCircle size={36} className="text-emerald-400"/> : <XCircle size={36} className="text-rose-400"/>}
      </div>
      <div className="text-center">
        <h2 className="font-mono font-bold text-2xl text-gray-100">{result.passed ? 'Quiz passed!' : 'Better luck next time'}</h2>
        <p className="text-gray-500 font-mono text-sm mt-1">Score: <span className={result.passed ? 'text-emerald-400' : 'text-rose-400'}>{result.score.toFixed(0)}%</span></p>
      </div>
      {result.passed && <div className="flex items-center gap-2"><Zap size={14} className="text-violet-400"/><span className="text-sm font-mono text-violet-300">+{quiz.xpReward} XP earned!</span></div>}
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => navigate(-1 as any)}><ArrowLeft size={13}/> Back</Button>
        <Button onClick={() => { setResult(null); setAnswers({}); }}>Retry</Button>
      </div>
    </div>
  );

  const allAnswered = quiz.questions.every((q: any) => answers[q._id] !== undefined);
  return (
    <div className="flex flex-col gap-5 animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1 as any)} className="btn-ghost"><ArrowLeft size={14}/></button>
        <div className="flex-1">
          <h1 className="font-mono font-bold text-xl text-gray-100">{quiz.title}</h1>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-600 font-mono">
            <span className="flex items-center gap-1"><Clock size={11}/>{Math.floor(quiz.timeLimit/60)} min</span>
            <span className="flex items-center gap-1"><Zap size={11}/>{quiz.xpReward} XP</span>
            <span>{quiz.questions.length} questions</span>
          </div>
        </div>
        <Badge color="purple">{Object.keys(answers).length}/{quiz.questions.length}</Badge>
      </div>
      <div className="flex flex-col gap-4">
        {quiz.questions.map((q: any, qi: number) => (
          <Card key={q._id} className="p-4">
            <p className="text-sm font-mono text-gray-200 mb-3"><span className="text-gray-600 mr-2">{qi+1}.</span>{q.questionText}</p>
            <div className="flex flex-col gap-2">
              {q.options.map((opt: any, oi: number) => (
                <button key={oi} onClick={() => setAnswers((p) => ({ ...p, [q._id]: oi }))}
                  className={`text-left p-3 rounded-lg border text-sm font-mono transition-all ${answers[q._id]===oi ? 'bg-violet-500/10 border-violet-500/40 text-violet-300' : 'border-white/[0.06] text-gray-400 hover:border-white/20 hover:text-gray-200 hover:bg-white/[0.03]'}`}>
                  <span className="text-gray-600 mr-2">{String.fromCharCode(65+oi)}.</span>{opt.text}
                </button>
              ))}
            </div>
          </Card>
        ))}
      </div>
      <div className="flex justify-end pb-6">
        <Button onClick={() => submit()} disabled={!allAnswered} loading={isPending} size="lg">Submit answers <ChevronRight size={14}/></Button>
      </div>
    </div>
  );
};

export const LessonPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'content' | 'exercise'>('content');
  const [runResult, setRunResult] = useState<RunCodeResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentCode, setCurrentCode] = useState('');

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['lesson', id],
    queryFn: () => lessonsService.getById(id!),
    enabled: !!id,
  });

  const { data: exerciseResp } = useExercise(id!);
  const exercise = exerciseResp?.data;

  const { data: notesResp } = useNotes(id!);
  const notes = (notesResp?.data ?? []) as NoteV2[];

  useEffect(() => {
    if (!notes.length || !lesson?.content) return;
    const t = setTimeout(() => applyNoteHighlights(notes), 250);
    return () => clearTimeout(t);
  }, [notes, lesson?.content]);

  const tabs = [
    { key: 'content' as const, label: 'Nội dung' },
    ...(exercise ? [{ key: 'exercise' as const, label: 'Bài tập', icon: <Code2 size={11}/> }] : []),
  ];

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => navigate(-1 as any)} className="btn-ghost shrink-0"><ArrowLeft size={14}/></button>
          {isLoading ? <div className="h-5 w-48 skeleton rounded"/> : <h1 className="font-mono font-bold text-xl text-gray-100 truncate">{lesson?.title}</h1>}
        </div>
        {lesson && (
          <div className="flex items-center gap-2 shrink-0">
            <BookmarkButton
              targetType="LESSON"
              targetId={id!}
              title={lesson.title}
            />
            <button onClick={() => navigate(`/quiz/${id}`)} className="btn-outline text-sm"><Zap size={13}/> Take quiz</button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <div className="h-4 skeleton rounded w-3/4"/><div className="h-4 skeleton rounded"/><div className="h-4 skeleton rounded w-5/6"/>
        </div>
      ) : lesson ? (
        <>
          <Card className="px-4 py-2.5 flex items-center gap-4 flex-wrap">
            {lesson.duration > 0 && <span className="flex items-center gap-1 text-xs text-gray-600 font-mono"><Clock size={11}/>{lesson.duration} min</span>}
            {lesson.videoUrl && <Badge color="purple">Video</Badge>}
            {exercise && <Badge color="amber"><Code2 size={10}/> {exercise.language}</Badge>}
          </Card>

          <div className="flex gap-1 border-b border-white/[0.06] pb-0.5">
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 text-xs font-mono rounded-t-lg transition-colors flex items-center gap-1.5 ${activeTab===tab.key ? 'text-violet-300 bg-violet-500/10 border border-b-0 border-violet-500/20' : 'text-gray-600 hover:text-gray-400'}`}>
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'content' && (
            <div className="flex gap-4">
              <div className="flex-1 min-w-0 flex flex-col gap-4">
                <Card className="p-6">
                  {lesson.videoUrl && (
                    <div className="mb-5 rounded-xl overflow-hidden border border-white/[0.05] bg-black aspect-video">
                      <iframe src={lesson.videoUrl} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen/>
                    </div>
                  )}
                  <div id="lesson-body" className="prose prose-invert prose-sm max-w-none font-mono text-gray-300 leading-relaxed [&_pre]:bg-black/40 [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-white/[0.06] [&_pre]:p-4 [&_code]:text-violet-300 [&_a]:text-violet-400 [&_h1]:text-gray-100 [&_h2]:text-gray-200 [&_h3]:text-gray-200">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{lesson.content}</ReactMarkdown>
                  </div>
                </Card>
                <Card className="p-4"><CommentPanel targetType="LESSON" targetId={id!}/></Card>
              </div>
              <div className="w-72 shrink-0 hidden lg:block"><NotePanel lessonId={id!}/></div>
            </div>
          )}

          {activeTab === 'exercise' && exercise && (
            <div className="flex gap-4 min-h-[600px]">
              <div className="flex-[3] min-w-0">
                <WebIDE exercise={exercise} onCodeChange={setCurrentCode} onRunResult={(r, running) => { setRunResult(r); setIsRunning(running); }}/>
              </div>
              <div className="flex-[2] min-w-0">
                <VerdictPanel result={runResult} isLoading={isRunning} code={currentCode} language={exercise.language}/>
              </div>
            </div>
          )}
        </>
      ) : (
        <Card className="p-8 text-center"><p className="text-gray-500 font-mono">Lesson not found</p></Card>
      )}
    </div>
  );
};

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-center">
        <p className="font-mono font-bold text-[96px] text-white/5 leading-none">404</p>
        <h1 className="font-mono font-bold text-2xl text-gray-300 -mt-4">Page not found</h1>
        <p className="text-gray-600 font-mono text-sm mt-2">The page you are looking for does not exist.</p>
        <button onClick={() => navigate('/')} className="btn-primary mt-6 mx-auto">Go home</button>
      </div>
    </div>
  );
};
