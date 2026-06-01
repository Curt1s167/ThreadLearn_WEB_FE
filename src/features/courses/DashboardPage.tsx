import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Flame, Star, Trophy, ArrowRight,
  Zap, TrendingUp, Clock, Sparkles, Bot, Bookmark,
} from 'lucide-react';
import { useAuthStore } from '../../store';
import { gamificationService, leaderboardService } from '../../services';
import { enrollmentService } from '../../services/course.service';
import { Card, Badge, Skeleton, Button, Avatar } from '../../components/shared';
import { Stagger, FadeInItem } from '../../components/motion/PageTransition';
import { motion } from 'framer-motion';

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}> = ({ icon, label, value, sub, color }) => (
  <motion.div
    whileHover={{ y: -2 }}
    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    className="card p-4 flex items-start gap-3 hover:border-violet-500/20 transition-colors"
  >
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray-600 font-mono truncate">{label}</p>
      <p className="text-xl font-mono font-bold text-gray-100 mt-0.5">{value}</p>
      {sub && <p className="text-xs text-gray-600 font-mono mt-0.5 truncate">{sub}</p>}
    </div>
  </motion.div>
);

/** Time-aware greeting in VN locale (sáng / chiều / tối). */
function greet(name = '') {
  const h = new Date().getHours();
  if (h < 11) return `Chào buổi sáng, ${name}`;
  if (h < 18) return `Chào buổi chiều, ${name}`;
  return        `Chào buổi tối, ${name}`;
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const firstName = user?.name?.split(' ').slice(-1)[0] ?? 'bạn';

  const { data: stats,         isLoading: statsLoading  } = useQuery({
    queryKey: ['gamification-stats'], queryFn: gamificationService.getStats, enabled: !!user,
  });
  const { data: enrollmentsResp, isLoading: enrollLoading } = useQuery({
    queryKey: ['enrollments', 'me'],  queryFn: enrollmentService.myEnrollments, enabled: !!user,
  });
  const { data: myRank } = useQuery({
    queryKey: ['my-rank'], queryFn: leaderboardService.getMyRank, enabled: !!user,
  });
  const enrollments = enrollmentsResp?.data ?? [];
  const inProgress   = enrollments.filter((e: any) => !e.completed);
  const justFinished = enrollments.filter((e: any) =>  e.completed).slice(0, 3);

  const levelProgress = stats ? (stats.xp % 1000) / 10 : 0;
  const xpToNext      = 1000 - ((stats?.xp ?? 0) % 1000);

  // Personalized action suggestions
  const suggestions: { icon: React.ReactNode; label: string; to: string; tone: string }[] = [];
  if (inProgress.length > 0) {
    suggestions.push({
      icon: <BookOpen size={14}/>,
      label: `Tiếp tục "${(inProgress[0].courseId as any)?.title ?? 'khóa học'}"`,
      to:    `/courses/${(inProgress[0].courseId as any)?._id ?? inProgress[0].courseId}`,
      tone:  'violet',
    });
  } else {
    suggestions.push({ icon: <Sparkles size={14}/>, label: 'Khám phá khóa học mới', to: '/courses', tone: 'violet' });
  }
  suggestions.push({ icon: <Bot size={14}/>,      label: 'Phân tích code với AI',   to: '/ai',          tone: 'emerald' });
  suggestions.push({ icon: <Bookmark size={14}/>, label: 'Xem bookmarks đã lưu',     to: '/bookmarks',   tone: 'amber'   });

  return (
    <Stagger className="flex flex-col gap-6">
      {/* ── Personalized greeting ─────────────────────────────────────────── */}
      <FadeInItem>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar src={user?.avatarUrl} name={user?.name ?? firstName} size="lg"/>
            <div>
              <h1 className="font-mono font-bold text-2xl text-gray-100">
                {greet(firstName)} <span className="text-gradient">👋</span>
              </h1>
              <p className="text-gray-500 font-mono text-xs mt-0.5">
                {new Date().toLocaleDateString('vi-VN', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                })}
                {stats?.streak ? ` · 🔥 ${stats.streak} ngày liên tục` : ''}
              </p>
            </div>
          </div>
          <Button onClick={() => navigate('/courses')}>
            <BookOpen size={14}/> Khám phá khóa học
          </Button>
        </div>
      </FadeInItem>

      {/* ── XP / Level progress ───────────────────────────────────────────── */}
      <FadeInItem>
        <Card className="p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.04] via-transparent to-emerald-500/[0.03] pointer-events-none"/>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
                  <Zap size={16} className="text-violet-300"/>
                </div>
                <div>
                  <p className="text-sm font-mono font-semibold text-gray-100">
                    Level {stats?.level ?? 1}
                    <span className="text-gray-600 ml-2">→ Level {(stats?.level ?? 1) + 1}</span>
                  </p>
                  <p className="text-[11px] text-gray-600 font-mono">
                    {xpToNext} XP nữa để lên cấp
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono text-violet-300 bg-violet-500/10 px-2.5 py-1 rounded-full border border-violet-500/20">
                {(stats?.xp ?? 0).toLocaleString()} XP
              </span>
            </div>
            <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${levelProgress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-violet-600 via-violet-400 to-emerald-400 rounded-full"
              />
            </div>
          </div>
        </Card>
      </FadeInItem>

      {/* ── Stats grid ────────────────────────────────────────────────────── */}
      <FadeInItem>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl"/>)
          ) : (
            <>
              <StatCard
                icon={<Flame  size={16} className="text-amber-400"/>}
                label="Streak"        value={stats?.streak ?? 0}
                sub="ngày liên tục"   color="bg-amber-500/10"/>
              <StatCard
                icon={<Star   size={16} className="text-violet-400"/>}
                label="Tổng XP"       value={(stats?.xp ?? 0).toLocaleString()}
                sub="điểm kinh nghiệm" color="bg-violet-500/10"/>
              <StatCard
                icon={<BookOpen size={16} className="text-emerald-400"/>}
                label="Bài đã học"    value={stats?.totalLessonsCompleted ?? 0}
                sub="bài hoàn thành"  color="bg-emerald-500/10"/>
              <StatCard
                icon={<Trophy size={16} className="text-amber-400"/>}
                label="Xếp hạng"      value={myRank ? `#${myRank.rank}` : '—'}
                sub="trong bảng XH"   color="bg-amber-500/10"/>
            </>
          )}
        </div>
      </FadeInItem>

      {/* ── Suggestions ───────────────────────────────────────────────────── */}
      <FadeInItem>
        <div>
          <p className="font-mono font-semibold text-gray-200 text-sm mb-2">Gợi ý cho bạn</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {suggestions.map((s) => (
              <motion.button
                key={s.to}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(s.to)}
                className="card p-3 flex items-center gap-2.5 text-left hover:border-violet-500/30 transition-colors"
              >
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center bg-${s.tone}-500/10 text-${s.tone}-400`}>
                  {s.icon}
                </span>
                <span className="flex-1 text-xs font-mono text-gray-300 truncate">{s.label}</span>
                <ArrowRight size={11} className="text-gray-700"/>
              </motion.button>
            ))}
          </div>
        </div>
      </FadeInItem>

      {/* ── Active courses ────────────────────────────────────────────────── */}
      <FadeInItem>
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="font-mono font-semibold text-gray-200 text-sm">
              Đang học <span className="text-gray-600 ml-1">({inProgress.length})</span>
            </p>
            <button
              onClick={() => navigate('/courses')}
              className="text-xs text-violet-400 hover:text-violet-300 font-mono flex items-center gap-1 transition-colors"
            >
              Xem tất cả <ArrowRight size={12}/>
            </button>
          </div>

          {enrollLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-16 rounded-xl"/>
              <Skeleton className="h-16 rounded-xl"/>
            </div>
          ) : inProgress.length > 0 ? (
            <Stagger className="flex flex-col gap-2" delay={0.04}>
              {inProgress.slice(0, 4).map((enrollment: any) => {
                const course      = typeof enrollment.courseId === 'object' ? enrollment.courseId : null;
                const courseId    = course?._id ?? enrollment.courseId;
                const courseTitle = course?.title ?? `Course #${String(enrollment.courseId).slice(-6)}`;
                const thumb       = course?.thumbnailUrl;
                return (
                  <FadeInItem key={enrollment._id}>
                    <motion.div
                      whileHover={{ y: -1 }}
                      onClick={() => navigate(`/courses/${courseId}`)}
                      className="card p-3 flex items-center gap-3 hover:border-violet-500/30 transition-colors cursor-pointer"
                    >
                      {thumb
                        ? <img src={thumb} alt="" className="w-11 h-11 rounded-lg object-cover shrink-0"/>
                        : <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                            <BookOpen size={14} className="text-violet-400"/>
                          </div>}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm text-gray-200 font-mono truncate">{courseTitle}</p>
                          <span className="text-xs text-violet-300 font-mono shrink-0">
                            {enrollment.progress}%
                          </span>
                        </div>
                        <div className="h-1 bg-white/[0.04] rounded-full mt-1.5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${enrollment.progress}%` }}
                            transition={{ duration: 0.7, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full"
                          />
                        </div>
                      </div>
                      <ArrowRight size={13} className="text-gray-700"/>
                    </motion.div>
                  </FadeInItem>
                );
              })}
            </Stagger>
          ) : (
            <Card className="p-8 flex flex-col items-center gap-3 text-center">
              <BookOpen size={28} className="text-gray-700"/>
              <div>
                <p className="text-gray-400 font-mono text-sm">Bạn chưa đăng ký khóa học nào</p>
                <p className="text-gray-600 font-mono text-xs mt-1">
                  Khám phá khóa học để bắt đầu hành trình học tập
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate('/courses')}>
                <TrendingUp size={13}/> Khám phá ngay
              </Button>
            </Card>
          )}
        </div>
      </FadeInItem>

      {/* ── Recent completions ────────────────────────────────────────────── */}
      {justFinished.length > 0 && (
        <FadeInItem>
          <div>
            <p className="font-mono font-semibold text-gray-200 text-sm mb-2">
              Hoàn thành gần đây
            </p>
            <div className="flex flex-wrap gap-2">
              {justFinished.map((e: any) => {
                const course = typeof e.courseId === 'object' ? e.courseId : null;
                return (
                  <Badge key={e._id} color="green" className="!text-[11px] py-1 px-2.5">
                    ✓ {course?.title ?? `Course #${String(e.courseId).slice(-6)}`}
                  </Badge>
                );
              })}
            </div>
          </div>
        </FadeInItem>
      )}

      {/* ── Quick actions ─────────────────────────────────────────────────── */}
      <FadeInItem>
        <div>
          <p className="font-mono font-semibold text-gray-200 text-sm mb-3">Truy cập nhanh</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { icon: <Trophy size={16}/>, label: 'Leaderboard', to: '/leaderboard',   color: 'text-amber-400'   },
              { icon: <Zap    size={16}/>, label: 'AI Advisor',  to: '/ai',            color: 'text-violet-400'  },
              { icon: <Clock  size={16}/>, label: 'Lịch sử quiz', to: '/quiz-history',  color: 'text-emerald-400' },
            ].map((item) => (
              <motion.button
                key={item.to}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(item.to)}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]
                           hover:border-violet-500/20 hover:bg-white/[0.05] transition-colors
                           font-mono text-sm text-gray-400 hover:text-gray-200"
              >
                <span className={item.color}>{item.icon}</span>
                {item.label}
              </motion.button>
            ))}
          </div>
        </div>
      </FadeInItem>
    </Stagger>
  );
};
