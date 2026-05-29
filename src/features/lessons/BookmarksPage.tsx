'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bookmark, BookOpen, GraduationCap, Trash2 } from 'lucide-react';
import { Card, EmptyState, Skeleton } from '../../components/shared';
import { useMyBookmarks, useToggleBookmark } from '../../hooks/useBookmarks';
import type { BookmarkTargetType } from '../../types';

type FilterTab = 'ALL' | 'COURSE' | 'LESSON';

export const BookmarksPage: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');

  const targetType: BookmarkTargetType | undefined =
    activeTab === 'ALL' ? undefined : activeTab;

  const { data, isLoading } = useMyBookmarks(targetType);
  const { mutate: toggleBookmark } = useToggleBookmark();

  const bookmarks = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'COURSE', label: 'Khóa học' },
    { key: 'LESSON', label: 'Bài học' },
  ];

  const handleNavigate = (targetType: BookmarkTargetType, targetId: string) => {
    if (targetType === 'COURSE') {
      router.push(`/courses/${targetId}`);
    } else {
      router.push(`/lessons/${targetId}`);
    }
  };

  const handleRemove = (bm: { targetType: BookmarkTargetType; targetId: string; title: string; thumbnailUrl?: string | null }) => {
    toggleBookmark({
      targetType: bm.targetType,
      targetId: bm.targetId,
      title: bm.title,
      thumbnailUrl: bm.thumbnailUrl ?? undefined,
    });
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-2">
        <Bookmark size={18} className="text-violet-400" />
        <h1 className="font-mono font-bold text-2xl text-gray-100">Bookmarks</h1>
        {total > 0 && (
          <span className="text-xs font-mono text-gray-600">({total})</span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-colors ${
              activeTab === tab.key
                ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20'
                : 'text-gray-600 hover:text-gray-400 border border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : bookmarks.length > 0 ? (
        <div className="flex flex-col gap-2">
          {bookmarks.map((bm) => (
            <Card
              key={bm._id}
              className="p-3 flex items-center gap-3 hover:border-violet-500/20 transition-all"
            >
              {bm.thumbnailUrl ? (
                <img
                  src={bm.thumbnailUrl}
                  alt={bm.title}
                  className="w-12 h-12 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                  {bm.targetType === 'COURSE' ? (
                    <GraduationCap size={16} className="text-violet-400" />
                  ) : (
                    <BookOpen size={16} className="text-violet-400" />
                  )}
                </div>
              )}

              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => handleNavigate(bm.targetType, bm.targetId)}
              >
                <p className="text-sm text-gray-200 font-mono truncate hover:text-violet-300 transition-colors">
                  {bm.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                    bm.targetType === 'COURSE'
                      ? 'text-violet-400 border-violet-500/20 bg-violet-500/5'
                      : 'text-blue-400 border-blue-500/20 bg-blue-500/5'
                  }`}>
                    {bm.targetType === 'COURSE' ? 'Khóa học' : 'Bài học'}
                  </span>
                  <span className="text-xs text-gray-600 font-mono">
                    {new Date(bm.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleRemove(bm)}
                className="p-2 text-gray-600 hover:text-rose-400 hover:bg-rose-500/5 rounded-lg transition-colors shrink-0"
                title="Xóa bookmark"
              >
                <Trash2 size={14} />
              </button>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Bookmark size={36} />}
          title="Chưa có bookmark"
          description={
            activeTab === 'ALL'
              ? 'Bookmark khóa học và bài học để tìm lại nhanh hơn'
              : `Chưa có bookmark ${activeTab === 'COURSE' ? 'khóa học' : 'bài học'} nào`
          }
        />
      )}
    </div>
  );
};
