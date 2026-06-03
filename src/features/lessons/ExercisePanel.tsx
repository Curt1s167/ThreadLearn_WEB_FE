'use client';

import React, { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Play, CheckCircle2, XCircle, Lock, Trophy, Code2 } from 'lucide-react';
import { toast } from 'sonner';
import { exercisesService } from '../../services';
import { Card, Button, Skeleton, Badge, CodeEditor } from '../../components/shared';

interface Props {
  lessonId: string;
}

type Verdict = 'PASS' | 'PARTIAL' | 'FAIL' | 'ERROR';

interface TestResult {
  index: number;
  passed: boolean;
  isHidden: boolean;
  input?: string;
  expectedOutput?: string;
  actualOutput?: string;
  points: number;
  runtime?: string;
  stderr?: string;
}

interface GradingResult {
  exerciseId: string;
  verdict: Verdict;
  passedCases: number;
  totalCases: number;
  earnedPoints: number;
  totalPoints: number;
  score: number;
  testResults: TestResult[];
}

const verdictTone: Record<Verdict, { color: string; label: string; icon: React.ReactNode }> = {
  PASS:    { color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', label: 'PASS',    icon: <Trophy size={12} /> },
  PARTIAL: { color: 'bg-amber-500/15 text-amber-300 border-amber-500/30',     label: 'PARTIAL', icon: <CheckCircle2 size={12} /> },
  FAIL:    { color: 'bg-rose-500/15 text-rose-300 border-rose-500/30',        label: 'FAIL',    icon: <XCircle size={12} /> },
  ERROR:   { color: 'bg-rose-500/20 text-rose-300 border-rose-500/40',        label: 'ERROR',   icon: <XCircle size={12} /> },
};

export const ExercisePanel: React.FC<Props> = ({ lessonId }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [code, setCode] = useState<string>('');
  const [grading, setGrading] = useState<GradingResult | null>(null);

  const { data: exercises, isLoading } = useQuery({
    queryKey: ['exercises', lessonId],
    queryFn: () => exercisesService.listByLesson(lessonId),
    enabled: !!lessonId,
  });

  const selected =
    selectedId
      ? exercises?.find((e: any) => e._id === selectedId)
      : exercises?.[0] ?? null;

  useEffect(() => {
    if (selected && !selectedId) {
      setSelectedId(selected._id);
    }
  }, [selected, selectedId]);

  useEffect(() => {
    if (selected) {
      setCode(selected.starterCode || '');
      setGrading(null);
    }
  }, [selected?._id]);

  const submitMutation = useMutation({
    mutationFn: () => exercisesService.submit(selected!._id, code),
    onSuccess: (result) => {
      setGrading(result);
      const tone = verdictTone[result.verdict];
      toast.success(
        `${tone.label} — ${result.passedCases}/${result.totalCases} cases (${result.score}%)`
      );
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Submission failed.');
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!exercises || exercises.length === 0) {
    return (
      <Card className="p-6 text-center text-xs font-mono text-gray-600 flex flex-col items-center gap-2">
        <Code2 size={20} className="text-gray-700" />
        <span>Lesson này chưa có exercise nào.</span>
        <span className="text-[11px] text-gray-700">Quay lại tab IDE để thử nghiệm code tự do.</span>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {exercises.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {exercises.map((ex: any) => (
            <button
              key={ex._id}
              onClick={() => setSelectedId(ex._id)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors ${
                selected?._id === ex._id
                  ? 'bg-violet-500/15 border-violet-500/30 text-violet-200'
                  : 'border-white/[0.06] text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]'
              }`}
            >
              {ex.title}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <Card className="p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-mono font-semibold text-gray-100 mb-1">
                {selected.title}
              </h3>
              {selected.description && (
                <p className="text-xs text-gray-500 font-mono leading-relaxed">
                  {selected.description}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <Badge color="purple">{selected.language}</Badge>
              <span className="text-[10px] text-gray-600 font-mono">
                {selected.testCases?.length ?? 0} cases · {selected.totalPoints ?? 0} pts
              </span>
            </div>
          </div>

          <CodeEditor
            value={code}
            onChange={setCode}
            language={selected.language}
            height={320}
          />

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[11px] text-gray-600 font-mono">
              {grading
                ? `Last verdict: ${grading.verdict} (${grading.score}%)`
                : 'Submit để chấm theo từng test case.'}
            </span>
            <Button
              size="sm"
              onClick={() => submitMutation.mutate()}
              loading={submitMutation.isPending}
              disabled={!code.trim()}
            >
              <Play size={12} />
              Submit
            </Button>
          </div>

          {grading && (
            <div className="flex flex-col gap-2">
              <div className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-xs font-mono ${verdictTone[grading.verdict].color}`}>
                <span className="flex items-center gap-1.5">
                  {verdictTone[grading.verdict].icon}
                  {verdictTone[grading.verdict].label}
                </span>
                <span>
                  {grading.passedCases}/{grading.totalCases} cases · {grading.earnedPoints}/{grading.totalPoints} pts · {grading.score}%
                </span>
              </div>
              <div className="rounded-lg border border-white/[0.06] divide-y divide-white/[0.04] max-h-72 overflow-auto">
                {grading.testResults.map((tr) => (
                  <div key={tr.index} className="px-3 py-2 text-[11px] font-mono">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="flex items-center gap-1.5">
                        {tr.passed ? (
                          <CheckCircle2 size={11} className="text-emerald-400" />
                        ) : (
                          <XCircle size={11} className="text-rose-400" />
                        )}
                        <span className={tr.passed ? 'text-emerald-300' : 'text-rose-300'}>
                          Case #{tr.index + 1}
                        </span>
                        {tr.isHidden && (
                          <span className="flex items-center gap-1 text-gray-600">
                            <Lock size={9} /> hidden
                          </span>
                        )}
                      </span>
                      <span className="text-gray-600">
                        {tr.points} pts {tr.runtime ? ` · ${tr.runtime}s` : ''}
                      </span>
                    </div>
                    {!tr.isHidden && tr.input !== undefined && (
                      <div className="grid grid-cols-3 gap-2 text-[10px] mt-1">
                        <div>
                          <div className="text-gray-700 mb-0.5">input</div>
                          <pre className="bg-black/30 rounded px-1.5 py-1 whitespace-pre-wrap text-gray-400 max-h-16 overflow-auto">{tr.input || '(empty)'}</pre>
                        </div>
                        <div>
                          <div className="text-gray-700 mb-0.5">expected</div>
                          <pre className="bg-black/30 rounded px-1.5 py-1 whitespace-pre-wrap text-gray-400 max-h-16 overflow-auto">{tr.expectedOutput || '(empty)'}</pre>
                        </div>
                        <div>
                          <div className="text-gray-700 mb-0.5">actual</div>
                          <pre className={`rounded px-1.5 py-1 whitespace-pre-wrap max-h-16 overflow-auto ${tr.passed ? 'bg-emerald-500/5 text-emerald-300' : 'bg-rose-500/5 text-rose-300'}`}>
                            {tr.actualOutput ?? '(no output)'}
                          </pre>
                        </div>
                      </div>
                    )}
                    {tr.stderr && (
                      <pre className="mt-1 bg-rose-500/5 text-rose-300 text-[10px] rounded px-1.5 py-1 whitespace-pre-wrap">
                        {tr.stderr}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default ExercisePanel;
