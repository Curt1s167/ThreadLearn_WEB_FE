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
  streak: number;
  lastActivityAt?: string;
  totalQuizzesPassed: number;
  totalLessonsCompleted: number;
}

// ─── Courses ─────────────────────────────────────────────────────────────────

export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  tags: string[];
  level: CourseLevel;
  language: string;
  isPublished: boolean;
  isDeleted?: boolean;
  lessonCount?: number;
  enrollmentCount?: number;
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

// ─── Lessons ─────────────────────────────────────────────────────────────────

export interface Lesson {
  _id: string;
  courseId: string;
  title: string;
  content: string; // Markdown
  attachmentUrl?: string;
  videoUrl?: string;
  duration: number; // minutes
  order: number;
  isLocked?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Enrollments ─────────────────────────────────────────────────────────────

export interface Enrollment {
  _id: string;
  userId: string;
  courseId: string;
  progress: number; // 0-100
  completedLessons: string[];
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────

export interface QuizOption {
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  _id: string;
  questionText: string;
  options: QuizOption[];
}

export interface Quiz {
  _id: string;
  lessonId: string;
  title: string;
  questions: QuizQuestion[];
  xpReward: number;
  timeLimit: number; // seconds
  passingScore: number; // percentage
  createdAt: string;
}

export interface QuizAttempt {
  _id: string;
  userId: string;
  quizId: string;
  answers: { questionId: string; selectedOption: number }[];
  score: number;
  passed: boolean;
  timeTaken: number; // seconds
  createdAt: string;
}

export interface SubmitAttemptPayload {
  quizId: string;
  answers: { questionId: string; selectedOption: number }[];
  startedAt: string;
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
  lessonId: string;
  lesson?: Pick<Lesson, '_id' | 'title' | 'courseId'>;
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
  avatarUrl?: string;
  xp: number;
  level: number;
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

// ─── DEV3: Comments ──────────────────────────────────────────────────────────

export type CommentTargetType = 'COURSE' | 'LESSON';

export interface CommentUserRef {
  _id: string;
  fullName: string;
  avatarUrl?: string | null;
}

export interface CommentV2 {
  _id: string;
  targetType: CommentTargetType;
  targetId: string;
  content: string;
  isDeleted: boolean;
  parentId?: string | null;
  userId: CommentUserRef;
  createdAt: string;
  updatedAt: string;
}

// ─── DEV3: Bookmarks ──────────────────────────────────────────────────────────

export type BookmarkTargetType = 'COURSE' | 'LESSON';

export interface BookmarkV2 {
  _id: string;
  userId: string;
  targetType: BookmarkTargetType;
  targetId: string;
  title: string;
  thumbnailUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookmarkToggleResult {
  bookmarked: boolean;
  _id?: string;
  userId?: string;
  targetType?: BookmarkTargetType;
  targetId?: string;
  title?: string;
  thumbnailUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// ─── DEV3: Notes ─────────────────────────────────────────────────────────────

export interface NoteV2 {
  _id: string;
  userId: string;
  lessonId: string;
  anchorText: string;
  anchorStart: number;
  anchorEnd: number;
  noteContent: string;
  createdAt: string;
  updatedAt: string;
}

// ─── DEV3: Exercises & Code Execution ────────────────────────────────────────

export interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  points: number;
}

export interface Exercise {
  _id: string;
  lessonId: string;
  title: string;
  description: string;
  starterCode: string;
  language: 'javascript' | 'python';
  testCases: TestCase[];
  totalPoints: number;
  timeLimit: number;
  createdAt: string;
  updatedAt: string;
}

export type Verdict = 'PASS' | 'PARTIAL' | 'FAIL' | 'ERROR';

export interface TestResult {
  passed: boolean;
  isHidden: boolean;
  input: string | null;
  expectedOutput: string | null;
  actualOutput: string | null;
  executionTime: number;
}

export interface RunCodeResult {
  executionId: string;
  verdict: Verdict;
  passedCases: number;
  totalCases: number;
  score: number;
  testResults: TestResult[];
}

export interface SubmissionHistory {
  _id: string;
  userId: string;
  exerciseId: string;
  code: string;
  language: string;
  status: Verdict | 'PENDING';
  actualOutput: string;
  expectedOutput: string;
  passedCases: number;
  totalCases: number;
  executionTime: number;
  memoryUsage: number;
  stderr: string;
  createdAt: string;
}

// ─── DEV3: AI Analysis ────────────────────────────────────────────────────────

export interface AIAnalysisResult {
  analysisId: string;
  suggestions: string[];
  raceConditions: string[];
  optimizedCode: string;
  explanation: string;
  remainingQuota: number;
  quotaLimit: number;
}

export interface AIAnalysisHistoryItem {
  _id: string;
  userId: string;
  codeExecutionId?: string | null;
  language: string;
  suggestions: string[];
  raceConditions: string[];
  tokensUsed: number;
  createdAt: string;
}

// ─── DEV3: Notifications ─────────────────────────────────────────────────────

export type NotificationTypeV2 =
  | 'LESSON_COMPLETED'
  | 'QUIZ_PASSED'
  | 'QUIZ_FAILED'
  | 'COURSE_COMPLETED'
  | 'COURSE_ENROLLED'
  | 'LEVEL_UP'
  | 'BOOKMARK_COURSE_UPDATED'
  | 'PAYMENT_SUCCESS'
  | 'NEW_USER_REGISTERED'
  | 'STUDENT_COMMENT_REPORT'
  | 'SYSTEM_ERROR'
  | 'SYSTEM'
  | 'ACHIEVEMENT'
  | 'LEADERBOARD'
  | 'ENROLLMENT';

export interface NotificationV2 {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationTypeV2;
  metadata?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface UnreadCountResult {
  count: number;
}

// ─── DEV3: Meta (paginated) ───────────────────────────────────────────────────

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  unreadCount?: number;
}

export interface PaginatedV2Response<T> {
  message: string;
  data: T[];
  meta: PaginatedMeta;
}

export interface SingleV2Response<T> {
  message: string;
  data: T;
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
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
