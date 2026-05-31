
import React, { useState } from 'react';
import { Bot, X, Lock, Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, Button, Badge } from '../../components/shared';
import { useAIRecommend } from '../../hooks/useAIAnalysis';
import { useAuthStore } from '../../store';
import type { AIAnalysisResult } from '../../types';

interface Props {
  code: string;
  language: string;
  codeExecutionId?: string;
  onClose?: () => void;
}

export const AIRecommendPanel: React.FC<Props> = ({
  code,
  language,
  codeExecutionId,
  onClose,
}) => {
  const { user } = useAuthStore();
  const isPremium = user?.planType === 'PREMIUM';
  const [result, setResult] = useState<AIAnalysisResult | null>(null);
  const [showOptimized, setShowOptimized] = useState(false);

  const { mutate: analyze, isPending } = useAIRecommend();

  const handleAnalyze = () => {
    analyze(
      { inputCode: code, language, codeExecutionId },
      {
        onSuccess: (resp) => {
          setResult(resp.data);
        },
      }
    );
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Bot size={14} className="text-violet-400" />
          <span className="text-sm font-mono font-medium text-gray-200">AI Analysis</span>
          {result && (
            <Badge color="gray">
              {result.remainingQuota}/{result.quotaLimit} còn lại
            </Badge>
          )}
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 text-gray-600 hover:text-gray-400 rounded transition-colors">
            <X size={13} />
          </button>
        )}
      </div>

      {!result && (
        <Button
          onClick={handleAnalyze}
          disabled={!code.trim() || isPending}
          loading={isPending}
          className="w-full justify-center"
        >
          {isPending ? 'Đang phân tích...' : 'Phân tích với AI'}
        </Button>
      )}

      {isPending && (
        <div className="flex flex-col gap-2 mt-3">
          <div className="h-4 skeleton rounded w-3/4" />
          <div className="h-4 skeleton rounded" />
          <div className="h-4 skeleton rounded w-5/6" />
        </div>
      )}

      {result && !isPending && (
        <div className="flex flex-col gap-4 mt-1">
          {/* Suggestions */}
          {result.suggestions.length > 0 && (
            <div>
              <p className="text-xs font-mono text-gray-400 font-medium mb-2">Gợi ý cải thiện</p>
              <ul className="flex flex-col gap-1.5">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="flex gap-2 text-xs font-mono text-gray-400">
                    <span className="text-violet-400 shrink-0 mt-0.5">•</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Race conditions */}
          {result.raceConditions.length > 0 && (
            <div>
              <p className="text-xs font-mono text-amber-400 font-medium mb-2 flex items-center gap-1">
                <AlertCircle size={11} />
                Cảnh báo race condition
              </p>
              <ul className="flex flex-col gap-1.5">
                {result.raceConditions.map((r, i) => (
                  <li key={i} className="flex gap-2 text-xs font-mono text-amber-300/70">
                    <span className="text-amber-400 shrink-0 mt-0.5">!</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Explanation */}
          {result.explanation && (
            <div className="text-xs font-mono text-gray-500 leading-relaxed bg-white/[0.02] p-3 rounded-lg border border-white/[0.04]">
              {result.explanation}
            </div>
          )}

          {/* Optimized code — Premium gate */}
          <div>
            <button
              onClick={() => setShowOptimized((v) => !v)}
              className="text-xs font-mono text-gray-400 flex items-center gap-1 hover:text-gray-200 transition-colors mb-2"
            >
              {showOptimized ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              Code tối ưu
              {!isPremium && <Lock size={10} className="text-amber-400 ml-1" />}
            </button>

            {showOptimized && (
              <div className="relative">
                <pre className={`text-xs font-mono bg-black/30 border border-white/[0.06] rounded-lg p-3 overflow-x-auto leading-relaxed ${!isPremium ? 'select-none' : ''}`}>
                  <code className={!isPremium ? 'blur-sm' : ''}>
                    {result.optimizedCode}
                  </code>
                </pre>
                {!isPremium && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 rounded-lg backdrop-blur-[2px]">
                    <Lock size={16} className="text-amber-400" />
                    <p className="text-xs font-mono text-amber-300 text-center">
                      Nâng cấp Premium để xem code tối ưu
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <Button variant="ghost" size="sm" onClick={handleAnalyze} className="self-start">
            Phân tích lại
          </Button>
        </div>
      )}
    </Card>
  );
};

