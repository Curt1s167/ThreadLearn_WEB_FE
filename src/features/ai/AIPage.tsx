import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bot, Send, BookOpen, Clock, Sparkles, Star } from 'lucide-react';
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
    mutationFn: () => aiService.requestCourseRecommendation({ courseId: selectedCourse }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-history'] });
      setSelectedCourse('');
      toast.success('AI recommendation generated!');
    },
    onError: () => toast.error('Failed to get recommendation'),
  });

  const { mutate: sendFeedback } = useMutation({
    mutationFn: ({ id, rating }: { id: string; rating: number }) => aiService.feedback(id, rating),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-history'] });
      toast.success('Feedback saved');
    },
    onError: () => toast.error('Could not save feedback'),
  });

  const usedToday =
    history?.filter((item) => new Date(item.createdAt).toDateString() === new Date().toDateString()).length ?? 0;
  const remainingToday = Math.max(0, 10 - usedToday);

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
          <span className="ml-auto text-xs text-gray-600 font-mono">{remainingToday}/10 left today</span>
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
                    {log.courseId ? `Course #${log.courseId.slice(-6)}` : log.lessonId ? `Lesson #${log.lessonId.slice(-6)}` : 'AI analysis'}
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
                <div className="flex items-center gap-1 mt-3">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => sendFeedback({ id: log._id, rating })}
                      className="p-1 text-gray-700 hover:text-amber-400 transition-colors"
                      title={`Rate ${rating}`}
                    >
                      <Star size={13} />
                    </button>
                  ))}
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
