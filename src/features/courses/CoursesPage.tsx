'use client';

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { FALLBACK_COURSES } from '../ui-reskin/demo-fallbacks';

const LEVELS: CourseLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

/**
 * PR10 — catalog layout mirrors DemoCoursesPage.
 * LOGIC LOCK: list query, debounce search, level filter, toast on error.
 */
export const CoursesPage: React.FC = () => {
  const router = useRouter();
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
  const useMockCourses = !isLoading && (isError || courses.length === 0);
  const visibleCourses = useMockCourses ? FALLBACK_COURSES : courses;

  useEffect(() => {
    if (isError) toast.error('Failed to load courses. Showing demo preview.');
  }, [isError]);

  return (
    <DemoPageRoot>
      <DemoHeroWhite>
        <p className="text-xs uppercase tracking-[0.18em] text-black/45">Curriculum</p>
        <div className="mt-3 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <DemoDisplayTitle>All courses</DemoDisplayTitle>
            <DemoMuted>
              {useMockCourses
                ? 'Demo course previews are shown because the backend has no catalog data yet.'
                : data?.total != null
                ? `${data.total} courses available — focused paths for async programming and production-safe backend patterns.`
                : 'A focused path for async programming, concurrency bugs, and production-safe backend patterns.'}
            </DemoMuted>
          </div>
          <label className="flex min-w-0 items-center gap-2 rounded-full border border-black/10 bg-[#f7f4ee] px-4 py-3 text-sm lg:w-80">
            <Search size={16} className="shrink-0 text-black/40" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses..."
              className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-black/40"
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setLevel('')}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              level === ''
                ? 'bg-black text-white'
                : 'border border-black/10 bg-white text-black/60 hover:border-black/20'
            }`}
          >
            All levels
          </button>
          {LEVELS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setLevel(item === level ? '' : item)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                level === item
                  ? 'bg-black text-white'
                  : 'border border-black/10 bg-white text-black/60 hover:border-black/20'
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
      ) : visibleCourses.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={36} />}
          title="No courses found"
          description="Try adjusting your search or filters"
        />
      ) : (
        <>
          {useMockCourses ? (
            <div className="rounded-lg border border-black/10 bg-[#d9f99d] p-4 text-sm text-black/65">
              Mock catalog preview from the demo flow. Connect coursesService.list data to replace these cards.
            </div>
          ) : null}
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visibleCourses.map((course) => (
              <CourseCard
                key={course._id}
                course={course}
                onClick={useMockCourses ? undefined : () => router.push(`/courses/${course._id}`)}
              />
            ))}
          </div>
        </>
      )}
    </DemoPageRoot>
  );
};
