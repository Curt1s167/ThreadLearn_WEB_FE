'use client';

import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, Search } from 'lucide-react';
import { toast } from 'sonner';
import { coursesService } from '../../services';
import { CourseCard, EmptyState, Skeleton } from '../../components/shared';
import { useDebounce } from '../../hooks';
import type { CourseLevel } from '../../types';
import {
  DemoDisplayTitle,
  DemoHeroWhite,
  DemoMuted,
  DemoPageRoot,
  DemoPill,
} from '../ui-reskin/demo-ui';

const LEVELS: CourseLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

/**
 * PR10 — catalog layout mirrors DemoCoursesPage.
 * LOGIC LOCK: list query, debounce search, level filter, toast on error.
 */
export const CoursesPage: React.FC = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [level, setLevel] = useState<CourseLevel | ''>('');
  const debouncedSearch = useDebounce(search, 350);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['courses', debouncedSearch, level],
    queryFn: () =>
      coursesService.list({
        search: debouncedSearch || undefined,
        level: level || undefined,
      }),
  });

  const courses = data?.items ?? [];
  useEffect(() => {
    if (isError) toast.error('Failed to load courses');
  }, [isError]);

  return (
    <DemoPageRoot>
      <DemoHeroWhite>
        <p className="text-xs uppercase tracking-[0.18em] text-black/45">Curriculum</p>
        <div className="mt-3 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <DemoDisplayTitle>All courses</DemoDisplayTitle>
            <DemoMuted>
              {data?.total != null
                ? `${data.total} courses available — focused paths for async programming and production-safe backend patterns.`
                : 'A focused path for async programming, concurrency bugs, and production-safe backend patterns.'}
            </DemoMuted>
          </div>
          <label className="catalog-search flex min-w-0 items-center gap-2 rounded-full px-4 py-3 text-sm lg:w-80">
            <Search size={16} className="catalog-search-icon shrink-0" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses..."
              className="min-w-0 flex-1 bg-transparent outline-none"
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setLevel('')}
            className={`catalog-filter rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              level === ''
                ? 'catalog-filter-active'
                : ''
            }`}
          >
            All levels
          </button>
          {LEVELS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setLevel(item === level ? '' : item)}
              className={`catalog-filter rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                level === item
                  ? 'catalog-filter-active'
                  : ''
              }`}
            >
              {item.toLowerCase()}
            </button>
          ))}
          {level ? (
            <DemoPill tone="lime">{level.toLowerCase()} filter</DemoPill>
          ) : null}
        </div>
      </DemoHeroWhite>

      {isLoading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={<BookOpen size={36} />}
          title="Could not load courses"
          description="Please try again in a moment."
        />
      ) : courses.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={36} />}
          title="No courses found"
          description="Try adjusting your search or filters"
        />
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <CourseCard
                key={course._id}
                course={course}
                onClick={() => router.push(`/courses/${course._id}`)}
                onIntent={() => {
                  router.prefetch(`/courses/${course._id}`);
                  void queryClient.prefetchQuery({
                    queryKey: ['course-detail', course._id],
                    queryFn: () => coursesService.getById(course._id),
                  });
                }}
              />
            ))}
          </div>
        </>
      )}
    </DemoPageRoot>
  );
};
