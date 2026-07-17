'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ChevronRight, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { aiService } from '../../services';
import { Button, EmptyState, Skeleton } from '../../components/shared';
import { DemoDisplayTitle, DemoHeroWhite, DemoMuted, DemoPageRoot, DemoPill } from '../ui-reskin/demo-ui';
import { AnalysisResult, logToView, severityCounts } from './analysisResult';

const Breadcrumb: React.FC<{ id: string }> = ({ id }) => {
  const router = useRouter();
  return (
    <nav className="flex items-center gap-1.5 text-xs text-black/45">
      <button type="button" onClick={() => router.push('/ai')} className="hover:text-black transition-colors">
        AI Advisor
      </button>
      <ChevronRight size={12} />
      <button type="button" onClick={() => router.push('/ai')} className="hover:text-black transition-colors">
        History
      </button>
      <ChevronRight size={12} />
      <span className="font-mono text-black/60">{id.slice(-6).toUpperCase()}</span>
    </nav>
  );
};

export const AIHistoryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: log, isLoading, isError } = useQuery({
    queryKey: ['ai-history', id],
    queryFn: () => aiService.getHistoryById(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (isError) toast.error('Failed to load analysis detail');
  }, [isError]);

  if (isLoading) {
    return (
      <DemoPageRoot>
        <Skeleton className="h-8 w-64 rounded" />
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-72 rounded-lg" />
      </DemoPageRoot>
    );
  }

  if (isError || !log) {
    return (
      <EmptyState
        icon={<AlertCircle size={36} />}
        title="Could not load analysis"
        description="This entry may no longer be available"
        action={(
          <Button variant="outline" onClick={() => router.push('/ai')}>
            Back to AI Advisor
          </Button>
        )}
      />
    );
  }

  const { high, medium, low } = severityCounts(log.issues ?? []);

  return (
    <DemoPageRoot>
      <Breadcrumb id={log._id} />

      <DemoHeroWhite>
        <div className="flex flex-wrap items-center gap-2">
          <DemoPill tone={high > 0 ? 'pink' : medium > 0 ? 'blue' : 'lime'}>
            {(log.issues?.length ?? 0) === 0 ? 'No issues' : `${log.issues?.length} issue${(log.issues?.length ?? 0) > 1 ? 's' : ''}`}
          </DemoPill>
          {high > 0 && <DemoPill tone="pink">{high} HIGH</DemoPill>}
          {medium > 0 && <DemoPill tone="blue">{medium} MED</DemoPill>}
          {low > 0 && <DemoPill>{low} LOW</DemoPill>}
        </div>
        <DemoDisplayTitle>
          Analysis · {log._id.slice(-6).toUpperCase()}
        </DemoDisplayTitle>
        <DemoMuted>
          <span className="inline-flex items-center gap-1.5">
            <Clock size={13} />
            {new Date(log.createdAt).toLocaleString()}
          </span>
          {log.language ? ` · ${log.language}` : ''}
        </DemoMuted>
      </DemoHeroWhite>

      {log.inputCode && (
        <div className="overflow-hidden rounded-lg border border-black/10 bg-[#111827] text-white">
          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-white/35">Submitted code</p>
          </div>
          <pre className="max-h-96 overflow-auto p-5">
            <code className="font-mono text-sm leading-6 text-[#d9f99d] whitespace-pre-wrap break-words">
              {log.inputCode}
            </code>
          </pre>
        </div>
      )}

      <AnalysisResult view={logToView(log)} />
    </DemoPageRoot>
  );
};
