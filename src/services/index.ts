import { apiClient } from './apiClient';
import type {
  ApiResponse,
  PaginatedApiResponse,
  Course,
  CourseDetail,
  CourseCreatePayload,
  CourseFilters,
  Lesson,
  LessonCompleteResult,
  Quiz,
  QuizAttempt,
  QuizSubmitResult,
  SubmitAttemptPayload,
  Comment,
  Bookmark,
  Note,
  Notification,
  LeaderboardEntry,
  SubscriptionPlan,
  UserSubscription,
  SubscriptionPurchase,
  PurchasePlanPayload,
  AIHistoryLog,
  PlatformStats,
  Enrollment,
  UserStats,
  User,
} from '../types';

// ─── Courses (UC15–UC25) ──────────────────────────────────────────────────────
export const coursesService = {
  list: async (filters: CourseFilters = {}) => {
    const { data } = await apiClient.get<ApiResponse<Course[]>>('/courses', {
      params: filters,
    });
    const meta = data.meta ?? {
      page: filters.page ?? 1,
      limit: filters.limit ?? data.data.length,
      total: data.data.length,
      totalPages: 1,
    };

    return {
      items: data.data,
      total: meta.total,
      page: meta.page,
      limit: meta.limit,
      totalPages: meta.totalPages,
    };
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<CourseDetail>>(`/courses/${id}`);
    return data.data;
  },
  create: async (payload: CourseCreatePayload) => {
    const { data } = await apiClient.post<ApiResponse<Course>>('/courses', payload);
    return data.data;
  },
  update: async (id: string, payload: Partial<CourseCreatePayload>) => {
    const { data } = await apiClient.put<ApiResponse<Course>>(`/courses/${id}`, payload);
    return data.data;
  },
  uploadThumbnail: async (courseId: string, file: File) => {
    const form = new FormData();
    form.append('thumbnail', file);
    const { data } = await apiClient.post<ApiResponse<{ thumbnailUrl: string }>>(
      `/courses/${courseId}/thumbnail`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data.data;
  },
};

// ─── Lessons (UC19–UC25) ──────────────────────────────────────────────────────
export const lessonsService = {
  getByCourse: async (courseId: string) => {
    const { data } = await apiClient.get<ApiResponse<Lesson[]>>(
      `/lessons?courseId=${courseId}`
    );
    return data.data;
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<Lesson>>(`/lessons/${id}`);
    return data.data;
  },
  create: async (payload: Partial<Lesson>) => {
    const { data } = await apiClient.post<ApiResponse<Lesson>>('/lessons', payload);
    return data.data;
  },
  update: async (id: string, payload: Partial<Lesson>) => {
    const { data } = await apiClient.put<ApiResponse<Lesson>>(`/lessons/${id}`, payload);
    return data.data;
  },
  delete: async (id: string) => {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/lessons/${id}`);
    return data;
  },
  complete: async (id: string) => {
    const { data } = await apiClient.post<ApiResponse<LessonCompleteResult>>(
      `/lessons/${id}/complete`
    );
    return data.data;
  },
};

// ─── Enrollments (UC33) ───────────────────────────────────────────────────────
export const enrollmentsService = {
  enroll: async (courseId: string) => {
    const { data } = await apiClient.post<ApiResponse<Enrollment>>('/enrollments', {
      courseId,
    });
    return data.data;
  },
  getMyEnrollments: async () => {
    const { data } = await apiClient.get<ApiResponse<Enrollment[]>>('/enrollments/me');
    return data.data;
  },
  updateProgress: async (enrollmentId: string, lessonId: string) => {
    const { data } = await apiClient.post<ApiResponse<Enrollment>>(
      `/enrollments/${enrollmentId}/progress`,
      { lessonId }
    );
    return data.data;
  },
};

// ─── Students (progress/resume) ───────────────────────────────────────────────
export const studentsService = {
  getResume: async () => {
    const { data } = await apiClient.get<ApiResponse<Enrollment | null>>(
      '/students/me/resume'
    );
    return data.data;
  },
};

// ─── Quiz (UC26–UC29, UC41–UC43, UC49) ───────────────────────────────────────
export const quizService = {
  getByLesson: async (lessonId: string) => {
    const { data } = await apiClient.get<ApiResponse<Quiz>>(
      `/quiz/lesson/${lessonId}`
    );
    return data.data;
  },
  getAttemptById: async (attemptId: string) => {
    const { data } = await apiClient.get<ApiResponse<QuizAttempt>>(
      `/quiz/attempts/${attemptId}`
    );
    return data.data;
  },
  create: async (payload: Partial<Quiz>) => {
    const { data } = await apiClient.post<ApiResponse<Quiz>>('/quiz', payload);
    return data.data;
  },
  submit: async (payload: SubmitAttemptPayload) => {
    const { data } = await apiClient.post<ApiResponse<QuizSubmitResult>>(
      '/quiz/submit',
      payload
    );
    return data.data;
  },
  getMyAttempts: async () => {
    // UC49
    const { data } = await apiClient.get<ApiResponse<QuizAttempt[]>>(
      '/quiz/attempts/me'
    );
    return data.data;
  },
};

// ─── Comments (UC34–UC37) ─────────────────────────────────────────────────────
export const commentsService = {
  getByLesson: async (lessonId: string) => {
    const { data } = await apiClient.get<ApiResponse<Comment[]>>('/comments', {
      params: { targetType: 'LESSON', targetId: lessonId },
    });
    return data.data;
  },
  create: async (payload: { lessonId: string; content: string; parentId?: string }) => {
    const { data } = await apiClient.post<ApiResponse<Comment>>('/comments', {
      targetType: 'LESSON',
      targetId: payload.lessonId,
      content: payload.content,
      parentId: payload.parentId,
    });
    return data.data;
  },
  update: async (id: string, content: string) => {
    const { data } = await apiClient.patch<ApiResponse<Comment>>(`/comments/${id}`, {
      content,
    });
    return data.data;
  },
  delete: async (id: string) => {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/comments/${id}`);
    return data;
  },
};

// ─── Bookmarks (UC38–UC39) ────────────────────────────────────────────────────
export const bookmarksService = {
  getAll: async () => {
    const { data } = await apiClient.get<ApiResponse<Bookmark[]>>('/bookmarks', {
      params: { targetType: 'LESSON' },
    });
    return data.data;
  },
  toggle: async (lessonId: string, title = 'Lesson bookmark') => {
    const { data } = await apiClient.post<ApiResponse<{ bookmarked: boolean }>>(
      '/bookmarks/toggle',
      { targetType: 'LESSON', targetId: lessonId, title }
    );
    return data.data;
  },
};

// ─── Notes (UC40) ─────────────────────────────────────────────────────────────
export const notesService = {
  getByLesson: async (lessonId: string) => {
    const { data } = await apiClient.get<ApiResponse<Note[]>>(
      `/notes?lessonId=${lessonId}`
    );
    return data.data[0] ?? null;
  },
  upsert: async (payload: { lessonId: string; noteText: string; codeSnippet?: string }) => {
    const { data } = await apiClient.post<ApiResponse<Note>>('/notes', payload);
    return data.data;
  },
};

// ─── Notifications (UC32) ─────────────────────────────────────────────────────
export const notificationsService = {
  getAll: async () => {
    const { data } = await apiClient.get<ApiResponse<Notification[]>>('/notifications');
    return data.data;
  },
  markRead: async (id: string) => {
    const { data } = await apiClient.patch<ApiResponse<Notification>>(
      `/notifications/${id}/read`
    );
    return data.data;
  },
  markAllRead: async () => {
    const { data } = await apiClient.patch<ApiResponse<null>>(
      '/notifications/read-all'
    );
    return data;
  },
};

// ─── Leaderboard (UC46) ───────────────────────────────────────────────────────
export const leaderboardService = {
  getTop: async (limit = 50) => {
    const { data } = await apiClient.get<ApiResponse<LeaderboardEntry[]>>(
      `/leaderboard?limit=${limit}`
    );
    return data.data;
  },
  getMyRank: async () => {
    const { data } = await apiClient.get<ApiResponse<LeaderboardEntry>>(
      '/leaderboard/me'
    );
    return data.data;
  },
};

// ─── Gamification (UC44–UC45) ─────────────────────────────────────────────────
export const gamificationService = {
  getStats: async () => {
    const { data } = await apiClient.get<ApiResponse<UserStats>>('/gamification/stats');
    return data.data;
  },
};

// ─── Subscription (UC51–UC52) ─────────────────────────────────────────────────
export const subscriptionService = {
  getPlans: async () => {
    const { data } = await apiClient.get<ApiResponse<SubscriptionPlan[]>>('/subscription/plans');
    return data.data;
  },
  getMyPlan: async () => {
    const { data } = await apiClient.get<ApiResponse<UserSubscription | null>>(
      '/subscription/my-subscription'
    );
    return data.data;
  },
  purchase: async (payload: PurchasePlanPayload) => {
    const { data } = await apiClient.post<ApiResponse<SubscriptionPurchase>>(
      '/subscription/purchase',
      payload
    );
    return data.data;
  },
};

// ─── AI (UC47–UC48) ───────────────────────────────────────────────────────────
export const aiService = {
  requestRecommendation: async (courseId: string) => {
    const { data } = await apiClient.post<ApiResponse<AIHistoryLog>>(
      '/ai/recommendation',
      { courseId }
    );
    return data.data;
  },
  getHistory: async () => {
    const { data } = await apiClient.get<ApiResponse<AIHistoryLog[]>>('/ai/history');
    return data.data;
  },
};

// ─── Admin (UC10–UC14) ────────────────────────────────────────────────────────
export const adminService = {
  getStats: async () => {
    const { data } = await apiClient.get<ApiResponse<PlatformStats>>(
      '/admin/stats'
    );
    return data.data;
  },
  listUsers: async (page = 1, limit = 20) => {
    const { data } = await apiClient.get<PaginatedApiResponse<User>>(
      `/admin/students?page=${page}&limit=${limit}`
    );
    return data.data;
  },
  createStudent: async (payload: { firstName: string; lastName: string; email: string; password?: string }) => {
    const { data } = await apiClient.post<ApiResponse<User>>(
      '/admin/students',
      payload
    );
    return data.data;
  },
  updateUser: async (id: string, payload: Partial<User>) => {
    const { data } = await apiClient.patch<ApiResponse<User>>(
      `/admin/students/${id}`,
      payload
    );
    return data.data;
  },
  toggleUserLock: async (id: string, isLocked: boolean, lockedReason?: string) => {
    const { data } = await apiClient.patch<ApiResponse<User>>(
      `/admin/students/${id}/${isLocked ? 'unlock' : 'lock'}`,
      isLocked ? undefined : { lockedReason }
    );
    return data.data;
  },
  toggleCoursePublish: async (id: string, status: 'published' | 'hidden' | 'draft' = 'published') => {
    const { data } = await apiClient.patch<ApiResponse<Course>>(
      `/courses/${id}/publish`,
      { status }
    );
    return data.data;
  },
  deleteCourse: async (id: string) => {
    const { data } = await apiClient.delete<ApiResponse<null>>(
      `/courses/${id}`
    );
    return data;
  },
};
