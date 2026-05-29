'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { Play, RotateCcw, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store';
import { useRunCode } from '../../hooks/useCodeExecution';
import type { Exercise, RunCodeResult } from '../../types';

interface Props {
  exercise: Exercise;
  onCodeChange: (code: string) => void;
  onRunResult: (result: RunCodeResult | null, isRunning: boolean) => void;
}

export const WebIDE: React.FC<Props> = ({ exercise, onCodeChange, onRunResult }) => {
  const { user } = useAuthStore();
  const storageKey = `code_${exercise._id}_${user?._id ?? 'guest'}`;

  const getInitialCode = () => {
    if (typeof window === 'undefined') return exercise.starterCode;
    return localStorage.getItem(storageKey) ?? exercise.starterCode;
  };

  const [code, setCode] = useState<string>(getInitialCode);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { mutate: runCode, isPending } = useRunCode();

  useEffect(() => {
    onCodeChange(code);
  }, [code, onCodeChange]);

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      const v = value ?? '';
      setCode(v);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (typeof window !== 'undefined') {
          localStorage.setItem(storageKey, v);
        }
      }, 500);
    },
    [storageKey]
  );

  const handleReset = () => {
    setCode(exercise.starterCode);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey);
    }
  };

  const handleRun = () => {
    onRunResult(null, true);
    runCode(
      { exerciseId: exercise._id, code, language: exercise.language },
      {
        onSuccess: (resp) => {
          onRunResult(resp.data, false);
        },
        onError: () => {
          onRunResult(null, false);
        },
      }
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0d12] border border-white/[0.06] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-[#111118]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-400 font-medium">{exercise.title}</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">
            {exercise.language}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="p-1.5 text-gray-600 hover:text-gray-300 hover:bg-white/5 rounded-lg transition-colors"
            title="Reset code"
          >
            <RotateCcw size={13} />
          </button>
          <button
            onClick={handleRun}
            disabled={isPending || !code.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
            {isPending ? 'Running...' : 'Run'}
          </button>
        </div>
      </div>

      {/* Description */}
      {exercise.description && (
        <div className="px-4 py-2 border-b border-white/[0.04] bg-[#0a0a0f]">
          <p className="text-xs text-gray-500 font-mono leading-relaxed">{exercise.description}</p>
        </div>
      )}

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="400px"
          language={exercise.language}
          value={code}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            tabSize: 2,
            automaticLayout: true,
            padding: { top: 12 },
          }}
        />
      </div>
    </div>
  );
};
