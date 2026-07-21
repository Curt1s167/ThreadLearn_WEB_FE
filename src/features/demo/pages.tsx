'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Award,
  Bell,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock,
  Code2,
  Flame,
  Lock,
  MessageCircle,
  Play,
  Search,
  Star,
  Trophy,
  Users,
  User,
  Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store';
import { BrandLogo } from '@/components/shared/BrandLogo';
import heroSrc from '@/assets/hero.png';
import { demoActivity, demoCourses, demoStats, demoUser, findCourse, findLesson, type DemoCourse } from './demo-data';

const techBrands = ['JavaScript', 'Node.js', 'React', 'MongoDB', 'Redis', 'Docker', 'Jest', 'Worker Threads'];

function Pill({ children, tone = 'default' }: { children: React.ReactNode; tone?: 'default' | 'lime' | 'pink' | 'blue' }) {
  const tones = {
    default: 'bg-black text-white',
    lime: 'bg-[#d9f99d] text-black',
    pink: 'bg-[#f5d0fe] text-black',
    blue: 'bg-[#bfdbfe] text-black',
  };
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

function PublicNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-black/10 bg-white/82 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 gap-3">
        <Link href="/" className="flex items-center min-w-0" aria-label="ThreadLearn home">
          {/* Full wordmark on sm+; mark-only on very small screens to avoid squeeze */}
          <span className="hidden sm:inline-flex">
            <BrandLogo variant="full" size="md" priority />
          </span>
          <span className="inline-flex sm:hidden">
            <BrandLogo variant="mark" size="md" priority />
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-black/60 md:flex">
          <Link href="/courses" className="hover:text-black">Courses</Link>
          <Link href="/dashboard" className="hover:text-black">Dashboard</Link>
          <Link href="/ai" className="hover:text-black">AI Coach</Link>
        </nav>
        <Link href="/login" className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white shrink-0">
          Demo login
        </Link>
      </div>
    </header>
  );
}

function CourseCard({ course }: { course: DemoCourse }) {
  const tone = course.level === 'beginner' ? 'lime' : course.level === 'intermediate' ? 'pink' : 'blue';

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.18 }}>
      <Link href={`/courses/${course.slug}`} className="group block overflow-hidden rounded-lg border border-black/10 bg-white">
        <div className={`aspect-video ${course.color} p-5`}>
          <div className="flex h-full flex-col justify-between rounded-md bg-white/65 p-4">
            <div className="flex items-center justify-between">
              <Code2 size={26} />
              <Pill tone={tone}>{course.level}</Pill>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-black/45">{course.language}</p>
              <p className="mt-1 text-lg font-semibold">{course.title}</p>
            </div>
          </div>
        </div>
        <div className="p-5">
          <p className="line-clamp-2 min-h-11 text-sm text-black/60">{course.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {course.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded bg-black/[0.04] px-2 py-1 text-xs text-black/55">#{tag}</span>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-black/10 pt-4 text-xs text-black/50">
            <span className="flex items-center gap-1"><Clock size={13} />{course.duration}</span>
            <span className="flex items-center gap-1"><Users size={13} />{course.students.toLocaleString()}</span>
            <span className="flex items-center gap-1"><Star size={13} className="fill-yellow-400 text-yellow-400" />{course.rating}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function DemoIDEPanel({ compact = false }: { compact?: boolean }) {
  const [code, setCode] = useState(`let seats = 1;

async function reserveSeat(userId) {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return { userId, ok: true };
}

async function enroll(userId) {
  if (seats <= 0) return false;
  await reserveSeat(userId);
  seats -= 1;
  return true;
}

Promise.all([enroll('an'), enroll('binh')])
  .then(console.log);`);
  const [ran, setRan] = useState(false);

  const output = ran
    ? [
        '> node playground.js',
        "[ true, true ]",
        'Race warning: both users passed the capacity check before seats was decremented.',
        'Test 1 capacity invariant: failed',
        'Test 2 async function resolves: passed',
      ]
    : ['Click Run to execute the mock playground.'];

  return (
    <div className={`grid gap-4 ${compact ? '' : 'xl:grid-cols-[1fr_360px]'}`}>
      <section className="overflow-hidden rounded-lg border border-black/10 bg-[#111827] text-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-white/35">ThreadLearn IDE</p>
            <p className="font-semibold">playground.js</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/70">Format</button>
            <button
              onClick={() => setRan(true)}
              className="inline-flex items-center gap-2 rounded-full bg-[#d9f99d] px-4 py-2 text-sm font-medium text-black"
            >
              <Play size={15} />
              Run
            </button>
          </div>
        </div>
        <textarea
          value={code}
          onChange={(event) => setCode(event.target.value)}
          spellCheck={false}
          className={`${compact ? 'min-h-72' : 'min-h-[520px]'} w-full resize-none bg-[#111827] p-5 font-mono text-sm leading-6 text-[#d9f99d] outline-none`}
        />
      </section>

      <aside className="space-y-4">
        <div className="rounded-lg border border-black/10 bg-white p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Console output</h3>
            <span className={`rounded-full px-2 py-1 text-xs ${ran ? 'bg-[#fecaca] text-[#7f1d1d]' : 'bg-black/[0.05] text-black/45'}`}>
              {ran ? '1 failed' : 'idle'}
            </span>
          </div>
          <pre className="mt-4 min-h-40 whitespace-pre-wrap rounded-lg bg-black p-4 font-mono text-xs leading-6 text-[#d9f99d]">
            {output.join('\n')}
          </pre>
        </div>
        <div className="rounded-lg bg-[#d9f99d] p-5">
          <Brain size={20} />
          <h3 className="mt-3 font-semibold">AI code review</h3>
          <p className="mt-2 text-sm text-black/65">
            The check `seats &lt;= 0` and the write `seats -= 1` are separated by an awaited call. Use a lock, transaction, or atomic conditional update.
          </p>
        </div>
        <div className="rounded-lg border border-black/10 bg-white p-5">
          <h3 className="font-semibold">Test cases</h3>
          <div className="mt-4 space-y-3 text-sm">
            {[
              ['Capacity cannot go below zero', ran ? 'failed' : 'pending'],
              ['Returns boolean result', ran ? 'passed' : 'pending'],
              ['Handles rejected reservation', 'pending'],
            ].map(([name, status]) => (
              <div key={name} className="flex items-center justify-between gap-3">
                <span>{name}</span>
                <span className={`rounded-full px-2 py-1 text-xs ${
                  status === 'passed' ? 'bg-[#d9f99d]' : status === 'failed' ? 'bg-[#fecaca] text-[#7f1d1d]' : 'bg-black/[0.05] text-black/45'
                }`}>
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

export function DemoLandingPage() {
  return (
    <div className="min-h-screen bg-white text-black">
      <PublicNav />
      <div className="overflow-hidden bg-black py-2 text-white">
        <div className="flex w-max animate-marquee gap-10 whitespace-nowrap text-xs uppercase tracking-[0.2em] text-white/65">
          {[...techBrands, ...techBrands, ...techBrands].map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}
        </div>
      </div>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
        <div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-7 inline-flex items-center gap-2 rounded-full bg-[#f5d0fe] px-4 py-2">
            <Zap size={15} />
            <span className="text-xs font-semibold uppercase tracking-[0.16em]">AI-powered concurrency learning</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="max-w-4xl text-5xl font-light leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
            Master async patterns and race conditions with a real learning flow.
          </motion.h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-black/60">
            Learn event loop, Worker Threads, shared state, and backend concurrency through lessons, code practice, notes, bookmarks, and AI review.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-6 py-3 font-medium text-white">
              Start demo flow <ArrowRight size={18} />
            </Link>
            <Link href="/courses" className="inline-flex items-center justify-center rounded-full border border-black/15 px-6 py-3 font-medium">
              Browse courses
            </Link>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-5 border-t border-black/10 pt-8 sm:grid-cols-4">
            {demoStats.map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-semibold">{stat.value}</p>
                <p className="mt-1 text-xs text-black/50">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.12 }} className="relative">
          <div className="absolute -left-5 top-8 z-10 rounded-lg bg-[#d9f99d] p-4 shadow-xl">
            <p className="text-xs uppercase tracking-[0.18em] text-black/50">Current lesson</p>
            <p className="mt-1 font-semibold">Race condition checklist</p>
          </div>
          <div className="overflow-hidden rounded-lg border border-black/10 bg-[#f7f4ee] p-4 shadow-2xl">
            <Image src={heroSrc} alt="ThreadLearn interactive lesson preview" priority className="h-auto w-full rounded-md object-cover" />
            <div className="grid gap-3 pt-4 sm:grid-cols-3">
              {['Lesson', 'IDE', 'AI Review'].map((item) => (
                <div key={item} className="rounded-md bg-white p-3 text-sm font-medium">{item}</div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20">
        <div className="rounded-lg bg-[#d9f99d] p-7 sm:p-10">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-black/50">Presentation-ready flow</p>
              <h2 className="mt-2 text-3xl font-light sm:text-4xl">A complete student journey, already in Next.</h2>
            </div>
            <Link href="/login" className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-medium text-white">
              Try the flow <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              ['1', 'Landing page', 'Unified entry point for the product.'],
              ['2', 'Mock login', 'No backend dependency for demo.'],
              ['3', 'Course path', 'Browse, inspect, and continue lessons.'],
              ['4', 'Lesson room', 'Content, code, notes, comments, AI hints.'],
            ].map(([step, title, text]) => (
              <div key={step} className="rounded-lg bg-white/68 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-black/45">Step {step}</p>
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-black/60">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export function DemoLoginPage() {
  const router = useRouter();
  const { setAuth, setStats } = useAuthStore();

  const login = () => {
    setAuth(demoUser, 'demo-access-token', 'demo-refresh-token');
    setStats({
      userId: demoUser._id,
      xp: 1840,
      level: 7,
      streak: 5,
      totalLessonsCompleted: 12,
      totalQuizzesPassed: 6,
    });
    router.replace('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#f7f4ee] text-black">
      <PublicNav />
      <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <section>
          <Pill tone="pink">Demo account</Pill>
          <h1 className="mt-5 text-5xl font-light tracking-tight">Sign in without waiting for backend auth.</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-black/60">
            For presentation, this mock account unlocks the same student flow: dashboard, courses, lesson viewer, notes, comments, bookmarks, and AI coach preview.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {['Student role', 'Free plan', 'Local state'].map((item) => <div key={item} className="rounded-lg bg-white p-4 text-sm font-medium">{item}</div>)}
          </div>
        </section>

        <section className="rounded-lg border border-black/10 bg-white p-6 shadow-xl">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.18em] text-black/45">ThreadLearn</p>
            <h2 className="mt-2 text-2xl font-semibold">Welcome back</h2>
          </div>
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium">Email</span>
              <input value={demoUser.email} readOnly className="mt-2 w-full rounded-lg border border-black/10 bg-[#f7f4ee] px-4 py-3 text-sm outline-none" />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Password</span>
              <input value="demo-password" readOnly type="password" className="mt-2 w-full rounded-lg border border-black/10 bg-[#f7f4ee] px-4 py-3 text-sm outline-none" />
            </label>
            <button onClick={login} className="flex w-full items-center justify-center gap-2 rounded-full bg-black px-5 py-3 font-medium text-white">
              Continue as student <ArrowRight size={18} />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export function DemoDashboardPage() {
  const nextCourse = demoCourses[0];
  return (
    <div className="space-y-6">
      <section className="grid gap-5 lg:grid-cols-[1.45fr_0.55fr]">
        <div className="rounded-lg bg-[#111827] p-6 text-white sm:p-8">
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">Your progress</p>
          <h1 className="mt-3 text-4xl font-light">Continue learning concurrency, Minh Anh.</h1>
          <p className="mt-4 max-w-2xl text-white/60">You are 2 lessons away from finishing the JavaScript concurrency foundations module.</p>
          <div className="mt-8 h-2 rounded-full bg-white/10">
            <div className="h-2 rounded-full bg-[#d9f99d]" style={{ width: `${nextCourse.progress}%` }} />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={`/lessons/${nextCourse.lessons[1].id}`} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-black">
              Resume lesson <Play size={16} />
            </Link>
            <Link href={`/courses/${nextCourse.slug}`} className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-medium text-white">
              Course detail <ArrowRight size={16} />
            </Link>
          </div>
        </div>
        <div className="rounded-lg bg-[#d9f99d] p-6">
          <Flame size={26} />
          <p className="mt-5 text-4xl font-semibold">5 days</p>
          <p className="mt-2 text-sm text-black/60">Learning streak. Keep one short lesson per day.</p>
          <div className="mt-6 grid grid-cols-7 gap-1">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
              <div key={`${day}-${index}`} className={`grid aspect-square place-items-center rounded ${index < 5 ? 'bg-black text-white' : 'bg-white/60 text-black/35'} text-xs`}>
                {day}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {[
          ['Level', '7', Trophy],
          ['Total XP', '1,840', Zap],
          ['Completed lessons', '12', CheckCircle2],
        ].map(([label, value, Icon]) => (
          <div key={String(label)} className="rounded-lg border border-black/10 bg-white p-5">
            <Icon size={22} />
            <p className="mt-4 text-3xl font-semibold">{value as string}</p>
            <p className="mt-1 text-sm text-black/50">{label as string}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">My courses</h2>
            <Link href="/courses" className="text-sm font-medium text-black/55 hover:text-black">Browse all</Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {demoCourses.slice(0, 2).map((course) => <CourseCard key={course.id} course={course} />)}
          </div>
        </div>
        <aside className="space-y-4">
          <div className="rounded-lg border border-black/10 bg-white p-5">
            <div className="flex items-center gap-2">
              <Brain size={19} />
              <h3 className="font-semibold">AI Coach</h3>
            </div>
            <p className="mt-3 text-sm text-black/60">3 of 5 free reviews used today. Try a race condition scan in the lesson room.</p>
            <Link href="/ai" className="mt-4 inline-flex rounded-full bg-black px-4 py-2 text-sm font-medium text-white">Open AI Coach</Link>
          </div>
          <div className="rounded-lg border border-black/10 bg-white p-5">
            <h3 className="font-semibold">Recent activity</h3>
            <div className="mt-4 space-y-3">
              {demoActivity.map((item) => (
                <div key={item} className="flex gap-3 text-sm text-black/60">
                  <span className="mt-1 h-2 w-2 rounded-full bg-black" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

export function DemoCoursesPage() {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return demoCourses;
    return demoCourses.filter((course) =>
      [course.title, course.description, course.level, course.language, ...course.tags].some((item) => item.toLowerCase().includes(q)),
    );
  }, [query]);

  return (
    <div>
      <section className="mb-8 rounded-lg bg-white p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-black/45">Curriculum</p>
        <div className="mt-3 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-4xl font-light">All courses</h1>
            <p className="mt-3 max-w-2xl text-black/60">A focused path for async programming, concurrency bugs, and production-safe backend patterns.</p>
          </div>
          <label className="flex min-w-0 items-center gap-2 rounded-full border border-black/10 bg-[#f7f4ee] px-4 py-3 text-sm lg:w-80">
            <Search size={16} className="text-black/40" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search courses..." className="min-w-0 flex-1 bg-transparent outline-none" />
          </label>
        </div>
      </section>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((course) => <CourseCard key={course.id} course={course} />)}
      </div>
    </div>
  );
}

export function DemoCourseDetailPage() {
  const params = useParams<{ courseId: string }>();
  const course = findCourse(params.courseId);
  const currentLesson = course.lessons.find((lesson) => lesson.status === 'current') ?? course.lessons[0];

  return (
    <div className="space-y-6">
      <section className={`${course.color} rounded-lg p-6 sm:p-8`}>
        <div className="grid gap-7 lg:grid-cols-[1fr_340px] lg:items-end">
          <div>
            <div className="mb-5 flex flex-wrap gap-2">
              <Pill>{course.level}</Pill>
              <Pill tone="blue">{course.language}</Pill>
            </div>
            <h1 className="max-w-4xl text-4xl font-light tracking-tight sm:text-5xl">{course.title}</h1>
            <p className="mt-5 max-w-2xl text-black/65">{course.description}</p>
          </div>
          <div className="rounded-lg bg-white/72 p-5">
            <p className="text-sm text-black/55">Course progress</p>
            <p className="mt-2 text-4xl font-semibold">{course.progress}%</p>
            <div className="mt-4 h-2 rounded-full bg-black/10">
              <div className="h-2 rounded-full bg-black" style={{ width: `${course.progress}%` }} />
            </div>
            <Link href={`/lessons/${currentLesson.id}`} className="mt-5 flex items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-medium text-white">
              Continue lesson <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-black/10 bg-white p-5">
          <h2 className="text-xl font-semibold">Lessons</h2>
          <div className="mt-5 divide-y divide-black/10">
            {course.lessons.map((lesson, index) => (
              <Link key={lesson.id} href={`/lessons/${lesson.id}`} className="flex items-center gap-4 py-4">
                <span className={`grid h-10 w-10 place-items-center rounded-full ${lesson.status === 'done' ? 'bg-black text-white' : lesson.status === 'current' ? 'bg-[#d9f99d]' : 'bg-black/[0.04] text-black/35'}`}>
                  {lesson.status === 'locked' ? <Lock size={16} /> : index + 1}
                </span>
                <span className="flex-1">
                  <span className="block font-medium">{lesson.title}</span>
                  <span className="mt-1 block text-sm text-black/50">{lesson.summary}</span>
                </span>
                <span className="text-sm text-black/45">{lesson.duration}</span>
              </Link>
            ))}
          </div>
        </div>
        <aside className="rounded-lg border border-black/10 bg-white p-5">
          <h2 className="text-xl font-semibold">What you will learn</h2>
          <div className="mt-5 space-y-3">
            {course.outcomes.map((outcome) => (
              <div key={outcome} className="flex gap-3 text-sm text-black/65">
                <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-black" />
                {outcome}
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}

export function DemoLessonPage() {
  const params = useParams<{ id: string }>();
  const { course, lesson } = findLesson(params.id);
  const [bookmarked, setBookmarked] = useState(false);
  const [note, setNote] = useState('Remember: read-then-write flows need an invariant at the write boundary.');

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_390px]">
      <article className="space-y-5">
        <div className="rounded-lg bg-white p-6 sm:p-8">
          <Link href={`/courses/${course.slug}`} className="text-sm text-black/50 hover:text-black">{course.title}</Link>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-light tracking-tight">{lesson.title}</h1>
              <p className="mt-3 text-black/60">{lesson.summary}</p>
            </div>
            <button onClick={() => setBookmarked((value) => !value)} className={`rounded-full px-4 py-2 text-sm font-medium ${bookmarked ? 'bg-[#d9f99d]' : 'bg-black text-white'}`}>
              {bookmarked ? 'Bookmarked' : 'Bookmark'}
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-black/10 bg-white p-6 sm:p-8">
          <div className="prose prose-neutral max-w-none">
            {lesson.content.map((paragraph) => <p key={paragraph} className="text-base leading-8 text-black/70">{paragraph}</p>)}
          </div>
          <div className="mt-6">
            <DemoIDEPanel compact />
          </div>
        </div>

        <div className="rounded-lg border border-black/10 bg-white p-6">
          <div className="flex items-center gap-2">
            <MessageCircle size={18} />
            <h2 className="font-semibold">Discussion</h2>
          </div>
          <div className="mt-4 rounded-lg bg-[#f7f4ee] p-4">
            <p className="text-sm font-medium">Tran Khoa</p>
            <p className="mt-1 text-sm text-black/60">So the safer enrollment fix should use an atomic increment plus capacity condition, right?</p>
          </div>
        </div>
      </article>

      <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
        <div className="rounded-lg bg-[#d9f99d] p-5">
          <Brain size={22} />
          <h2 className="mt-4 text-xl font-semibold">AI race condition hint</h2>
          <p className="mt-3 text-sm text-black/65">
            Risk detected: `seats` is checked before an awaited operation. Another request can pass the same check before the first write finishes.
          </p>
          <button className="mt-5 rounded-full bg-black px-4 py-2 text-sm font-medium text-white">Run analysis</button>
        </div>

        <div className="rounded-lg border border-black/10 bg-white p-5">
          <h2 className="font-semibold">My note</h2>
          <textarea value={note} onChange={(event) => setNote(event.target.value)} className="mt-4 min-h-32 w-full resize-none rounded-lg border border-black/10 bg-[#f7f4ee] p-3 text-sm outline-none" />
          <p className="mt-2 text-xs text-black/45">Saved locally for demo.</p>
        </div>

        <div className="rounded-lg border border-black/10 bg-white p-5">
          <h2 className="font-semibold">Lesson checklist</h2>
          <div className="mt-4 space-y-3 text-sm">
            {['Read the explanation', 'Review the code', 'Ask AI for risk points'].map((item, index) => (
              <div key={item} className="flex items-center gap-3">
                <span className={`grid h-5 w-5 place-items-center rounded-full ${index < 2 ? 'bg-black text-white' : 'bg-black/10'}`}>
                  {index < 2 && <CheckCircle2 size={13} />}
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

export function DemoAIPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <section className="rounded-lg bg-white p-6 sm:p-8">
        <Pill tone="pink">AI Coach</Pill>
        <h1 className="mt-5 text-4xl font-light">Analyze concurrency bugs before they ship.</h1>
        <p className="mt-4 max-w-2xl text-black/60">Mocked for the presentation, but shaped to match the BE AI/code-execution modules later.</p>
        <textarea
          defaultValue={`async function enroll(userId) {
  const course = await Course.findById(courseId);
  if (course.enrollmentCount >= course.capacity) return false;
  await Enrollment.create({ userId, courseId });
  course.enrollmentCount += 1;
  await course.save();
}`}
          className="mt-6 min-h-80 w-full rounded-lg bg-[#111827] p-5 font-mono text-sm leading-6 text-[#d9f99d] outline-none"
        />
      </section>
      <aside className="rounded-lg bg-[#d9f99d] p-6">
        <Brain size={24} />
        <h2 className="mt-5 text-2xl font-semibold">Review result</h2>
        <div className="mt-5 space-y-4 text-sm text-black/70">
          <p><strong>Severity:</strong> High</p>
          <p><strong>Pattern:</strong> read-then-write around enrollment count.</p>
          <p><strong>Fix:</strong> move capacity check into an atomic update or transaction, then create enrollment idempotently.</p>
        </div>
      </aside>
    </div>
  );
}

export function DemoIDEPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-white p-6 sm:p-8">
        <Pill tone="lime">Browser IDE</Pill>
        <h1 className="mt-5 text-4xl font-light">Practice concurrency bugs in a mock code runner.</h1>
        <p className="mt-4 max-w-2xl text-black/60">
          This is presentation-ready UI for the IDE/code-execution flow. It runs locally as mock state now and can map to the BE code-execution module later.
        </p>
      </section>
      <DemoIDEPanel />
    </div>
  );
}

export function DemoBookmarksPage() {
  const savedLessons = [
    { title: 'Race condition checklist', course: 'JavaScript Concurrency Foundations', href: '/lessons/lesson-race-condition' },
    { title: 'Lost update bug', course: 'Race Condition Detection Lab', href: '/lessons/lesson-lost-update' },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-white p-6 sm:p-8">
        <Pill tone="blue">Bookmarks</Pill>
        <h1 className="mt-5 text-4xl font-light">Saved lessons for quick review.</h1>
        <p className="mt-3 max-w-2xl text-black/60">
          This page is mock-backed for the presentation and can be wired to the BE bookmark module later.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {savedLessons.map((item) => (
          <Link key={item.title} href={item.href} className="rounded-lg border border-black/10 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
            <p className="text-xs uppercase tracking-[0.18em] text-black/40">{item.course}</p>
            <h2 className="mt-3 text-xl font-semibold">{item.title}</h2>
            <p className="mt-4 inline-flex items-center gap-2 text-sm font-medium">
              Open lesson <ArrowRight size={15} />
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function DemoQuizPage() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const questions = [
    {
      id: 'q1',
      text: 'Why can the enrollment function oversell seats?',
      options: ['MongoDB is slow', 'The check and write are separated by await', 'Promise.all always duplicates data', 'Node.js has multiple event loops'],
      correct: 1,
    },
    {
      id: 'q2',
      text: 'Which backend fix best protects capacity?',
      options: ['Hide the button in FE', 'Retry the request forever', 'Atomic conditional update or transaction', 'Increase timeout'],
      correct: 2,
    },
    {
      id: 'q3',
      text: 'What event does the BE emit after a passed quiz attempt?',
      options: ['QuizPassed event for gamification/leaderboard/notifications', 'CourseDeleted event', 'SocketDisconnected event', 'PasswordReset event'],
      correct: 0,
    },
  ];
  const score = questions.reduce((total, question) => total + (answers[question.id] === question.correct ? 1 : 0), 0);
  const passed = score >= 2;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="rounded-lg bg-white p-6 sm:p-8">
        <Pill tone="lime">Quiz by lesson</Pill>
        <h1 className="mt-5 text-4xl font-light">Race condition checkpoint</h1>
        <p className="mt-3 text-black/60">Mocks BE quiz + quiz-attempts: submit answers, calculate score, then show XP/notification side effects.</p>

        <div className="mt-7 space-y-5">
          {questions.map((question, index) => (
            <div key={question.id} className="rounded-lg border border-black/10 p-5">
              <p className="font-semibold">{index + 1}. {question.text}</p>
              <div className="mt-4 grid gap-2">
                {question.options.map((option, optionIndex) => {
                  const selected = answers[question.id] === optionIndex;
                  const correct = submitted && question.correct === optionIndex;
                  const wrong = submitted && selected && !correct;
                  return (
                    <button
                      key={option}
                      onClick={() => !submitted && setAnswers((current) => ({ ...current, [question.id]: optionIndex }))}
                      className={`rounded-lg border px-4 py-3 text-left text-sm transition ${
                        correct ? 'border-black bg-[#d9f99d]' : wrong ? 'border-red-300 bg-red-50' : selected ? 'border-black bg-black text-white' : 'border-black/10 bg-[#f7f4ee] hover:border-black/30'
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setSubmitted(true)}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 font-medium text-white"
        >
          Submit attempt <ArrowRight size={17} />
        </button>
      </section>

      <aside className="space-y-4">
        <div className="rounded-lg bg-[#d9f99d] p-6">
          <Trophy size={24} />
          <p className="mt-5 text-4xl font-semibold">{submitted ? `${score}/${questions.length}` : '--/3'}</p>
          <p className="mt-2 text-sm text-black/65">{submitted ? (passed ? 'Passed. +120 XP, leaderboard updated.' : 'Not passed yet. Try again.') : 'Score appears after submit.'}</p>
        </div>
        <div className="rounded-lg border border-black/10 bg-white p-5">
          <h2 className="font-semibold">BE side effects mocked</h2>
          <div className="mt-4 space-y-3 text-sm text-black/65">
            <p>quiz-attempts.submitAttempt</p>
            <p>gamification.addXP</p>
            <p>leaderboard.updateRank</p>
            <p>notifications.quizPassed</p>
          </div>
        </div>
      </aside>
    </div>
  );
}

export function DemoQuizHistoryPage() {
  const attempts = [
    ['Race condition checkpoint', '92%', 'Passed', '+120 XP'],
    ['Event loop basics', '86%', 'Passed', '+80 XP'],
    ['Worker pool design', '58%', 'Retry', '+0 XP'],
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-white p-6 sm:p-8">
        <Pill tone="pink">Quiz attempts</Pill>
        <h1 className="mt-5 text-4xl font-light">Attempt history from quiz-attempts module.</h1>
        <p className="mt-3 text-black/60">Shows score, pass state, XP reward, and links back to lesson quiz.</p>
      </section>
      <div className="overflow-hidden rounded-lg border border-black/10 bg-white">
        {attempts.map(([title, score, status, xp]) => (
          <div key={title} className="grid gap-3 border-b border-black/10 p-5 last:border-b-0 sm:grid-cols-[1fr_100px_100px_100px] sm:items-center">
            <p className="font-medium">{title}</p>
            <p className="text-sm text-black/55">{score}</p>
            <span className={`w-fit rounded-full px-3 py-1 text-xs ${status === 'Passed' ? 'bg-[#d9f99d]' : 'bg-[#fecaca] text-[#7f1d1d]'}`}>{status}</span>
            <p className="text-sm font-medium">{xp}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DemoLeaderboardPage() {
  const rows = [
    ['1', 'Vo Van Tin', 'Level 12', '5,920 XP'],
    ['2', 'Nguyen Minh Anh', 'Level 7', '1,840 XP'],
    ['3', 'Ha Van An', 'Level 7', '1,760 XP'],
    ['4', 'Tran Khoa', 'Level 6', '1,420 XP'],
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-[#111827] p-6 text-white sm:p-8">
        <Trophy size={28} />
        <h1 className="mt-5 text-4xl font-light">Leaderboard and gamification</h1>
        <p className="mt-3 max-w-2xl text-white/60">Mocking BE leaderboard + gamification side effects from quiz attempts and lesson completion.</p>
      </section>
      <div className="overflow-hidden rounded-lg border border-black/10 bg-white">
        {rows.map(([rank, name, level, xp]) => (
          <div key={name} className={`grid gap-3 border-b border-black/10 p-5 last:border-b-0 sm:grid-cols-[70px_1fr_120px_120px] ${rank === '2' ? 'bg-[#d9f99d]/45' : ''}`}>
            <p className="text-2xl font-semibold">#{rank}</p>
            <p className="font-medium">{name}</p>
            <p className="text-sm text-black/55">{level}</p>
            <p className="text-sm font-medium">{xp}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DemoNotificationsPage() {
  const notifications = [
    ['QUIZ_PASSED', 'Quiz passed', 'You earned 120 XP from Race condition checkpoint.', '2 min ago'],
    ['LEVEL_UP', 'Level up', 'You reached Level 7. Keep the streak alive.', 'Today'],
    ['RANK_CHANGE', 'Leaderboard update', 'You moved to #2 this week.', 'Yesterday'],
    ['COURSE_PROGRESS', 'Lesson completed', 'Event loop in one picture marked as completed.', 'Yesterday'],
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-white p-6 sm:p-8">
        <Pill tone="blue">Notifications</Pill>
        <h1 className="mt-5 text-4xl font-light">Events emitted by learning activity.</h1>
        <p className="mt-3 text-black/60">Mocks notification records produced by quiz/gamification/course progress handlers.</p>
      </section>
      <div className="grid gap-4">
        {notifications.map(([type, title, body, time]) => (
          <div key={`${type}-${title}`} className="flex gap-4 rounded-lg border border-black/10 bg-white p-5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#d9f99d]">
              <Bell size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold">{title}</h2>
                <span className="rounded bg-black/[0.05] px-2 py-1 text-xs text-black/45">{type}</span>
              </div>
              <p className="mt-1 text-sm text-black/60">{body}</p>
            </div>
            <p className="text-xs text-black/40">{time}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DemoProfilePage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <aside className="rounded-lg bg-white p-6">
        <div className="grid h-24 w-24 place-items-center rounded-full bg-[#d9f99d]">
          <User size={38} />
        </div>
        <h1 className="mt-5 text-2xl font-semibold">Nguyen Minh Anh</h1>
        <p className="mt-1 text-sm text-black/50">student@threadlearn.dev</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-[#f7f4ee] p-4">
            <p className="text-2xl font-semibold">7</p>
            <p className="text-xs text-black/45">Level</p>
          </div>
          <div className="rounded-lg bg-[#f7f4ee] p-4">
            <p className="text-2xl font-semibold">5</p>
            <p className="text-xs text-black/45">Streak</p>
          </div>
        </div>
      </aside>
      <section className="space-y-5">
        <div className="rounded-lg bg-[#d9f99d] p-6">
          <Award size={24} />
          <h2 className="mt-4 text-2xl font-semibold">Certificates</h2>
          <p className="mt-2 text-sm text-black/65">Certificate module mock: one course certificate is ready after completion.</p>
          <button className="mt-5 rounded-full bg-black px-4 py-2 text-sm font-medium text-white">Download certificate</button>
        </div>
        <div className="rounded-lg border border-black/10 bg-white p-6">
          <h2 className="text-xl font-semibold">User stats</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {[
              ['Lessons completed', '12'],
              ['Quizzes passed', '6'],
              ['Total XP', '1,840'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-[#f7f4ee] p-4">
                <p className="text-2xl font-semibold">{value}</p>
                <p className="text-xs text-black/45">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
