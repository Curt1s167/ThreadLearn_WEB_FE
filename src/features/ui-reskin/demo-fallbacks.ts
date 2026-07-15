import type { Course, Lesson, Notification, SubscriptionPlan } from '../../types';

export const DEMO_CODE_SAMPLE = `let seats = 1;

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
  .then(console.log);`;

export const DEMO_AI_RESPONSE =
  'Risk detected: seats is checked before an awaited operation. Another request can pass the same check before the first write finishes. Move the capacity check into an atomic update, transaction, or lock.';

export const LESSON_FALLBACK_MARKDOWN = `
The demo lesson room keeps a short concurrency lab visible while backend lesson content is being filled in.

A race condition happens when correctness depends on timing between two or more operations. In backend code, risky places are counters, enrollment state, payments, and read-then-write flows.

A reliable fix moves the invariant closer to the write: transaction, atomic update, lock, or idempotent command.
`;

export const FALLBACK_COURSES: Course[] = [
  {
    _id: 'mock-course-js-concurrency',
    title: 'JavaScript Concurrency Foundations',
    description:
      'Master event loop, promises, async tasks, and the mental model behind concurrent JavaScript.',
    shortDescription: 'Master event loop, promises, async tasks, and practical concurrency patterns.',
    tags: ['event-loop', 'promises', 'async-await'],
    level: 'BEGINNER',
    language: 'JavaScript',
    isPublished: true,
    totalLessons: 3,
    totalEnrollments: 2840,
    averageRating: 4.9,
    estimatedDuration: 260,
    createdAt: '2026-06-22T00:00:00.000Z',
    updatedAt: '2026-06-22T00:00:00.000Z',
  },
  {
    _id: 'mock-course-race-detector',
    title: 'Race Condition Detection Lab',
    description:
      'Practice finding shared-state bugs with guided examples and AI-style review notes.',
    shortDescription: 'Find shared-state bugs with guided examples and AI-style review notes.',
    tags: ['race-conditions', 'locks', 'transactions'],
    level: 'INTERMEDIATE',
    language: 'Node.js',
    isPublished: true,
    totalLessons: 3,
    totalEnrollments: 1960,
    averageRating: 4.8,
    estimatedDuration: 190,
    createdAt: '2026-06-22T00:00:00.000Z',
    updatedAt: '2026-06-22T00:00:00.000Z',
  },
  {
    _id: 'mock-course-worker-systems',
    title: 'Worker Thread Systems',
    description: 'Build queues, isolate CPU tasks, and keep APIs responsive under load.',
    shortDescription: 'Build queues, isolate CPU tasks, and keep APIs responsive under load.',
    tags: ['worker-threads', 'queues', 'performance'],
    level: 'ADVANCED',
    language: 'Node.js',
    isPublished: true,
    totalLessons: 3,
    totalEnrollments: 1180,
    averageRating: 4.7,
    estimatedDuration: 345,
    createdAt: '2026-06-22T00:00:00.000Z',
    updatedAt: '2026-06-22T00:00:00.000Z',
  },
];

export function buildFallbackLessons(courseId: string, language = 'JavaScript'): Lesson[] {
  return [
    {
      _id: 'mock-lesson-event-loop',
      courseId,
      title: `${language} scheduling model`,
      content: LESSON_FALLBACK_MARKDOWN,
      duration: 12,
      order: 1,
      isLocked: false,
      createdAt: '2026-06-22T00:00:00.000Z',
      updatedAt: '2026-06-22T00:00:00.000Z',
    },
    {
      _id: 'mock-lesson-race-condition',
      courseId,
      title: 'Race condition checklist',
      content: LESSON_FALLBACK_MARKDOWN,
      duration: 18,
      order: 2,
      isLocked: false,
      createdAt: '2026-06-22T00:00:00.000Z',
      updatedAt: '2026-06-22T00:00:00.000Z',
    },
    {
      _id: 'mock-lesson-worker-pool',
      courseId,
      title: 'When to use background workers',
      content: LESSON_FALLBACK_MARKDOWN,
      duration: 16,
      order: 3,
      isLocked: true,
      createdAt: '2026-06-22T00:00:00.000Z',
      updatedAt: '2026-06-22T00:00:00.000Z',
    },
  ];
}

export function buildFallbackOutcomes(language?: string, lessonCount = 3) {
  const topic = language ? language.toLowerCase() : 'backend';
  return [
    `Explain the core ${topic} concurrency model`,
    `${lessonCount} structured lessons`,
    `Hands-on ${topic} practice`,
    'Use notes, comments, bookmarks, quizzes, and AI review in one flow',
  ];
}

export function buildFallbackTags(language?: string) {
  const normalized = language?.toLowerCase();
  return [normalized, 'concurrency', 'practice'].filter(Boolean) as string[];
}

export const FALLBACK_BOOKMARKS = [
  {
    id: 'mock-bookmark-race-condition',
    title: 'Race condition checklist',
    course: 'JavaScript Concurrency Foundations',
    href: '/courses',
    createdAt: '2026-06-22T00:00:00.000Z',
  },
  {
    id: 'mock-bookmark-lost-update',
    title: 'Lost update bug',
    course: 'Race Condition Detection Lab',
    href: '/courses',
    createdAt: '2026-06-22T00:00:00.000Z',
  },
];

export const FALLBACK_NOTIFICATIONS: Notification[] = [
  {
    _id: 'mock-notification-quiz-passed',
    userId: 'mock-user',
    type: 'QUIZ_PASSED',
    title: 'Quiz passed',
    message: 'You earned 120 XP from Race condition checkpoint.',
    isRead: false,
    createdAt: '2026-06-22T09:00:00.000Z',
  },
  {
    _id: 'mock-notification-level-up',
    userId: 'mock-user',
    type: 'LEVEL_UP',
    title: 'Level up',
    message: 'You reached Level 7. Keep the streak alive.',
    isRead: false,
    createdAt: '2026-06-22T08:00:00.000Z',
  },
  {
    _id: 'mock-notification-leaderboard',
    userId: 'mock-user',
    type: 'LEADERBOARD',
    title: 'Leaderboard update',
    message: 'You moved to #2 this week.',
    isRead: true,
    createdAt: '2026-06-21T18:00:00.000Z',
  },
  {
    _id: 'mock-notification-course-progress',
    userId: 'mock-user',
    type: 'LESSON_COMPLETED',
    title: 'Lesson completed',
    message: 'Event loop in one picture marked as completed.',
    isRead: true,
    createdAt: '2026-06-21T12:00:00.000Z',
  },
];

export const FALLBACK_PLANS: SubscriptionPlan[] = [
  {
    _id: 'mock-plan-free',
    name: 'Starter',
    description: 'Demo preview for basic ThreadLearn access.',
    price: 0,
    currency: 'USD',
    durationDays: 30,
    features: ['Course catalog access', 'Lesson notes and bookmarks', 'Quiz attempt history'],
    isActive: true,
    createdAt: '2026-06-22T00:00:00.000Z',
    updatedAt: '2026-06-22T00:00:00.000Z',
  },
  {
    _id: 'mock-plan-premium',
    name: 'Premium',
    description: 'Demo preview for AI review and advanced learning flow.',
    price: 99000,
    currency: 'VND',
    durationDays: 30,
    features: ['AI code review', 'Premium courses', 'XP streak boosts', 'Certificate placeholder'],
    isActive: true,
    createdAt: '2026-06-22T00:00:00.000Z',
    updatedAt: '2026-06-22T00:00:00.000Z',
  },
  {
    _id: 'mock-plan-team',
    name: 'Team Lab',
    description: 'Demo preview for classroom and project groups.',
    price: 299000,
    currency: 'VND',
    durationDays: 90,
    features: ['Team leaderboard', 'Admin analytics', 'Course progress review'],
    isActive: true,
    createdAt: '2026-06-22T00:00:00.000Z',
    updatedAt: '2026-06-22T00:00:00.000Z',
  },
];
