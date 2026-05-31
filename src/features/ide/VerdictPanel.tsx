
import React, { useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Terminal, Bot } from 'lucide-react';
import { Card, Button } from '../../components/shared';
import { AIRecommendPanel } from '../ai/AIRecommendPanel';
import type { RunCodeResult, Verdict } from '../../types';

interface Props {
  result: RunCodeResult | null;
  isLoading: boolean;
  code: string;
  language: string;
}

const verdictConfig: Record<Verdict, { label: string; color: string; icon: React.ReactNode }> = {
  PASS: {
    label: 'Tất cả test cases đã vượt qua!',
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    icon: <CheckCircle2 size={16} className="text-emerald-400" />,
  },
  PARTIAL: {
    label: 'Một số test cases thất bại',
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    icon: <AlertTriangle size={16} className="text-amber-400" />,
  },
  FAIL: {
    label: 'Không có test case nào vượt qua',
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    icon: <XCircle size={16} className="text-rose-400" />,
  },
  ERROR: {
    label: 'Lỗi runtime',
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    icon: <Terminal size={16} className="text-rose-400" />,
  },
};

export const VerdictPanel: React.FC<Props> = ({ result, isLoading, code, language }) => {
  const [showAI, setShowAI] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 h-full">
        <div className="h-16 skeleton rounded-xl" />
        <div className="h-40 skeleton rounded-xl" />
        <div className="h-8 skeleton rounded-xl" />
      </div>
    );
  }

  if (!result) {
    return (
      <Card className="p-6 flex flex-col items-center justify-center gap-3 h-full text-center">
        <Terminal size={28} className="text-gray-700" />
        <p className="text-gray-500 font-mono text-sm">Chạy code để xem kết quả</p>
      </Card>
    );
  }

  const cfg = verdictConfig[result.verdict];
  const showAIButton = result.verdict !== 'PASS';

  return (
    <div className="flex flex-col gap-3">
      {/* Verdict banner */}
      <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border ${cfg.color}`}>
        {cfg.icon}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-mono font-medium">{cfg.label}</p>
          <p className="text-xs opacity-75 font-mono mt-0.5">
            {result.passedCases}/{result.totalCases} tests · Score: {result.score}%
          </p>
        </div>
      </div>

      {/* Test results table */}
      <Card className="overflow-hidden">
        <div className="px-4 py-2.5 border-b border-white/[0.06]">
          <span className="text-xs font-mono text-gray-400 font-medium">Test Results</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-white/[0.04]">
                <th className="text-left px-3 py-2 text-gray-600">#</th>
                <th className="text-left px-3 py-2 text-gray-600">Status</th>
                <th className="text-left px-3 py-2 text-gray-600">Input</th>
                <th className="text-left px-3 py-2 text-gray-600">Expected</th>
                <th className="text-left px-3 py-2 text-gray-600">Actual</th>
                <th className="text-left px-3 py-2 text-gray-600">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {result.testResults.map((tr, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-3 py-2 text-gray-600">{i + 1}</td>
                  <td className="px-3 py-2">
                    {tr.passed ? (
                      <span className="text-emerald-400">✓ Pass</span>
                    ) : (
                      <span className="text-rose-400">✗ Fail</span>
                    )}
                  </td>
                  {tr.isHidden ? (
                    <>
                      <td colSpan={3} className="px-3 py-2 text-gray-700 italic">
                        Hidden test case #{i + 1} {tr.passed ? '✅' : '❌'}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2 text-gray-500 max-w-[80px] truncate">
                        {tr.input ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-gray-500 max-w-[80px] truncate">
                        {tr.expectedOutput ?? '—'}
                      </td>
                      <td className={`px-3 py-2 max-w-[80px] truncate ${tr.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {tr.actualOutput ?? '—'}
                      </td>
                    </>
                  )}
                  <td className="px-3 py-2 text-gray-600">{tr.executionTime}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* AI suggestion button */}
      {showAIButton && !showAI && (
        <Button variant="outline" onClick={() => setShowAI(true)} className="self-start">
          <Bot size={13} />
          Gợi ý AI
        </Button>
      )}

      {/* AI panel */}
      {showAI && (
        <AIRecommendPanel
          code={code}
          language={language}
          codeExecutionId={result.executionId}
          onClose={() => setShowAI(false)}
        />
      )}
    </div>
  );
};

