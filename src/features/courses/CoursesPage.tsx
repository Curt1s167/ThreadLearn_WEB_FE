'use client';

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, BookOpen, Filter, ChevronDown, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { coursesService } from '../../services';
import { CourseCard, Skeleton, EmptyState } from '../../components/shared';
import { useDebounce } from '../../hooks';
import type { CourseLevel } from '../../types';

const LEVELS: CourseLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

export const CoursesPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [level, setLevel] = useState<CourseLevel | ''>('');
  const [showFilters, setShowFilters] = useState(false);
  const debouncedSearch = useDebounce(search, 350);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['courses', debouncedSearch, level],
    queryFn: () => coursesService.list({ search: debouncedSearch || undefined, level: level || undefined }),
  });

  const courses = data?.items ?? [];

  useEffect(() => {
    if (isError) toast.error('Failed to load courses');
  }, [isError]);

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono font-bold text-2xl text-ink">Courses</h1>
          <p className="text-ink-faint font-mono text-sm mt-1">
            {data?.total ?? 0} courses available
          </p>
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="btn-outline text-sm outline-none focus-visible:ring-2 focus-visible:ring-black/25 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas-cream"
        >
          <Filter size={14} />
          Filters
          <ChevronDown size={12} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses by title..."
            className="input-field pl-9"
          />
        </div>

        {showFilters && (
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs text-ink-faint font-mono self-center">Level:</span>
            <button
              onClick={() => setLevel('')}
              className={`text-xs font-mono px-3 py-1 rounded-lg border transition-colors ${
                level === ''
                  ? 'bg-brand-lime/40 border-black/15 text-ink'
                  : 'border-black/10 text-ink-muted hover:border-black/15 hover:text-ink/80'
              } outline-none focus-visible:ring-2 focus-visible:ring-black/25 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas-cream`}
            >
              All
            </button>
            {LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l === level ? '' : l)}
                className={`text-xs font-mono px-3 py-1 rounded-lg border transition-colors ${
                  level === l
                    ? 'bg-brand-lime/40 border-black/15 text-ink'
                    : 'border-black/10 text-ink-muted hover:border-black/15 hover:text-ink/80'
                } outline-none focus-visible:ring-2 focus-visible:ring-black/25 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas-cream`}
              >
                {l}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={<AlertCircle size={36} />}
          title="Could not load courses"
          description="Please try again in a moment"
        />
      ) : courses.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={36} />}
          title="No courses found"
          description="Try adjusting your search or filters"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {courses.map((course) => (
            <CourseCard
              key={course._id}
              course={course}
              onClick={() => router.push(`/courses/${course._id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
