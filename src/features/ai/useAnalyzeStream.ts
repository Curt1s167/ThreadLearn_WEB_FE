'use client';

import { useCallback, useRef, useState } from 'react';
import type { PipelineStep } from './PipelineProgress';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

interface AnalyzeResultEvent {
  issues: unknown[];
  docs_used: unknown[];
  cached: boolean;
}

export interface AnalyzeResult {
  issues: import('../../types').AIIssue[];
  docsUsed: import('../../types').AIKnowledgeDoc[];
  cached: boolean;
  explanation: string;
  analyzeTimeMs: number;
  patternsChecked?: number;
}

export interface LlmIssueProgress {
  done: number;
  total: number;
  currentPattern: string | null;
}

function toCamelIssue(raw: Record<string, unknown>): import('../../types').AIIssue {
  return {
    patternId: (raw.pattern_id ?? raw.patternId ?? raw.pattern ?? 'unknown') as string,
    lineRange: (raw.line_range ?? raw.lineRange ?? 'all') as string,
    severity: (raw.severity ?? 'medium') as 'high' | 'medium' | 'low',
    description: (raw.description ?? '') as string,
    fix: (raw.fix ?? '') as string,
    codeSnippet: (raw.code_snippet ?? raw.codeSnippet) as string | undefined,
  };
}

function toCamelDoc(raw: Record<string, unknown>): import('../../types').AIKnowledgeDoc {
  return {
    id: (raw.id ?? '') as string,
    title: (raw.title ?? '') as string,
    category: raw.category as string | undefined,
    content: raw.content as string | undefined,
    score: (raw.bm25_score ?? raw.score) as number | undefined,
  };
}

function buildExplanation(issueCount: number, docCount: number): string {
  if (issueCount === 0) return 'No concurrency issues detected in this code.';
  return `AI2 detected ${issueCount} issue${issueCount > 1 ? 's' : ''} using RAG retrieval from ${docCount} knowledge-base document${docCount !== 1 ? 's' : ''}. Review each issue card for details and fixes.`;
}

export function useAnalyzeStream() {
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [llmProgress, setLlmProgress] = useState<LlmIssueProgress | null>(null);
  const [partialIssues, setPartialIssues] = useState<import('../../types').AIIssue[]>([]);
  const stepsRef = useRef<PipelineStep[]>([]);
  const startTimeRef = useRef<number>(0);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    stepsRef.current = [];
    setSteps([]);
    setStreamError(null);
    setResult(null);
    setLlmProgress(null);
    setPartialIssues([]);
  }, []);

  const run = useCallback(async (inputCode: string, language: string, codeExecutionId?: string): Promise<void> => {
    reset();
    setIsStreaming(true);
    startTimeRef.current = Date.now();

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const res = await fetch(`${BASE_URL}/ai/analyze/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ inputCode, language, codeExecutionId }),
        signal: controller.signal,
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
        if (abortRef.current !== controller) break;
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
          } else if (evtType === 'result') {
            const rawIssues = (evtData.issues as Record<string, unknown>[]) ?? [];
            const rawDocs = (evtData.docs_used as Record<string, unknown>[]) ?? [];
            const issues = rawIssues.map(toCamelIssue);
            const docsUsed = rawDocs.map(toCamelDoc);
            setResult({
              issues,
              docsUsed,
              cached: !!evtData.cached,
              explanation: buildExplanation(issues.length, docsUsed.length),
              analyzeTimeMs: Date.now() - startTimeRef.current,
              patternsChecked: evtData.patterns_checked as number | undefined,
            });
          } else if (evtType === 'llm_issue_progress') {
            setLlmProgress({
              done: (evtData.done as number) ?? 0,
              total: (evtData.total as number) ?? 0,
              currentPattern: (evtData.current_pattern as string | null) ?? null,
            });
          } else if (evtType === 'issue_ready') {
            const rawIssue = evtData.issue as Record<string, unknown>;
            const issue = toCamelIssue(rawIssue);
            setPartialIssues((prev) => {
              const idx = prev.findIndex(
                (p) => p.patternId === issue.patternId && p.lineRange === issue.lineRange
              );
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = issue;
                return next;
              }
              return [...prev, issue];
            });
          } else if (evtType === 'error') {
            setStreamError((evtData.message as string) ?? 'Unknown streaming error');
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (abortRef.current === controller) {
        setStreamError(err instanceof Error ? err.message : 'Failed to analyze code');
      }
    } finally {
      if (abortRef.current === controller) {
        setIsStreaming(false);
      }
    }
  }, [reset]);

  return { steps, isStreaming, streamError, result, llmProgress, partialIssues, run, reset };
}

export type { AnalyzeResultEvent };
