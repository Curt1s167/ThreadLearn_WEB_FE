'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, CheckCircle, ChevronRight, Clock, XCircle, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { quizService } from '../../services';
import { Badge, Button, Card, EmptyState, Skeleton } from '../../components/shared';

export const QuizPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [startTime] = useState(new Date().toISOString());
  const [result, setResult] = useState<{ score: number; passed: boolean; xpRewarded: number } | null>(null);

  const {
    data: quiz,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['quiz', lessonId],
    queryFn: () => quizService.getByLesson(lessonId!),
    enabled: !!lessonId,
  });

  const { mutate: submit, isPending } = useMutation({
    mutationFn: () => quizService.submit({
      quizId: quiz!._id,
      answers,
      startTime,
    }),
    onSuccess: (data) => {
      setResult({
        score: data.score,
        passed: data.passed,
        xpRewarded: data.xpRewarded,
      });
      queryClient.invalidateQueries({ queryKey: ['quiz-attempts-me'] });
      queryClient.invalidateQueries({ queryKey: ['gamification-stats'] });
    },
    onError: () => toast.error('Failed to submit quiz'),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 max-w-2xl mx-auto">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-36 rounded-xl" count={3} />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={<AlertCircle size={36} />}
        title="Could not load quiz"
        description="Please try again in a moment"
      />
    );
  }

  if (!quiz) {
    return (
      <EmptyState
        icon={<AlertCircle size={36} />}
        title="No quiz found"
        description="This lesson does not have a quiz yet"
        action={(
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft size={14} />
            Back
          </Button>
        )}
      />
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
            {result.passed ? 'Quiz passed!' : 'Attempt submitted'}
          </h2>
          <p className="text-gray-500 font-mono text-sm mt-1">
            Score: <span className={result.passed ? 'text-emerald-400' : 'text-rose-400'}>
              {result.score.toFixed(0)}%
            </span>
          </p>
        </div>
        {result.xpRewarded > 0 && (
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-violet-400" />
            <span className="text-sm font-mono text-violet-300">+{result.xpRewarded} XP earned</span>
          </div>
        )}
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft size={13} />
            Back to lesson
          </Button>
          <Button onClick={() => router.push('/quiz/history')}>
            View history
          </Button>
        </div>
      </div>
    );
  }

  const totalQuestions = quiz.questions.length;
  const allAnswered = totalQuestions > 0 && quiz.questions.every((q) => answers[q._id] !== undefined);
  const timeLimit = quiz.timeLimitSeconds ?? quiz.timeLimit;

  return (
    <div className="flex flex-col gap-5 animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="btn-ghost">
          <ArrowLeft size={14} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-mono font-bold text-xl text-gray-100 truncate">{quiz.title}</h1>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-600 font-mono">
            {timeLimit ? <span className="flex items-center gap-1"><Clock size={11} />{Math.floor(timeLimit / 60)} min</span> : null}
            <span className="flex items-center gap-1"><Zap size={11} />{quiz.xpReward ?? 0} XP</span>
            <span>{totalQuestions} questions</span>
          </div>
        </div>
        <Badge color="purple">{Object.keys(answers).length}/{totalQuestions}</Badge>
      </div>

      <div className="flex flex-col gap-4">
        {quiz.questions.map((question, questionIndex) => (
          <Card key={question._id} className="p-4">
            <p className="text-sm font-mono text-gray-200 mb-3">
              <span className="text-gray-600 mr-2">{questionIndex + 1}.</span>
              {question.questionText}
            </p>
            <div className="flex flex-col gap-2">
              {question.options.map((option, optionIndex) => (
                <button
                  key={optionIndex}
                  onClick={() => setAnswers((prev) => ({ ...prev, [question._id]: optionIndex }))}
                  className={`text-left p-3 rounded-lg border text-sm font-mono transition-all ${
                    answers[question._id] === optionIndex
                      ? 'bg-violet-500/10 border-violet-500/40 text-violet-300'
                      : 'border-white/[0.06] text-gray-400 hover:border-white/20 hover:text-gray-200 hover:bg-white/[0.03]'
                  }`}
                >
                  <span className="text-gray-600 mr-2">{String.fromCharCode(65 + optionIndex)}.</span>
                  {option}
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
