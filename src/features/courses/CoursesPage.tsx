import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, BookOpen, Users, Clock, X } from 'lucide-react';
import {
  Badge, Skeleton, EmptyView,
} from '../../components/shared';
import { Stagger, FadeInItem } from '../../components/motion/PageTransition';
import { BookmarkButton } from '../bookmark';
import { useCourses } from '../../hooks/useCourses';
import type { CourseLevel } from '../../types';

const LEVELS: CourseLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
const levelColors: Record<CourseLevel, 'green' | 'amber' | 'red'> = {
  BEGINNER: 'green', INTERMEDIATE: 'amber', ADVANCED: 'red',
};
const levelLabels: Record<CourseLevel, string> = {
  BEGINNER: 'Cơ bản', INTERMEDIATE: 'Trung cấp', ADVANCED: 'Nâng cao',
};

export const CoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(
    searchParams.get('q') ?? searchParams.get('search') ?? '',
  );
  const [level, setLevel] = useState<CourseLevel | ''>(
    (searchParams.get('level') as CourseLevel | null) ?? '',
  );

  useEffect(() => {
    const t = setTimeout(() => {
      const next: Record<string, string> = {};
      if (search) next.q = search;
      if (level)  next.level = level;
      setSearchParams(next, { replace: true });
    }, 250);
    return () => clearTimeout(t);
  }, [search, level, setSearchParams]);

  const { data, isLoading } = useCourses({
    q:     search || undefined,
    level: level  || undefined,
  });
  const courses = (data?.data ?? []) as any[];
  const total   = data?.meta?.total ?? courses.length;
  const hasFilter = !!search || !!level;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <FadeInItem>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <h1 className="font-mono font-bold text-2xl text-gray-100">Khóa học</h1>
            <p className="text-xs text-gray-600 font-mono mt-1">
              {total} khóa học · chọn lộ trình phù hợp với bạn
            </p>
          </div>
        </div>
      </FadeInItem>

      {/* Search + Filter */}
      <FadeInItem>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"/>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên, mô tả, tag…"
              className="input-field pl-9 pr-9 w-full"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                aria-label="Xóa tìm kiếm"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-600 hover:text-gray-300 rounded"
              >
                <X size={12}/>
              </button>
            )}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setLevel('')}
              className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition-colors ${
                !level
                  ? 'bg-violet-500/10 border-violet-500/30 text-violet-300'
                  : 'border-white/10 text-gray-500 hover:text-gray-300'
              }`}
            >
              Tất cả
            </button>
            {LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l === level ? '' : l)}
                className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition-colors ${
                  level === l
                    ? 'bg-violet-500/10 border-violet-500/30 text-violet-300'
                    : 'border-white/10 text-gray-500 hover:text-gray-300'
                }`}
              >
                {levelLabels[l]}
              </button>
            ))}
          </div>
        </div>
      </FadeInItem>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-60 rounded-xl"/>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <EmptyView
          icon={<BookOpen size={32}/>}
          title="Không tìm thấy khóa học"
          description={
            hasFilter
              ? 'Thử bỏ bộ lọc hoặc dùng từ khóa khác.'
              : 'Hiện chưa có khóa học nào được công khai.'
          }
        />
      ) : (
        <Stagger
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          delay={0.04}
        >
          {courses.map((course: any) => {
            const thumb = course.thumbnailUrl ?? course.thumbnail;
            return (
              <FadeInItem key={course._id}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  onClick={() => navigate(`/courses/${course._id}`)}
                  className="card overflow-hidden cursor-pointer group hover:border-violet-500/30
                             hover:shadow-xl hover:shadow-violet-900/10 transition-colors"
                >
                  <div className="relative h-36 bg-gradient-to-br from-violet-900/30 to-black overflow-hidden">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={course.title}
                        loading="lazy"
                        className="w-full h-full object-cover opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen size={36} className="text-violet-400/40"/>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"/>
                    <div className="absolute top-2 right-2">
                      <BookmarkButton
                        targetType="COURSE"
                        targetId={course._id}
                        title={course.title}
                        thumbnailUrl={thumb}
                        variant="card"
                      />
                    </div>
                    {course.level && (
                      <div className="absolute bottom-2 left-2">
                        <Badge color={levelColors[course.level as CourseLevel]}>
                          {levelLabels[course.level as CourseLevel]}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-mono font-semibold text-sm text-gray-100 line-clamp-2 group-hover:text-violet-200 transition-colors min-h-[2.5rem]">
                      {course.title}
                    </h3>
                    <p className="text-xs text-gray-600 font-mono line-clamp-2 mt-1.5 mb-3 min-h-[2rem]">
                      {course.description}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-gray-700 font-mono">
                      <span className="flex items-center gap-1">
                        <BookOpen size={10}/>{course.totalLessons ?? course.lessonCount ?? 0} bài
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={10}/>{course.totalEnrollments ?? course.enrollmentCount ?? 0} học viên
                      </span>
                      {course.durationMinutes > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock size={10}/>{course.durationMinutes} phút
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              </FadeInItem>
            );
          })}
        </Stagger>
      )}
    </div>
  );
};
