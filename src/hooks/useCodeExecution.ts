
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { codeExecutionService } from '../services/codeExecution.service';

export function useExercise(lessonId: string) {
  return useQuery({
    queryKey: ['exercise', lessonId],
    queryFn: () => codeExecutionService.getExercise(lessonId),
    enabled: !!lessonId,
    retry: false,
  });
}

export function useRunCode() {
  return useMutation({
    mutationFn: codeExecutionService.runCode,
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Lỗi khi chạy code';
      toast.error(msg);
    },
  });
}

export function useExecutionHistory(exerciseId: string) {
  return useQuery({
    queryKey: ['execution-history', exerciseId],
    queryFn: () => codeExecutionService.getHistory(exerciseId),
    enabled: !!exerciseId,
  });
}

