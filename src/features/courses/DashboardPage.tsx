'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  Code2,
  Flame,
  Play,
  Trophy,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../../store';
import {
  enrollmentsService,
  gamificationService,
  leaderboardService,
  studentsService,
} from '../../services';
import type { Enrollment } from '../../types';
import {
  COURSE_ACCENT_COLORS,
  DemoHeroInk,
  DemoPageRoot,
  DemoPill,
  UI_PLACEHOLDERS,
  formatXp,
} from '../ui-reskin/demo-ui';
import { FALLBACK_COURSES } from '../ui-reskin/demo-fallbacks';

const getCourseId = (enrollment?: Enrollment | null) => {
  if (!enrollment) return '';
  return typeof enrollment.courseId === 'string'
    ? enrollment.courseId
    : enrollment.courseId._id ?? enrollment.courseId.id ?? '';
};

const getCourseTitle = (enrollment: Enrollment) =>
  typeof enrollment.courseId === 'string'
    ? `Course #${enrollment.courseId.slice(-6)}`
    : enrollment.courseId.title ?? `Course #${getCourseId(enrollment).slice(-6)}`;

const getCourseLanguage = (enrollment: Enrollment) =>
  typeof enrollment.courseId === 'string'
    ? 'Course'
    : enrollment.courseId.language ?? 'Course';

const getCourseLevelTone = (
  enrollment: Enrollment
): 'lime' | 'pink' | 'blue' | 'default' => {
  if (typeof enrollment.courseId === 'string') return 'default';
  const level = (enrollment.courseId.level ?? '').toString().toLowerCase();
  if (level.includes('begin')) return 'lime';
  if (level.includes('inter')) return 'pink';
  if (level.includes('adv')) return 'blue';
  return 'default';
};

/**
 * PR4 — layout fidelity to DemoDashboardPage:
 * [progress hero | streak lime] → 3 stat cards → [my courses grid | AI + activity aside]
 * All numbers from API; placeholders only where BE has no field.
 */
export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const router = useRouter();
  const firstName = user?.name?.split(' ')[0] ?? 'learner';

  const { data: stats, isLoading: statsLoading, isError: statsError } = useQuery({
    queryKey: ['gamification-stats'],
    queryFn: gamificationService.getStats,
    enabled: !!user,
  });

  const { data: enrollments, isLoading: enrollLoading, isError: enrollError } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: enrollmentsService.getMyEnrollments,
    enabled: !!user,
  });

  const { data: resume, isLoading: resumeLoading, isError: resumeError } = useQuery({
    queryKey: ['student-resume'],
    queryFn: studentsService.getResume,
    enabled: !!user,
  });

  const { data: myRank, isError: rankError } = useQuery({
    queryKey: ['my-rank'],
    queryFn: leaderboardService.getMyRank,
    enabled: !!user,
  });

  const streak = stats?.currentStreak ?? stats?.streak ?? 0;
  const progressPercent = stats ? (stats.xp % 1000) / 10 : 0;
  const resumeCourseId = getCourseId(resume);
  const resumeTarget = resume?.lastLessonId
    ? `/lessons/${resume.lastLessonId}`
    : resumeCourseId
      ? `/courses/${resumeCourseId}`
      : '/courses';
  const resumeProgress = resume?.progressPercent ?? resume?.progress ?? 0;
  const resumeCoursePath = resumeCourseId ? `/courses/${resumeCourseId}` : '/courses';

  useEffect(() => {
    if (statsError) toast.error('Failed to load learning stats');
    if (enrollError) toast.error('Failed to load enrollments');
    if (resumeError) toast.error('Failed to load resume target');
    if (rankError) toast.error('Failed to load leaderboard rank');
  }, [enrollError, rankError, resumeError, statsError]);

  return (
    <DemoPageRoot>
      <section className="grid gap-5 lg:grid-cols-[1.45fr_0.55fr]">
        <DemoHeroInk>
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">Your progress</p>
          <h1 className="mt-3 text-4xl font-light tracking-tight">
            Continue learning, {firstName}.
          </h1>
          <p className="mt-4 max-w-2xl text-white/60">
            {resumeLoading
              ? 'Loading your resume target…'
              : resume
                ? `${getCourseTitle(resume)} · ${resumeProgress}% complete`
                : 'Pick a course to build a resume target and streak.'}
          </p>
          <div className="mt-8 h-2 rounded-full bg-white/10">
            <div
              className="h-2 rounded-full bg-[#d9f99d] transition-all duration-300"
              style={{ width: `${Math.min(100, resumeProgress || progressPercent)}%` }}
            />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => router.push(resumeTarget)}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90"
            >
              Resume lesson <Play size={16} />
            </button>
            <Link
              href={resumeCoursePath}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Course detail <ArrowRight size={16} />
            </Link>
          </div>
        </DemoHeroInk>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="dashboard-streak-panel rounded-[1.5rem] p-6"
        >
          <Flame size={26} className="dashboard-streak-icon" />
          <p className="dashboard-streak-value mt-5 text-4xl font-semibold">
            {statsLoading ? '…' : `${streak} day${streak === 1 ? '' : 's'}`}
          </p>
          <p className="dashboard-streak-copy mt-2 text-sm">
            Learning streak. Keep one short lesson per day.
          </p>
          <div className="mt-6 grid grid-cols-7 gap-1">
            {UI_PLACEHOLDERS.weekdays.map((day, index) => (
              <div
                key={`${day}-${index}`}
                className={`dashboard-streak-day grid aspect-square place-items-center rounded text-xs ${
                  index < Math.min(streak, 7)
                    ? 'dashboard-streak-day-active'
                    : 'dashboard-streak-day-idle'
                }`}
              >
                {day}
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {([
          {
            label: 'Level',
            value: statsLoading ? '…' : String(stats?.level ?? 1),
            Icon: Trophy,
            sub: myRank ? `Rank #${myRank.rank}` : '',
          },
          {
            label: 'Total XP',
            value: statsLoading ? '…' : formatXp(stats?.xp ?? 0).replace(' XP', ''),
            Icon: Zap,
            sub: '',
          },
          {
            label: 'Completed lessons',
            value: statsLoading ? '…' : String(stats?.totalLessonsCompleted ?? 0),
            Icon: CheckCircle2,
            sub: '',
          },
        ]).map(({ label, value, Icon, sub }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.05 * i }}
            className="rounded-lg border border-black/10 bg-white p-5"
          >
            <Icon size={22} />
            <p className="mt-4 text-3xl font-semibold">{value}</p>
            <p className="mt-1 text-sm text-black/50">{label}</p>
            {sub ? <p className="mt-1 text-xs text-black/40">{sub}</p> : null}
          </motion.div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-black">My courses</h2>
            <Link href="/courses" className="text-sm font-medium text-black/55 hover:text-black">
              Browse all
            </Link>
          </div>

          {enrollLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="aspect-video animate-pulse rounded-lg border border-black/10 bg-white" />
              <div className="aspect-video animate-pulse rounded-lg border border-black/10 bg-white" />
            </div>
          ) : enrollments && enrollments.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {enrollments.slice(0, 2).map((enrollment, index) => {
                const courseId = getCourseId(enrollment);
                const pct = enrollment.progressPercent ?? enrollment.progress ?? 0;
                const tone = getCourseLevelTone(enrollment);
                const accent = COURSE_ACCENT_COLORS[index % COURSE_ACCENT_COLORS.length];
                return (
                  <motion.div
                    key={enrollment._id}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.18 }}
                  >
                    <button
                      type="button"
                      onClick={() => router.push(`/courses/${courseId}`)}
                      className="group block w-full overflow-hidden rounded-lg border border-black/10 bg-white text-left outline-none focus-visible:ring-2 focus-visible:ring-black/25"
                    >
                      {/* Demo CourseCard-style media block */}
                      <div className={`aspect-video ${accent} p-5`}>
                        <div className="flex h-full flex-col justify-between rounded-md bg-white/65 p-4">
                          <div className="flex items-center justify-between">
                            <Code2 size={26} />
                            <DemoPill tone={tone === 'default' ? 'default' : tone}>
                              {typeof enrollment.courseId === 'string'
                                ? `${pct}%`
                                : (enrollment.courseId.level ?? `${pct}%`)}
                            </DemoPill>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-black/45">
                              {getCourseLanguage(enrollment)}
                            </p>
                            <p className="mt-1 text-lg font-semibold text-black line-clamp-2">
                              {getCourseTitle(enrollment)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-black/5 px-4 py-3">
                        <div className="flex items-center justify-between text-xs text-black/50">
                          <span className="inline-flex items-center gap-1">
                            <BookOpen size={12} /> Progress
                          </span>
                          <span className="font-medium text-black">{pct}%</span>
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-black/5">
                          <div
                            className="h-1.5 rounded-full bg-black transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <>
              <div className="dashboard-accent-note mb-4 rounded-lg p-4 text-sm">
                Mock course progress preview from the demo flow. Enrollments from BE will replace these cards.
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {FALLBACK_COURSES.slice(0, 2).map((course, index) => {
                  const accent = COURSE_ACCENT_COLORS[index % COURSE_ACCENT_COLORS.length];
                  const pct = index === 0 ? 68 : 24;
                  return (
                    <motion.div
                      key={course._id}
                      whileHover={{ y: -4 }}
                      transition={{ duration: 0.18 }}
                    >
                      <button
                        type="button"
                        onClick={() => router.push('/courses')}
                        className="group block w-full overflow-hidden rounded-lg border border-black/10 bg-white text-left outline-none focus-visible:ring-2 focus-visible:ring-black/25"
                      >
                        <div className={`aspect-video ${accent} p-5`}>
                          <div className="flex h-full flex-col justify-between rounded-md bg-white/65 p-4">
                            <div className="flex items-center justify-between">
                              <Code2 size={26} />
                              <DemoPill tone={index === 0 ? 'lime' : 'pink'}>
                                {course.level.toLowerCase()}
                              </DemoPill>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-[0.18em] text-black/45">
                                {course.language}
                              </p>
                              <p className="mt-1 text-lg font-semibold text-black line-clamp-2">
                                {course.title}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="border-t border-black/5 px-4 py-3">
                          <div className="flex items-center justify-between text-xs text-black/50">
                            <span className="inline-flex items-center gap-1">
                              <BookOpen size={12} /> Mock progress
                            </span>
                            <span className="font-medium text-black">{pct}%</span>
                          </div>
                          <div className="mt-2 h-1.5 rounded-full bg-black/5">
                            <div className="h-1.5 rounded-full bg-black" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-black/10 bg-white p-5">
            <div className="flex items-center gap-2">
              <Brain size={19} />
              <h3 className="font-semibold text-black">AI Coach</h3>
            </div>
            <p className="mt-3 text-sm text-black/60">{UI_PLACEHOLDERS.aiCoachUsageLine}</p>
            <Link
              href="/ai"
              className="mt-4 inline-flex rounded-full bg-black px-4 py-2 text-sm font-medium text-white"
            >
              Open AI Coach
            </Link>
          </div>
          <div className="rounded-lg border border-black/10 bg-white p-5">
            <h3 className="font-semibold text-black">Recent activity</h3>
            <div className="mt-4 space-y-3">
              {UI_PLACEHOLDERS.recentActivityFallback.map((item) => (
                <div key={item} className="flex gap-3 text-sm text-black/60">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-black" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </DemoPageRoot>
  );
};
