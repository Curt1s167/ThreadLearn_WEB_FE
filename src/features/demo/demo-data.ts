export type DemoLevel = 'beginner' | 'intermediate' | 'advanced';

export interface DemoLesson {
  id: string;
  title: string;
  duration: string;
  status: 'done' | 'current' | 'locked';
  summary: string;
  content: string[];
  code: string;
}

export interface DemoCourse {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: DemoLevel;
  language: string;
  duration: string;
  rating: number;
  students: number;
  progress: number;
  color: string;
  tags: string[];
  outcomes: string[];
  lessons: DemoLesson[];
}

export const demoUser = {
  _id: 'demo-student-01',
  name: 'Nguyen Minh Anh',
  email: 'student@threadlearn.dev',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=threadlearn-student',
  role: 'STUDENT' as const,
  planType: 'FREE' as const,
  isEmailVerified: true,
  createdAt: '2026-06-22T00:00:00.000Z',
  updatedAt: '2026-06-22T00:00:00.000Z',
};

export const demoCourses: DemoCourse[] = [
  {
    id: 'course-js-concurrency',
    slug: 'javascript-concurrency-foundations',
    title: 'JavaScript Concurrency Foundations',
    description:
      'Master event loop, promises, async tasks, and the practical mental model behind concurrent JavaScript.',
    level: 'beginner',
    language: 'JavaScript',
    duration: '4h 20m',
    rating: 4.9,
    students: 2840,
    progress: 68,
    color: 'bg-[#d9f99d]',
    tags: ['event-loop', 'promises', 'async-await'],
    outcomes: [
      'Explain how the event loop schedules work',
      'Avoid blocking user-facing requests',
      'Debug async flows with a clear timeline',
    ],
    lessons: [
      {
        id: 'lesson-event-loop',
        title: 'Event loop in one picture',
        duration: '12 min',
        status: 'done',
        summary: 'Understand call stack, task queue, and microtasks.',
        content: [
          'The event loop is the coordinator between synchronous code, browser or Node APIs, and queued callbacks.',
          'Microtasks run before the next macrotask, which is why promise callbacks can jump ahead of timers.',
          'The core habit: keep long work out of the request path and make scheduling explicit.',
        ],
        code: `console.log('A');

setTimeout(() => console.log('B'), 0);

Promise.resolve().then(() => console.log('C'));

console.log('D');
// Output: A, D, C, B`,
      },
      {
        id: 'lesson-race-condition',
        title: 'Race condition checklist',
        duration: '18 min',
        status: 'current',
        summary: 'Spot shared state, non-atomic writes, and timing bugs.',
        content: [
          'A race condition happens when correctness depends on timing between two or more operations.',
          'In backend code, the risky places are counters, enrollment state, payments, and any read-then-write flow.',
          'A reliable fix moves the invariant closer to the write: transaction, atomic update, lock, or idempotent command.',
        ],
        code: `let seats = 1;

async function enroll(userId: string) {
  if (seats <= 0) return false;
  await reserveSeat(userId);
  seats -= 1;
  return true;
}`,
      },
      {
        id: 'lesson-worker-threads',
        title: 'When to use Worker Threads',
        duration: '16 min',
        status: 'locked',
        summary: 'Move CPU-heavy work out of the main event loop.',
        content: [
          'Worker Threads help when CPU work blocks the event loop.',
          'They are not a magic speed button for I/O work, but they are great for parsing, compression, and heavy analysis.',
        ],
        code: `import { Worker } from 'node:worker_threads';

const worker = new Worker('./analyze.js', {
  workerData: { file: 'submission.js' },
});`,
      },
    ],
  },
  {
    id: 'course-race-detector',
    slug: 'race-condition-detection',
    title: 'Race Condition Detection Lab',
    description:
      'Practice finding shared-state bugs with guided examples and AI-style review notes.',
    level: 'intermediate',
    language: 'Node.js',
    duration: '3h 10m',
    rating: 4.8,
    students: 1960,
    progress: 24,
    color: 'bg-[#f5d0fe]',
    tags: ['race-conditions', 'locks', 'transactions'],
    outcomes: [
      'Classify race conditions by invariant',
      'Choose between locks and atomic updates',
      'Write safer enrollment and progress flows',
    ],
    lessons: [
      {
        id: 'lesson-lost-update',
        title: 'Lost update bug',
        duration: '15 min',
        status: 'current',
        summary: 'Two writes overwrite each other because both read old state.',
        content: [
          'Lost update is the classic read-modify-write failure.',
          'The fix is to make the update conditional or atomic in the persistence layer.',
        ],
        code: `await Course.findById(id);
await Course.updateOne({ _id: id }, { $inc: { enrollmentCount: 1 } });`,
      },
    ],
  },
  {
    id: 'course-worker-systems',
    slug: 'worker-thread-systems',
    title: 'Worker Thread Systems',
    description:
      'Build queues, isolate CPU tasks, and keep APIs responsive under load.',
    level: 'advanced',
    language: 'Node.js',
    duration: '5h 45m',
    rating: 4.7,
    students: 1180,
    progress: 0,
    color: 'bg-[#bfdbfe]',
    tags: ['worker-threads', 'queues', 'performance'],
    outcomes: [
      'Design worker pools',
      'Protect request latency',
      'Measure throughput with realistic load',
    ],
    lessons: [
      {
        id: 'lesson-worker-pool',
        title: 'Worker pool design',
        duration: '22 min',
        status: 'locked',
        summary: 'Balance concurrency, queue size, and failure recovery.',
        content: [
          'A worker pool keeps a bounded number of expensive jobs running.',
          'The queue is part of your API contract: decide what happens when it is full.',
        ],
        code: `const poolSize = Math.max(1, os.cpus().length - 1);`,
      },
    ],
  },
];

export const demoStats = [
  { label: 'Students enrolled', value: '6,840+' },
  { label: 'Focused courses', value: '8' },
  { label: 'Use cases covered', value: '53' },
  { label: 'Average rating', value: '4.8' },
];

export const demoActivity = [
  'Completed Event loop in one picture',
  'Bookmarked Race condition checklist',
  'Asked AI to review a seat reservation function',
];

export function findCourse(slugOrId?: string) {
  return demoCourses.find((course) => course.slug === slugOrId || course.id === slugOrId) ?? demoCourses[0];
}

export function findLesson(id?: string) {
  for (const course of demoCourses) {
    const lesson = course.lessons.find((item) => item.id === id);
    if (lesson) return { course, lesson };
  }
  return { course: demoCourses[0], lesson: demoCourses[0].lessons[1] };
}
