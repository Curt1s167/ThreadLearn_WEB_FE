'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Play, Terminal } from 'lucide-react';
import { toast } from 'sonner';
import { codeExecutionService } from '../../services';
import type { CodeExecutionResult } from '../../types';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });
const DRAFT_KEY = 'threadlearn:ide:draft:v1';

const STARTER_CODE: Record<'javascript' | 'python', string> = {
  javascript: "console.log('Hello, ThreadLearn!');\n",
  python: "print('Hello, ThreadLearn!')\n",
};

export function IDEPage() {
  const [language, setLanguage] = useState<'javascript' | 'python'>('javascript');
  const [sourceCode, setSourceCode] = useState(STARTER_CODE.javascript);
  const [stdin, setStdin] = useState('');
  const [result, setResult] = useState<CodeExecutionResult | null>(null);
  const [historyPage, setHistoryPage] = useState(1);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(DRAFT_KEY);
      if (!saved) return;
      const draft = JSON.parse(saved) as Partial<{ language: 'javascript' | 'python'; sourceCode: string; stdin: string }>;
      if (draft.language === 'javascript' || draft.language === 'python') setLanguage(draft.language);
      if (typeof draft.sourceCode === 'string') setSourceCode(draft.sourceCode);
      if (typeof draft.stdin === 'string') setStdin(draft.stdin);
    } catch {
      // A bad draft must never prevent a learner from opening the IDE.
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ language, sourceCode, stdin }));
    }, 700);
    return () => window.clearTimeout(timer);
  }, [language, sourceCode, stdin]);

  const { mutate: runCode, isPending } = useMutation({
    mutationFn: () => codeExecutionService.run({ sourceCode, language, stdin }),
    onSuccess: (execution) => {
      setResult(execution);
      toast.success('Code execution finished');
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'Code execution failed');
    },
  });

  const { data: history } = useQuery({
    queryKey: ['code-execution-history', historyPage],
    queryFn: () => codeExecutionService.history(historyPage),
  });

  const output = useMemo(() => {
    if (!result) return 'Run your code to see stdout, stderr, runtime and memory.';
    return [
      `Status: ${result.status.description}`,
      `Runtime: ${result.runtime}s`,
      `Memory: ${result.memory} KB`,
      result.stdout ? `\nstdout\n${result.stdout}` : '',
      result.stderr ? `\nstderr\n${result.stderr}` : '',
      result.compileOutput ? `\ncompiler output\n${result.compileOutput}` : '',
    ].filter(Boolean).join('\n');
  }, [result]);

  const changeLanguage = (nextLanguage: 'javascript' | 'python') => {
    setLanguage(nextLanguage);
    setResult(null);
    if (sourceCode === STARTER_CODE[language]) setSourceCode(STARTER_CODE[nextLanguage]);
  };

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-6">
      <header className="rounded-xl bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-widest text-black/45">ThreadLearn IDE</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Write, run and inspect your code.</h1>
        <p className="mt-2 text-sm text-black/60">Drafts are saved locally. Execution runs through the protected code-execution API.</p>
      </header>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="overflow-hidden rounded-xl border border-black/10 bg-[#111827]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <select
              aria-label="Programming language"
              value={language}
              onChange={(event) => changeLanguage(event.target.value as 'javascript' | 'python')}
              className="rounded-md bg-white/10 px-3 py-2 text-sm text-white outline-none"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
            </select>
            <button
              type="button"
              onClick={() => runCode()}
              disabled={isPending || !sourceCode.trim()}
              className="inline-flex items-center gap-2 rounded-md bg-[#d9f99d] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
            >
              <Play size={15} /> {isPending ? 'Running…' : 'Run code'}
            </button>
          </div>
          <MonacoEditor
            height="560px"
            theme="vs-dark"
            language={language === 'javascript' ? 'javascript' : 'python'}
            value={sourceCode}
            onChange={(value) => { setSourceCode(value ?? ''); setResult(null); }}
            options={{ minimap: { enabled: false }, fontSize: 14, automaticLayout: true }}
          />
        </div>

        <aside className="space-y-5">
          <div className="rounded-xl border border-black/10 bg-white p-4">
            <label htmlFor="ide-stdin" className="text-sm font-semibold text-ink">Standard input</label>
            <textarea id="ide-stdin" value={stdin} onChange={(event) => setStdin(event.target.value)} rows={7} className="mt-2 w-full rounded-md border border-black/10 p-3 font-mono text-sm" placeholder="Optional stdin" />
          </div>
          <div className="rounded-xl border border-black/10 bg-white p-4">
            <p className="text-sm font-semibold text-ink">Recent executions</p>
            <div className="mt-3 space-y-2">
              {history?.items.map((item) => (
                <button key={item._id} type="button" onClick={() => { if (item.sourceCode) setSourceCode(item.sourceCode); }} className="w-full rounded-md border border-black/10 p-2 text-left text-xs hover:bg-black/[0.03]">
                  <span className="font-medium">{item.status.description}</span> · {item.runtime}s · {item.memory} KB
                </button>
              ))}
              {history?.items.length === 0 ? <p className="text-xs text-black/45">No execution history yet.</p> : null}
              {history?.meta.totalPages && history.meta.totalPages > 1 ? (
                <div className="flex justify-between pt-2 text-xs">
                  <button type="button" disabled={historyPage === 1} onClick={() => setHistoryPage((page) => page - 1)}>Previous</button>
                  <button type="button" disabled={!history.meta.hasMore} onClick={() => setHistoryPage((page) => page + 1)}>Next</button>
                </div>
              ) : null}
            </div>
          </div>
          <div className="rounded-xl border border-black/10 bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink"><Terminal size={16} /> Execution output</div>
            <pre className="mt-3 min-h-56 whitespace-pre-wrap rounded-md bg-black p-3 font-mono text-xs leading-5 text-[#d9f99d]">{output}</pre>
          </div>
        </aside>
      </section>
    </main>
  );
}
