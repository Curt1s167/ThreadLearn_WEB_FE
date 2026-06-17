// ─── Auth & User ────────────────────────────────────────────────────────────

export type UserRole = 'STUDENT' | 'ADMIN';

export type PlanType = 'FREE' | 'PREMIUM';

export interface AuthUser {
  _id: string;
  id?: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  role: UserRole;
  planType: PlanType;
  subscriptionExpiresAt?: string;
  isLocked?: boolean;
  isEmailVerified?: boolean;
  isVerified?: boolean;
  isActive?: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type User = AuthUser;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  name?: string;
}

export type LoginPayload = LoginRequest;
export type RegisterPayload = RegisterRequest;

export interface VerifyEmailRequest {
  token: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  name?: string;
  avatarUrl?: string;
}

export type AdminStudent = AuthUser & { role: 'STUDENT' };

export interface AdminStudentCreateRequest {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
}

export interface AdminStudentUpdateRequest {
  firstName?: string;
  lastName?: string;
  name?: string;
  avatarUrl?: string;
  isVerified?: boolean;
  isEmailVerified?: boolean;
}

export interface AdminStudentListQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  isVerified?: boolean;
  isLocked?: boolean;
  isEmailVerified?: boolean;
}

export type AdminStudentListResponse = PaginatedResponse<AdminStudent>;

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

export type CourseStatus = 'draft' | 'published' | 'hidden' | 'archived' | 'deleted';
export type CourseLanguage = 'javascript' | 'java' | 'python';

export interface Course {
  _id: string;
  title: string;
  slug?: string;
  description: string;
  shortDescription?: string;
  thumbnailUrl?: string;
  tags: string[];
  level: CourseLevel;
  language: CourseLanguage | string;
  category?: string;
  isPremium?: boolean;
  price?: number;
  status?: CourseStatus;
  prerequisites?: string[];
  prerequisiteThreshold?: number;
  estimatedDuration?: number;
  totalLessons?: number;
  totalEnrollments?: number;
  averageRating?: number;
  totalReviews?: number;
  publishedAt?: string;
  deletedAt?: string;
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
  shortDescription?: string;
  tags?: string[];
  level?: CourseLevel;
  language?: CourseLanguage | string;
  category?: string;
  thumbnailUrl?: string;
  isPremium?: boolean;
  price?: number;
  status?: CourseStatus;
  prerequisites?: string[];
  prerequisiteThreshold?: number;
  estimatedDuration?: number;
}

export interface CourseDetail {
  course: Course;
  sections: Section[];
  lessons: Lesson[];
}

export interface CourseReview {
  _id: string;
  userId: string | Pick<User, '_id' | 'name' | 'avatarUrl' | 'firstName' | 'lastName'>;
  courseId: string;
  rating: number;
  content?: string;
  helpfulCount?: number;
  status?: 'active' | 'hidden' | 'deleted';
  createdAt: string;
  updatedAt: string;
}

export interface Certificate {
  _id: string;
  userId: string;
  courseId: string | Course;
  certificateCode: string;
  pdfUrl?: string;
  issuedAt: string;
}

// ─── Sections (UC54) ─────────────────────────────────────────────────────────

export interface Section {
  _id: string;
  courseId: string;
  title: string;
  orderIndex: number;
  description?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Lessons ─────────────────────────────────────────────────────────────────

export type LessonType = 'article' | 'video' | 'coding' | 'quiz' | 'assignment' | 'mixed';
export type LessonStatus = 'active' | 'locked' | 'hidden' | 'deleted';

export interface Lesson {
  _id: string;
  courseId: string;
  sectionId?: string;
  title: string;
  slug?: string;
  description?: string;
  contentMarkdown?: string;
  content?: string;
  lessonType?: LessonType;
  videoUrl?: string;
  attachments?: string[];
  attachmentUrl?: string;
  codeSnippets?: { language: string; code: string; description?: string }[];
  orderIndex?: number;
  order?: number;
  estimatedTime?: number;
  duration?: number;
  isPreview?: boolean;
  isLocked?: boolean;
  status?: LessonStatus;
  createdAt: string;
  updatedAt: string;
}

export interface LessonAccessCheck {
  canView: boolean;
  reason: 'ADMIN' | 'PREVIEW' | 'ENROLLED' | 'NOT_ENROLLED' | 'LESSON_LOCKED' | 'LESSON_NOT_FOUND' | 'PREMIUM_REQUIRED';
}

// ─── Enrollments ─────────────────────────────────────────────────────────────

export interface Enrollment {
  _id: string;
  userId: string;
  courseId: string | Course;
  progress: number; // 0-100
  progressPercent?: number;
  completedLessons: string[];
  totalLessons?: number;
  lastLessonId?: string;
  completed: boolean;
  lastAccessedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────

export type QuizOption = string | { text: string; isCorrect?: boolean };

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
  answers: Record<string, number>;
  score: number;
  passed: boolean;
  timeTaken: number; // seconds
  createdAt: string;
}

export interface SubmitAttemptPayload {
  quizId: string;
  answers: Record<string, number>;
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
  lessonId?: string;
  targetType?: 'COURSE' | 'LESSON';
  targetId?: string;
  title?: string;
  thumbnailUrl?: string;
  anchorText?: string;
  position?: number;
  note?: string;
  folder?: string;
  tags?: string[];
  status?: 'active' | 'deleted';
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
  displayName?: string;
  avatarUrl?: string;
  xp: number;
  level: number;
}

// ─── AI ───────────────────────────────────────────────────────────────────────

export interface AIHistoryLog {
  _id: string;
  userId: string;
  courseId?: string;
  lessonId?: string;
  codeExecutionId?: string;
  inputCode?: string;
  language?: string;
  prompt: string;
  response: string;
  suggestions?: string[];
  raceConditions?: string[];
  optimizedCode?: string;
  explanation?: string;
  tokenUsage?: number;
  modelName?: string;
  feedbackRating?: number;
  status?: string;
  createdAt: string;
}

// ─── Analytics (Admin) ────────────────────────────────────────────────────────

export interface AdminDashboardStatisticsResponse {
  totalUsers: number;
  totalStudents: number;
  totalAdmins: number;
  activeStudents: number;
  lockedStudents: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  newUsersThisMonth: number;
  totalCourses: number;
  totalLessons: number;
  totalEnrollments: number;
  totalQuizAttempts: number;
  totalAiRequests?: number;
  totalCodeExecutions?: number;
  totalNotifications?: number;
  completedLessons?: number;
  averageQuizScore?: number;
  quizPassRate?: number;
  activeUsersThisMonth?: number;
  courseCompletionRate?: number;
  newUsersByMonth?: MonthlyStatistic[];
  enrollmentsByMonth?: MonthlyStatistic[];
  quizAttemptsByMonth?: MonthlyStatistic[];
  coursesCreatedByMonth?: MonthlyStatistic[];
  lessonsCreatedByMonth?: MonthlyStatistic[];
}

export type PlatformStats = AdminDashboardStatisticsResponse;

export interface MonthlyStatistic {
  month: string;
  count: number;
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
  tag?: string;
  isPremium?: boolean;
  status?: CourseStatus;
  includeAll?: boolean;
  tags?: string[];
  page?: number;
  limit?: number;
}
