import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Flame, Star, Trophy, ArrowRight,
  Zap, TrendingUp, Clock,
} from 'lucide-react';
import { useAuthStore } from '../../store';
import { gamificationService, enrollmentsService, leaderboardService } from '../../services';
import { Card, Badge, Skeleton, Button } from '../../components/shared';

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}> = ({ icon, label, value, sub, color }) => (
  <Card className="p-4 flex items-start gap-3">
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-xs text-gray-600 font-mono">{label}</p>
      <p className="text-xl font-mono font-bold text-gray-100 mt-0.5">{value}</p>
      {sub && <p className="text-xs text-gray-600 font-mono mt-0.5">{sub}</p>}
    </div>
  </Card>
);

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['gamification-stats'],
    queryFn: gamificationService.getStats,
    enabled: !!user,
  });

  const { data: enrollments, isLoading: enrollLoading } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: enrollmentsService.getMyEnrollments,
    enabled: !!user,
  });

  const { data: myRank } = useQuery({
    queryKey: ['my-rank'],
    queryFn: leaderboardService.getMyRank,
    enabled: !!user,
  });

  const levelProgress = stats ? (stats.xp % 1000) / 10 : 0;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-mono font-bold text-2xl text-gray-100">
            gm, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-600 font-mono text-sm mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Button onClick={() => navigate('/courses')}>
          <BookOpen size={14} />
          Browse courses
        </Button>
      </div>

      {/* XP Progress bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Zap size={14} className="text-violet-400" />
            </div>
            <div>
              <span className="text-sm font-mono font-semibold text-gray-200">
                Level {stats?.level ?? 1}
              </span>
              <span className="text-gray-600 font-mono text-xs ml-2">
                → Level {(stats?.level ?? 1) + 1}
              </span>
            </div>
          </div>
          <span className="text-xs font-mono text-gray-500">
            {stats?.xp ?? 0} XP
          </span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full transition-all duration-700"
            style={{ width: `${levelProgress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] text-gray-700 font-mono">{levelProgress.toFixed(0)}%</span>
          <span className="text-[10px] text-gray-700 font-mono">
            {1000 - (stats?.xp ?? 0) % 1000} XP to next level
          </span>
        </div>
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statsLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </>
        ) : (
          <>
            <StatCard
              icon={<Flame size={16} className="text-amber-400" />}
              label="Day streak"
              value={stats?.streak ?? 0}
              sub="days in a row"
              color="bg-amber-500/10"
            />
            <StatCard
              icon={<Star size={16} className="text-violet-400" />}
              label="Total XP"
              value={(stats?.xp ?? 0).toLocaleString()}
              sub="experience points"
              color="bg-violet-500/10"
            />
            <StatCard
              icon={<BookOpen size={16} className="text-emerald-400" />}
              label="Lessons done"
              value={stats?.totalLessonsCompleted ?? 0}
              sub="completed"
              color="bg-emerald-500/10"
            />
            <StatCard
              icon={<Trophy size={16} className="text-amber-400" />}
              label="Rank"
              value={myRank ? `#${myRank.rank}` : '—'}
              sub="on leaderboard"
              color="bg-amber-500/10"
            />
          </>
        )}
      </div>

      {/* Active courses */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-mono font-semibold text-gray-200 text-sm">Active courses</h2>
          <button
            onClick={() => navigate('/courses')}
            className="text-xs text-violet-400 hover:text-violet-300 font-mono flex items-center gap-1 transition-colors"
          >
            View all <ArrowRight size={12} />
          </button>
        </div>

        {enrollLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
        ) : enrollments && enrollments.length > 0 ? (
          <div className="flex flex-col gap-2">
            {enrollments.slice(0, 4).map((enrollment) => (
              <Card key={enrollment._id} className="p-3 flex items-center gap-3 hover:border-violet-500/20 transition-all cursor-pointer" onClick={() => navigate(`/courses/${enrollment.courseId}`)}>
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                  <BookOpen size={14} className="text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-gray-200 font-mono truncate">
                      Course #{enrollment.courseId.slice(-6)}
                    </p>
                    <span className="text-xs text-gray-600 font-mono shrink-0">
                      {enrollment.progress}%
                    </span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="h-full bg-violet-600 rounded-full"
                      style={{ width: `${enrollment.progress}%` }}
                    />
                  </div>
                </div>
                {enrollment.completed && (
                  <Badge color="green">✓</Badge>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 flex flex-col items-center gap-3 text-center">
            <BookOpen size={28} className="text-gray-700" />
            <div>
              <p className="text-gray-400 font-mono text-sm">No active courses</p>
              <p className="text-gray-600 font-mono text-xs mt-1">
                Enroll in a course to start learning
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate('/courses')}>
              <TrendingUp size={13} />
              Explore courses
            </Button>
          </Card>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="font-mono font-semibold text-gray-200 text-sm mb-3">Quick actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { icon: <Trophy size={16} />, label: 'Leaderboard', to: '/leaderboard', color: 'text-amber-400' },
            { icon: <Zap size={16} />, label: 'AI Advisor', to: '/ai', color: 'text-violet-400' },
            { icon: <Clock size={16} />, label: 'Quiz history', to: '/quiz/history', color: 'text-emerald-400' },
          ].map((item) => (
            <button
              key={item.to}
              onClick={() => navigate(item.to)}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-violet-500/20 hover:bg-white/[0.05] transition-all font-mono text-sm text-gray-400 hover:text-gray-200"
            >
              <span className={item.color}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
