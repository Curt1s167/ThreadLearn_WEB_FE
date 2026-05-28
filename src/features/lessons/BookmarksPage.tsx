import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Bookmark, BookOpen, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { bookmarksService } from '../../services';
import { Card, EmptyState, Skeleton } from '../../components/shared';

export const BookmarksPage: React.FC = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: bookmarks, isLoading } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: bookmarksService.getAll,
  });

  const { mutate: toggleBookmark } = useMutation({
    mutationFn: (lessonId: string) => bookmarksService.toggle(lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      toast.success('Bookmark removed');
    },
  });

  return (
    <div className="flex flex-col gap-5 animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-2">
        <Bookmark size={18} className="text-violet-400" />
        <h1 className="font-mono font-bold text-2xl text-gray-100">Bookmarks</h1>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : bookmarks && bookmarks.length > 0 ? (
        <div className="flex flex-col gap-2">
          {bookmarks.map((bm) => (
            <Card
              key={bm._id}
              className="p-3 flex items-center gap-3 hover:border-violet-500/20 transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                <BookOpen size={14} className="text-violet-400" />
              </div>
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => router.push(`/lessons/${bm.lessonId}`)}
              >
                <p className="text-sm text-gray-200 font-mono truncate hover:text-violet-300 transition-colors">
                  {bm.lesson?.title || `Lesson #${bm.lessonId.slice(-6)}`}
                </p>
                <p className="text-xs text-gray-600 font-mono">
                  Saved {new Date(bm.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => toggleBookmark(bm.lessonId)}
                className="p-2 text-gray-600 hover:text-rose-400 hover:bg-rose-500/5 rounded-lg transition-colors"
                title="Remove bookmark"
              >
                <Trash2 size={14} />
              </button>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Bookmark size={36} />}
          title="No bookmarks yet"
          description="Bookmark lessons to find them quickly later"
        />
      )}
    </div>
  );
};
