// ─── Auth & User ────────────────────────────────────────────────────────────

export type UserRole = 'STUDENT' | 'ADMIN';

export type PlanType = 'FREE' | 'PREMIUM';

export interface User {
  _id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  planType: PlanType;
  subscriptionExpiresAt?: string;
  isLocked?: boolean;
  isEmailVerified?: boolean;
  googleId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

// ─── User Stats & Gamification ───────────────────────────────────────────────

export interface UserStats {
  userId: string;
  xp: number;
  level: number;
  streak?: number;
  currentStreak?: number;
  highestStreak?: number;
  lastActivityAt?: string;
  lastActiveDate?: string;
  totalQuizzesPassed?: number;
  quizzesCompleted?: number;
  totalLessonsCompleted: number;
  coursesCompleted?: number;
}

// ─── Courses ─────────────────────────────────────────────────────────────────

export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export interface Course {
  _id: string;
  id?: string;
  title: string;
  description: string;
  shortDescription?: string;
  thumbnailUrl?: string;
  tags: string[];
  level: CourseLevel;
  language: string;
  isPublished: boolean;
  isPremium?: boolean;
  price?: number;
  status?: string;
  isDeleted?: boolean;
  lessonCount?: number;
  enrollmentCount?: number;
  totalLessons?: number;
  totalEnrollments?: number;
  averageRating?: number;
  estimatedDuration?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseCreatePayload {
  title: string;
  description: string;
  tags?: string[];
  level?: CourseLevel;
  language?: string;
  thumbnailUrl?: string;
}

export interface CourseDetail {
  course: Course;
  sections: unknown[];
  lessons: Lesson[];
}

// ─── Lessons ─────────────────────────────────────────────────────────────────

export interface Lesson {
  _id: string;
  id?: string;
  courseId: string;
  title: string;
  content?: string; // Markdown
  contentMarkdown?: string;
  attachmentUrl?: string;
  attachments?: string[];
  videoUrl?: string;
  duration?: number; // minutes
  estimatedTime?: number;
  order?: number;
  orderIndex?: number;
  isLocked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LessonCompleteResult {
  xpAwarded?: number;
  enrollment: Enrollment | null;
}

// ─── Enrollments ─────────────────────────────────────────────────────────────

export interface Enrollment {
  _id: string;
  id?: string;
  userId: string;
  courseId: string | EnrollmentCourseView;
  progress: number; // 0-100
  progressPercent?: number;
  completedLessons: string[];
  totalLessons?: number;
  lastLessonId?: string;
  completed: boolean;
  enrolledAt?: string;
  lastAccessedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EnrollmentCourseView {
  _id?: string;
  id?: string;
  title?: string;
  slug?: string;
  thumbnailUrl?: string;
  level?: string;
  language?: string;
  status?: string;
  isPremium?: boolean;
  totalLessons?: number;
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────

export interface QuizQuestion {
  _id: string;
  id?: string;
  questionText: string;
  options: string[];
}

export interface Quiz {
  _id: string;
  id?: string;
  lessonId: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  xpReward: number;
  timeLimit: number; // seconds
  timeLimitSeconds?: number;
  passingScore: number; // percentage
  passingScorePercent?: number;
  createdAt: string;
}

export interface QuizAttempt {
  _id: string;
  id?: string;
  userId: string;
  quizId: string;
  answers: { questionId: string; selectedOption: number }[] | Record<string, number>;
  score: number;
  passed: boolean;
  timeTaken: number; // seconds
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  xpRewarded?: number;
  passingScorePercent?: number;
  isTimeout?: boolean;
}

export interface SubmitAttemptPayload {
  quizId: string;
  answers: Record<string, number>;
  startTime?: string;
}

export interface QuizSubmitResult {
  attempt: QuizAttempt;
  score: number;
  passed: boolean;
  xpRewarded: number;
  passingScorePercent: number;
  isTimeout: boolean;
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export interface Comment {
  _id: string;
  lessonId: string;
  userId: string;
  user?: Pick<User, '_id' | 'name' | 'avatarUrl'>;
  content: string;
  parentId?: string;
  likes: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Bookmarks & Notes ────────────────────────────────────────────────────────

export interface Bookmark {
  _id: string;
  userId: string;
  targetType: 'COURSE' | 'LESSON';
  targetId: string;
  title: string;
  lessonId?: string;
  createdAt: string;
}

export interface Note {
  _id: string;
  userId: string;
  lessonId: string;
  noteText: string;
  codeSnippet?: string;
  updatedAt: string;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationType =
  | 'LEVEL_UP'
  | 'QUIZ_PASSED'
  | 'COURSE_COMPLETED'
  | 'STREAK_MILESTONE'
  | 'RANK_CHANGE';

export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar?: string;
  xp: number;
  level?: number;
}

// ─── AI ───────────────────────────────────────────────────────────────────────

export interface AIHistoryLog {
  _id: string;
  userId: string;
  courseId: string;
  prompt: string;
  response: string;
  createdAt: string;
}

// ─── Analytics (Admin) ────────────────────────────────────────────────────────

export interface PlatformStats {
  totalStudents: number;
  totalCourses: number;
  totalEnrollments: number;
  totalQuizAttempts: number;
  courseCompletionRate: number;
  quizPassRate: number;
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type PaginatedApiResponse<T> = ApiResponse<PaginatedResponse<T>>;

// ─── Filters ──────────────────────────────────────────────────────────────────

export interface CourseFilters {
  search?: string;
  level?: CourseLevel;
  language?: string;
  tags?: string[];
  page?: number;
  limit?: number;
}
