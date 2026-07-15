'use client';

import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Code2, Clock, Sparkles, Brain, Play } from 'lucide-react';
import { toast } from 'sonner';
import { aiService } from '../../services';
import { Button, Skeleton } from '../../components/shared';
import {
  DemoDisplayTitle,
  DemoPageRoot,
  DemoPill,
  DemoWhitePanel,
} from '../ui-reskin/demo-ui';
import { DEMO_AI_RESPONSE, DEMO_CODE_SAMPLE } from '../ui-reskin/demo-fallbacks';

const LANGUAGES = ['javascript', 'typescript', 'python', 'java', 'go'];

export const AIPage: React.FC = () => {
  const [code, setCode] = useState(DEMO_CODE_SAMPLE);
  const [language, setLanguage] = useState('javascript');
  const queryClient = useQueryClient();

  const {
    data: history,
    isLoading: historyLoading,
    isError: historyError,
  } = useQuery({
    queryKey: ['ai-history'],
    queryFn: aiService.getHistory,
  });

  useEffect(() => {
    if (historyError) toast.error('Failed to load AI history');
  }, [historyError]);

  const { mutate: analyze, isPending } = useMutation({
    mutationFn: () => aiService.analyzeCode(code, language),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-history'] });
      setCode('');
      toast.success('Code analyzed!');
    },
    onError: () => toast.error('Failed to analyze code'),
  });

  const latestLog = history?.[0];
  const showMockHistory = !historyLoading && (!history || history.length === 0);

  return (
    <DemoPageRoot>
      <section className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="rounded-lg bg-white p-6 sm:p-8">
          <DemoPill tone="pink">AI Coach</DemoPill>
          <DemoDisplayTitle>Analyze concurrency bugs before they ship.</DemoDisplayTitle>
          <p className="mt-4 max-w-2xl text-black/60">
            Send real code to the AI recommendation service, then keep the review history visible for follow-up fixes.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-[180px_1fr] sm:items-end">
            <label className="block">
              <span className="text-xs uppercase tracking-[0.18em] text-black/45">Language</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="mt-2 w-full rounded-lg border border-black/10 bg-[#f7f4ee] px-3 py-3 text-sm capitalize outline-none transition focus:border-black/30"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </label>

            <Button
              onClick={() => analyze()}
              disabled={!code.trim()}
              loading={isPending}
              size="lg"
              className="h-11 w-full sm:w-fit"
            >
              <Send size={15} />
              Analyze code
            </Button>
          </div>

          <div className="mt-5 overflow-hidden rounded-lg border border-black/10 bg-[#111827] text-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <Code2 size={16} className="text-[#d9f99d]" />
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/35">ThreadLearn analyzer</p>
                  <p className="text-sm font-semibold">{language}.snippet</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#d9f99d] px-3 py-1.5 text-xs font-medium text-black">
                <Play size={13} />
                Live API
              </span>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              className="min-h-[420px] w-full resize-y bg-[#111827] p-5 font-mono text-sm leading-6 text-[#d9f99d] outline-none placeholder:text-white/35"
              placeholder="Paste your code here..."
            />
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg bg-[#d9f99d] p-6">
            <Brain size={24} />
            <h2 className="mt-5 text-2xl font-semibold">Review focus</h2>
            <div className="mt-5 space-y-4 text-sm text-black/70">
              <p><strong>Service:</strong> POST /ai/recommendation</p>
              <p><strong>Goal:</strong> identify race conditions, unsafe async flows, and optimization hints.</p>
              <p><strong>History:</strong> persisted by the backend and reloaded through /ai/history.</p>
            </div>
          </div>

          <DemoWhitePanel className="p-5">
            <div className="flex items-center gap-2">
              <Sparkles size={18} />
              <h2 className="font-semibold">Latest result</h2>
            </div>
            {historyLoading ? (
              <Skeleton className="mt-4 h-28 rounded-lg" />
            ) : latestLog ? (
              <div className="mt-4 rounded-lg bg-[#f7f4ee] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-black/45">
                  {(latestLog.language ?? 'code').toUpperCase()} analysis
                </p>
                <p className="mt-3 line-clamp-6 whitespace-pre-wrap text-sm leading-6 text-black/65">
                  {latestLog.response}
                </p>
              </div>
            ) : (
              <div className="mt-4 rounded-lg bg-[#f7f4ee] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-black/45">
                  Mock AI review
                </p>
                <p className="mt-3 text-sm leading-6 text-black/65">{DEMO_AI_RESPONSE}</p>
              </div>
            )}
          </DemoWhitePanel>
        </aside>
      </section>

      <DemoWhitePanel>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-black/45">History</p>
            <h2 className="mt-1 text-xl font-semibold">Analysis history</h2>
          </div>
          <DemoPill tone="blue">{history?.length ?? 0} records</DemoPill>
          {showMockHistory ? <DemoPill>Mock preview</DemoPill> : null}
        </div>

        {historyLoading ? (
          <div className="space-y-3 p-5">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
          </div>
        ) : history && history.length > 0 ? (
          <div className="divide-y divide-black/10">
            {history.map((log) => (
              <article key={log._id} className="grid gap-4 p-5 lg:grid-cols-[220px_1fr]">
                <div>
                  <p className="font-medium capitalize">{log.language ?? 'code'} analysis</p>
                  <p className="mt-2 flex items-center gap-1 text-xs text-black/45">
                    <Clock size={12} />
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg bg-[#f7f4ee] p-4">
                  <p className="whitespace-pre-wrap text-sm leading-6 text-black/65">{log.response}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-black/10">
            <article className="grid gap-4 p-5 lg:grid-cols-[220px_1fr]">
              <div>
                <p className="font-medium">Mock concurrency analysis</p>
                <p className="mt-2 flex items-center gap-1 text-xs text-black/45">
                  <Clock size={12} />
                  Demo preview until /ai/history has records
                </p>
              </div>
              <div className="rounded-lg bg-[#f7f4ee] p-4">
                <p className="whitespace-pre-wrap text-sm leading-6 text-black/65">{DEMO_AI_RESPONSE}</p>
              </div>
            </article>
          </div>
        )}
      </DemoWhitePanel>
    </DemoPageRoot>
  );
};
