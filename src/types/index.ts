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
  googleId?: string;
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
  tags?: string[];
  page?: number;
  limit?: number;
}
