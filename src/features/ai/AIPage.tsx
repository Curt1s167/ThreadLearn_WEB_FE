'use client';

import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bot, Send, Code2, Clock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { aiService } from '../../services';
import { Card, Button, EmptyState, Skeleton } from '../../components/shared';

const LANGUAGES = ['javascript', 'typescript', 'python', 'java', 'go'];

export const AIPage: React.FC = () => {
  const [code, setCode] = useState('');
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

  return (
    <div className="flex flex-col gap-5 animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600/20 to-violet-800/20 border border-violet-500/20 flex items-center justify-center">
          <Bot size={20} className="text-violet-400" />
        </div>
        <div>
          <h1 className="font-mono font-bold text-2xl text-ink">AI Code Analyzer</h1>
          <p className="text-ink-faint font-mono text-sm">Detects concurrency issues in your code</p>
        </div>
      </div>

      {/* Request form */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={14} className="text-violet-400" />
          <h2 className="font-mono font-medium text-ink text-sm">Analyze code</h2>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-ink-muted font-mono mb-1.5 block">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="input-field"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-ink-muted font-mono mb-1.5 block">Code</label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="input-field font-mono text-sm min-h-[160px]"
              placeholder="Paste your code here..."
            />
          </div>

          <Button
            onClick={() => analyze()}
            disabled={!code.trim()}
            loading={isPending}
            className="self-start"
          >
            <Send size={13} />
            Analyze
          </Button>
        </div>
      </Card>

      {/* History */}
      <div>
        <h2 className="font-mono font-medium text-ink-muted text-sm mb-3">Analysis history</h2>

        {historyLoading ? (
          <div className="flex flex-col gap-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        ) : history && history.length > 0 ? (
          <div className="flex flex-col gap-3">
            {history.map((log) => (
              <Card key={log._id} className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Code2 size={13} className="text-violet-400" />
                  <span className="text-xs font-mono text-ink-muted">
                    {log.language ?? 'code'} analysis
                  </span>
                  <span className="text-ink-faint">·</span>
                  <span className="text-xs text-ink-faint font-mono flex items-center gap-1">
                    <Clock size={11} />
                    {new Date(log.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="bg-black/20 rounded-lg p-3 border border-black/10">
                  <p className="text-sm text-ink-muted font-mono leading-relaxed whitespace-pre-wrap">
                    {log.response}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Bot size={36} />}
            title="No analyses yet"
            description="Paste some code above to detect concurrency issues"
          />
        )}
      </div>
    </div>
  );
};
