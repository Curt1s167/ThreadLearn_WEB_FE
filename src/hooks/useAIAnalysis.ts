
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { aiAnalysisService } from '../services/aiAnalysis.service';

export function useAIRecommend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: aiAnalysisService.recommend,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-analysis-history'] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Không thể phân tích code';
      toast.error(msg);
    },
  });
}

export function useAIHistory(page = 1) {
  return useQuery({
    queryKey: ['ai-analysis-history', page],
    queryFn: () => aiAnalysisService.getHistory(page),
  });
}

