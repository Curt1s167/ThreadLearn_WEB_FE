import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, BookOpen, Users, Filter, ChevronDown } from 'lucide-react';
import { coursesService } from '../../services';
import { Card, Badge, Skeleton, EmptyState } from '../../components/shared';
import { BookmarkButton } from '../../components/shared/BookmarkButton';
import type { CourseLevel } from '../../types';

const LEVELS: CourseLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
const levelColors: Record<CourseLevel, 'green' | 'amber' | 'red'> = {
  BEGINNER: 'green', INTERMEDIATE: 'amber', ADVANCED: 'red',
};

export const CoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search,      setSearch]      = useState(searchParams.get('search') || '');
  const [level,       setLevel]       = useState<CourseLevel | ''>('');
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['courses', search, level],
    queryFn:  () => coursesService.list({ search, level: level || undefined }),
  });

  const courses = (data as any)?.data ?? (data as any)?.items ?? [];

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-mono font-bold text-2xl text-gray-100">Courses</h1>
        <button onClick={() => setShowFilters(v => !v)}
          className="flex items-center gap-1.5 text-xs font-mono text-gray-500 hover:text-gray-300 transition-colors">
          <Filter size={12}/> Filters <ChevronDown size={12} className={showFilters ? 'rotate-180 transition-transform' : 'transition-transform'}/>
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"/>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses..."
            className="input-field pl-9 w-full"
          />
        </div>
        {showFilters && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setLevel('')}
              className={`px-3 py-1 text-xs font-mono rounded-lg border transition-colors ${!level ? 'bg-violet-500/10 border-violet-500/30 text-violet-300' : 'border-white/10 text-gray-500 hover:text-gray-300'}`}>
              All levels
            </button>
            {LEVELS.map(l => (
              <button key={l} onClick={() => setLevel(l === level ? '' : l)}
                className={`px-3 py-1 text-xs font-mono rounded-lg border transition-colors ${level===l ? 'bg-violet-500/10 border-violet-500/30 text-violet-300' : 'border-white/10 text-gray-500 hover:text-gray-300'}`}>
                {l}
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-52 rounded-xl"/>)}
        </div>
      ) : courses.length === 0 ? (
        <EmptyState icon={<BookOpen size={32}/>} title="No courses found" description="Try adjusting your search or filters."/>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course: any) => (
            <Card key={course._id} className="overflow-hidden cursor-pointer hover:border-violet-500/30 transition-colors group"
              onClick={() => navigate(`/courses/${course._id}`)}>
              {course.thumbnail && (
                <div className="relative h-36 bg-black overflow-hidden">
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"/>
                  <div className="absolute top-2 right-2">
                    <BookmarkButton targetType="COURSE" targetId={course._id} title={course.title} thumbnailUrl={course.thumbnail}/>
                  </div>
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-mono font-semibold text-sm text-gray-100 line-clamp-2 flex-1">{course.title}</h3>
                  {course.level && <Badge color={levelColors[course.level as CourseLevel]}>{course.level}</Badge>}
                </div>
                <p className="text-xs text-gray-600 font-mono line-clamp-2 mb-3">{course.description}</p>
                <div className="flex items-center gap-3 text-[11px] text-gray-700 font-mono">
                  <span className="flex items-center gap-1"><BookOpen size={10}/>{course.lessonCount ?? 0} lessons</span>
                  <span className="flex items-center gap-1"><Users size={10}/>{course.enrollmentCount ?? 0} enrolled</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

