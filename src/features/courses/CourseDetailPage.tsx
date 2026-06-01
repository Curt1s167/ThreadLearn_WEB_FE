import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, BookOpen, Clock, Users, Lock, Play, GraduationCap, MessageSquare,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, Button, Badge, Skeleton } from '../../components/shared';
import { useAuthStore } from '../../store';
import { useCourseDetail, useEnroll } from '../../hooks/useCourses';
import { BookmarkButton } from '../bookmark';
import { CommentPanel } from '../comment';

type Tab = 'overview' | 'lessons' | 'discussion';

const levelColor: Record<string, 'green' | 'amber' | 'red'> = {
  BEGINNER: 'green', INTERMEDIATE: 'amber', ADVANCED: 'red',
};

export const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [tab, setTab] = useState<Tab>('overview');

  const { data: resp, isLoading } = useCourseDetail(id ?? '');
  const detail = resp?.data;
  const { mutate: enroll, isPending: enrolling } = useEnroll();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-40" />
        <Skeleton className="h-60" />
      </div>
    );
  }
  if (!detail) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500 font-mono">Không tìm thấy khóa học.</p>
      </Card>
    );
  }

  const { course, lessons, isEnrolled, progress } = detail;
  const canEnroll = isAuthenticated && user?.role === 'STUDENT' && !isEnrolled;

  const handleEnroll = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    enroll(course._id);
  };

  const handleOpenLesson = (lessonId: string, isLocked: boolean, isFreePreview: boolean) => {
    if (isLocked && user?.role !== 'ADMIN') return;
    if (!isEnrolled && !isFreePreview && user?.role !== 'ADMIN') return;
    navigate(`/lessons/${lessonId}`);
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-ghost shrink-0">
          <ArrowLeft size={14} />
        </button>
        <h1 className="font-mono font-bold text-2xl text-gray-100 truncate flex-1">
          {course.title}
        </h1>
        <BookmarkButton
          targetType="COURSE"
          targetId={course._id}
          title={course.title}
          thumbnailUrl={course.thumbnailUrl}
        />
      </div>

      {/* Hero */}
      <Card className="p-5">
        <div className="flex flex-col md:flex-row gap-5">
          {course.thumbnailUrl && (
            <div className="md:w-64 shrink-0 aspect-video rounded-lg overflow-hidden bg-black">
              <img src={course.thumbnailUrl} alt={course.title}
                   className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1 flex flex-col gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge color={levelColor[course.level ?? 'BEGINNER']}>
                {course.level ?? 'BEGINNER'}
              </Badge>
              {course.category && <Badge color="purple">{course.category}</Badge>}
              {course.tags?.slice(0, 3).map((t: string) => (
                <span key={t} className="text-[10px] text-gray-600 font-mono">#{t}</span>
              ))}
            </div>

            <p className="text-sm text-gray-400 font-mono leading-relaxed line-clamp-4">
              {course.description}
            </p>

            <div className="flex items-center gap-4 text-xs text-gray-600 font-mono">
              <span className="flex items-center gap-1">
                <BookOpen size={12} /> {course.totalLessons ?? lessons.length} bài học
              </span>
              <span className="flex items-center gap-1">
                <Clock size={12} /> {course.durationMinutes ?? 0} phút
              </span>
              <span className="flex items-center gap-1">
                <Users size={12} /> {course.totalEnrollments ?? 0} học viên
              </span>
            </div>

            {isEnrolled ? (
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-white/[0.04] rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500 transition-all"
                       style={{ width: `${progress}%` }} />
                </div>
                <span className="text-xs font-mono text-violet-300">{progress}%</span>
              </div>
            ) : canEnroll ? (
              <Button onClick={handleEnroll} loading={enrolling} className="self-start">
                <GraduationCap size={14} /> Đăng ký khóa học
              </Button>
            ) : !isAuthenticated ? (
              <Button onClick={() => navigate('/login')} variant="outline" className="self-start">
                Đăng nhập để học
              </Button>
            ) : null}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/[0.06]">
        {([
          { k: 'overview',   label: 'Tổng quan' },
          { k: 'lessons',    label: `Nội dung (${lessons.length})` },
          { k: 'discussion', label: 'Thảo luận', icon: <MessageSquare size={11} /> },
        ] as { k: Tab; label: string; icon?: React.ReactNode }[]).map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={`px-3 py-1.5 text-xs font-mono rounded-t-lg transition-colors flex items-center gap-1.5 ${
              tab === t.k
                ? 'text-violet-300 bg-violet-500/10 border border-b-0 border-violet-500/20'
                : 'text-gray-600 hover:text-gray-400'
            }`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <Card className="p-5 prose prose-invert prose-sm max-w-none font-mono text-gray-300">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{course.description}</ReactMarkdown>
        </Card>
      )}

      {tab === 'lessons' && (
        <div className="flex flex-col gap-2">
          {lessons.length === 0 && (
            <Card className="p-6 text-center text-gray-500 font-mono text-sm">
              Khóa học chưa có bài học nào.
            </Card>
          )}
          {lessons.map((l: any, idx: number) => {
            const locked   = l.isLocked && user?.role !== 'ADMIN';
            const isLocked = locked || (!isEnrolled && !l.isFreePreview && user?.role !== 'ADMIN');
            return (
              <button
                key={l._id}
                disabled={isLocked}
                onClick={() => handleOpenLesson(l._id, l.isLocked, l.isFreePreview)}
                className={`group flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                  isLocked
                    ? 'border-white/[0.04] bg-white/[0.02] opacity-60 cursor-not-allowed'
                    : 'border-white/[0.06] hover:border-violet-500/30 hover:bg-violet-500/[0.03]'
                }`}
              >
                <span className="w-7 h-7 rounded-full bg-white/[0.04] flex items-center justify-center text-[11px] font-mono text-gray-500">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono text-gray-200 truncate">{l.title}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-[10px] text-gray-700 font-mono">
                    {l.durationMinutes > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock size={9}/>{l.durationMinutes} phút
                      </span>
                    )}
                    {l.isFreePreview && <Badge color="green">Free</Badge>}
                  </div>
                </div>
                {isLocked ? <Lock size={13} className="text-gray-700"/>
                          : <Play size={13} className="text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity"/>}
              </button>
            );
          })}
        </div>
      )}

      {tab === 'discussion' && (
        isEnrolled || user?.role === 'ADMIN' ? (
          <Card className="p-4">
            <CommentPanel targetType="COURSE" targetId={course._id} />
          </Card>
        ) : (
          <Card className="p-6 text-center">
            <p className="text-sm font-mono text-gray-500">
              Đăng ký khóa học để tham gia thảo luận.
            </p>
            {canEnroll && (
              <Button onClick={handleEnroll} className="mt-3 mx-auto">
                <GraduationCap size={14}/> Đăng ký ngay
              </Button>
            )}
          </Card>
        )
      )}
    </div>
  );
};
