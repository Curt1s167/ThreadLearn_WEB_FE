'use client';

import { useCallback, useRef, useState } from 'react';
import type { PipelineStep } from './PipelineProgress';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

interface AnalyzeResultEvent {
  issues: unknown[];
  docs_used: unknown[];
  cached: boolean;
}

export function useAnalyzeStream() {
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const stepsRef = useRef<PipelineStep[]>([]);

  const reset = useCallback(() => {
    stepsRef.current = [];
    setSteps([]);
    setStreamError(null);
  }, []);

  const run = useCallback(async (inputCode: string, language: string): Promise<void> => {
    reset();
    setIsStreaming(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const res = await fetch(`${BASE_URL}/ai/analyze/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ inputCode, language }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? `Analyze stream failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';

        for (const part of parts) {
          const eventMatch = part.match(/^event:\s*(.+)$/m);
          const dataMatch = part.match(/^data:\s*(.+)$/m);
          if (!eventMatch || !dataMatch) continue;

          const evtType = eventMatch[1].trim();
          let evtData: Record<string, unknown>;
          try {
            evtData = JSON.parse(dataMatch[1]);
          } catch {
            continue;
          }

          if (evtType === 'step') {
            const stage = evtData.stage as string;
            const nextStep = { ...evtData, stage } as PipelineStep;
            const existingIdx = stepsRef.current.findIndex((s) => s.stage === stage);
            const now = Date.now();
            if (existingIdx >= 0) {
              const prev = stepsRef.current[existingIdx];
              stepsRef.current[existingIdx] = {
                ...prev,
                ...nextStep,
                _startTime: prev._startTime,
                _endTime: nextStep.status === 'done' ? now : prev._endTime,
              };
            } else {
              stepsRef.current = [...stepsRef.current, { ...nextStep, _startTime: now }];
            }
            setSteps([...stepsRef.current]);
          } else if (evtType === 'error') {
            setStreamError((evtData.message as string) ?? 'Unknown streaming error');
          }
          // "result" event is persisted server-side; FE just refetches history after "done".
        }
      }
    } catch (err) {
      setStreamError(err instanceof Error ? err.message : 'Failed to analyze code');
    } finally {
      setIsStreaming(false);
    }
  }, [reset]);

  return { steps, isStreaming, streamError, run, reset };
}

export type { AnalyzeResultEvent };
