'use client';

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, BookOpen, Users, Filter, ChevronDown, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { coursesService } from '../../services';
import { Card, Badge, Skeleton, EmptyState } from '../../components/shared';
import { useDebounce } from '../../hooks';
import type { CourseLevel } from '../../types';

const LEVELS: CourseLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
const levelColors: Record<CourseLevel, 'green' | 'amber' | 'red'> = {
  BEGINNER: 'green',
  INTERMEDIATE: 'amber',
  ADVANCED: 'red',
};

const getLevelColor = (level?: CourseLevel): 'green' | 'amber' | 'red' | 'gray' => {
  if (!level) return 'gray';
  return levelColors[level] ?? 'gray';
};

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
          <h1 className="font-mono font-bold text-2xl text-gray-100">Courses</h1>
          <p className="text-gray-600 font-mono text-sm mt-1">
            {data?.total ?? 0} courses available
          </p>
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="btn-outline text-sm"
        >
          <Filter size={14} />
          Filters
          <ChevronDown size={12} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
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
            <span className="text-xs text-gray-600 font-mono self-center">Level:</span>
            <button
              onClick={() => setLevel('')}
              className={`text-xs font-mono px-3 py-1 rounded-lg border transition-colors ${
                level === ''
                  ? 'bg-violet-500/10 border-violet-500/30 text-violet-300'
                  : 'border-white/10 text-gray-500 hover:border-white/20 hover:text-gray-300'
              }`}
            >
              All
            </button>
            {LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l === level ? '' : l)}
                className={`text-xs font-mono px-3 py-1 rounded-lg border transition-colors ${
                  level === l
                    ? 'bg-violet-500/10 border-violet-500/30 text-violet-300'
                    : 'border-white/10 text-gray-500 hover:border-white/20 hover:text-gray-300'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {courses.map((course) => (
            <Card
              key={course._id}
              className="overflow-hidden hover:border-violet-500/20 transition-all duration-200 cursor-pointer group"
              onClick={() => router.push(`/courses/${course._id}`)}
            >
              {/* Thumbnail */}
              <div className="h-28 bg-gradient-to-br from-violet-900/30 to-violet-600/10 flex items-center justify-center border-b border-white/[0.05] relative overflow-hidden">
                {course.thumbnailUrl ? (
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <BookOpen size={28} className="text-violet-600/50" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#111118]/60 to-transparent" />
                {!course.isPublished && (
                  <div className="absolute top-2 right-2">
                    <Badge color="gray">Draft</Badge>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-mono font-semibold text-gray-200 text-sm leading-tight line-clamp-2 group-hover:text-violet-300 transition-colors">
                    {course.title}
                  </h3>
                  <Badge color={getLevelColor(course.level)}>{course.level?.slice(0, 3) ?? 'N/A'}</Badge>
                </div>

                {course.description && (
                  <p className="text-xs text-gray-600 font-mono line-clamp-2 mb-3">
                    {course.description}
                  </p>
                )}

                <div className="flex items-center gap-3 text-xs text-gray-600 font-mono">
                  <span className="flex items-center gap-1">
                    <BookOpen size={11} />
                    {course.totalLessons ?? course.lessonCount ?? 0} lessons
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={11} />
                    {course.totalEnrollments ?? course.enrollmentCount ?? 0}
                  </span>
                  {course.language && (
                    <span className="tag">{course.language}</span>
                  )}
                </div>

                {course.tags && course.tags.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {course.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
