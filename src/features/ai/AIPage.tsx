import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bot, Send, BookOpen, Clock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { aiService, coursesService } from '../../services';
import { Card, Button, Skeleton } from '../../components/shared';

export const AIPage: React.FC = () => {
  const [selectedCourse, setSelectedCourse] = useState('');
  const queryClient = useQueryClient();

  const { data: courses } = useQuery({
    queryKey: ['courses-simple'],
    queryFn: () => coursesService.list({ limit: 100 }),
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['ai-history'],
    queryFn: aiService.getHistory,
  });

  const { mutate: requestRec, isPending } = useMutation({
    mutationFn: () => aiService.requestRecommendation(selectedCourse),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-history'] });
      setSelectedCourse('');
      toast.success('AI recommendation generated!');
    },
    onError: () => toast.error('Failed to get recommendation'),
  });

  return (
    <div className="flex flex-col gap-5 animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600/20 to-violet-800/20 border border-violet-500/20 flex items-center justify-center">
          <Bot size={20} className="text-violet-400" />
        </div>
        <div>
          <h1 className="font-mono font-bold text-2xl text-gray-100">AI Advisor</h1>
          <p className="text-gray-600 font-mono text-sm">Personalized learning roadmap generator</p>
        </div>
      </div>

      {/* Request form */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={14} className="text-violet-400" />
          <h2 className="font-mono font-medium text-gray-200 text-sm">Get a recommendation</h2>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-gray-500 font-mono mb-1.5 block">Select a course</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="input-field"
            >
              <option value="">-- Choose a course --</option>
              {courses?.items.map((c) => (
                <option key={c._id} value={c._id}>{c.title}</option>
              ))}
            </select>
          </div>

          <Button
            onClick={() => requestRec()}
            disabled={!selectedCourse}
            loading={isPending}
            className="self-start"
          >
            <Send size={13} />
            Generate roadmap
          </Button>
        </div>
      </Card>

      {/* History */}
      <div>
        <h2 className="font-mono font-medium text-gray-400 text-sm mb-3">Recommendation history</h2>

        {historyLoading ? (
          <div className="flex flex-col gap-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        ) : history && history.length > 0 ? (
          <div className="flex flex-col gap-3">
            {history.map((log) => (
              <Card key={log._id} className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen size={13} className="text-violet-400" />
                  <span className="text-xs font-mono text-gray-500">
                    Course #{log.courseId.slice(-6)}
                  </span>
                  <span className="text-gray-700">·</span>
                  <span className="text-xs text-gray-600 font-mono flex items-center gap-1">
                    <Clock size={11} />
                    {new Date(log.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="bg-black/20 rounded-lg p-3 border border-white/[0.04]">
                  <p className="text-sm text-gray-400 font-mono leading-relaxed whitespace-pre-wrap">
                    {log.response}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <Bot size={28} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 font-mono text-sm">No recommendations yet</p>
            <p className="text-gray-700 font-mono text-xs mt-1">Select a course to get your personalized roadmap</p>
          </Card>
        )}
      </div>
    </div>
  );
};
