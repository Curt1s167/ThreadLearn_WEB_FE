'use client';

import { useCallback, useState } from 'react';
import { codeExecutionService } from '../../services';

export interface RunLogEntry {
  level: 'log' | 'warn' | 'error' | 'result';
  text: string;
}

/** Runs AI-page code through the same protected Judge0 API as the lesson IDE. */
export function useRunCode() {
  const [logs, setLogs] = useState<RunLogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);
  const [executionId, setExecutionId] = useState<string | undefined>();

  const run = useCallback(async (code: string) => {
    setLogs([]);
    setRunError(null);
    setIsRunning(true);
    setHasRun(true);
    try {
      const result = await codeExecutionService.run({ sourceCode: code, language: 'javascript' });
      setExecutionId(result._id);
      const next: RunLogEntry[] = [
        { level: result.status.id === 3 ? 'result' : 'error', text: `Status: ${result.status.description}` },
        { level: 'result', text: `Runtime: ${result.runtime}s | Memory: ${result.memory} KB` },
      ];
      if (result.stdout) next.push({ level: 'log', text: result.stdout });
      if (result.stderr) next.push({ level: 'error', text: result.stderr });
      if (result.compileOutput) next.push({ level: 'error', text: result.compileOutput });
      setLogs(next);
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setExecutionId(undefined);
      setRunError(message || 'Code execution failed.');
    } finally {
      setIsRunning(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLogs([]);
    setRunError(null);
    setIsRunning(false);
    setHasRun(false);
    setExecutionId(undefined);
  }, []);

  return { logs, isRunning, runError, hasRun, executionId, run, reset };
}
