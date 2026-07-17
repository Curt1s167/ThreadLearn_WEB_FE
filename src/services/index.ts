import { apiClient } from './apiClient';
import type {
  ApiResponse,
  PaginatedApiResponse,
  PaginatedResponse,
  Course,
  CourseDetail,
  CourseCreatePayload,
  CourseFilters,
  Lesson,
  LessonCompleteResult,
  Quiz,
  QuizAttempt,
  QuizSubmitResult,
  QuizCreatePayload,
  QuizUpdatePayload,
  QuestionPayload,
  SubmitAttemptPayload,
  Comment,
  Bookmark,
  BookmarkToggleResult,
  Note,
  Notification,
  LeaderboardEntry,
  SubscriptionPlan,
  UserSubscription,
  SubscriptionPurchase,
  PlanCreatePayload,
  PlanUpdatePayload,
  PurchasePlanPayload,
  PaymentConfirmationPayload,
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
  listAll: async () => {
    const { data } = await apiClient.get<ApiResponse<Quiz[]>>('/quiz');
    return data.data;
  },
  getByIdAdmin: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<Quiz>>(`/quiz/${id}`);
    return data.data;
  },
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
  create: async (payload: QuizCreatePayload) => {
    const { data } = await apiClient.post<ApiResponse<Quiz>>('/quiz', payload);
    return data.data;
  },
  update: async (id: string, payload: QuizUpdatePayload) => {
    const { data } = await apiClient.put<ApiResponse<Quiz>>(`/quiz/${id}`, payload);
    return data.data;
  },
  remove: async (id: string) => {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/quiz/${id}`);
    return data.data;
  },
  addQuestion: async (id: string, payload: QuestionPayload) => {
    const { data } = await apiClient.post<ApiResponse<Quiz>>(
      `/quiz/${id}/questions`,
      payload
    );
    return data.data;
  },
  updateQuestion: async (
    id: string,
    questionId: string,
    payload: Partial<QuestionPayload>
  ) => {
    const { data } = await apiClient.put<ApiResponse<Quiz>>(
      `/quiz/${id}/questions/${questionId}`,
      payload
    );
    return data.data;
  },
  deleteQuestion: async (id: string, questionId: string) => {
    const { data } = await apiClient.delete<ApiResponse<Quiz>>(
      `/quiz/${id}/questions/${questionId}`
    );
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
    return {
      data: data.data,
      meta: data.meta,
    };
  },
  toggle: async (lessonId: string, title = 'Lesson bookmark') => {
    const { data } = await apiClient.post<ApiResponse<BookmarkToggleResult>>(
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
    const { data } = await apiClient.patch<ApiResponse<{ updated: boolean }>>(
      '/notifications/read-all'
    );
    return data.data;
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
  listPlans: async (includeInactive = false) => {
    const { data } = await apiClient.get<ApiResponse<SubscriptionPlan[]>>('/subscription/plans', {
      params: includeInactive ? { includeInactive: true } : undefined,
    });
    return data.data;
  },
  getPlanById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<SubscriptionPlan>>(
      `/subscription/plans/${id}`
    );
    return data.data;
  },
  createPlan: async (payload: PlanCreatePayload) => {
    const { data } = await apiClient.post<ApiResponse<SubscriptionPlan>>(
      '/subscription/plans',
      payload
    );
    return data.data;
  },
  updatePlan: async (id: string, payload: PlanUpdatePayload) => {
    const { data } = await apiClient.put<ApiResponse<SubscriptionPlan>>(
      `/subscription/plans/${id}`,
      payload
    );
    return data.data;
  },
  deletePlan: async (id: string) => {
    const { data } = await apiClient.delete<ApiResponse<SubscriptionPlan>>(
      `/subscription/plans/${id}`
    );
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
  confirmPayment: async (payload: PaymentConfirmationPayload) => {
    const { data } = await apiClient.post<ApiResponse<SubscriptionPurchase>>(
      '/subscription/webhook/payment',
      payload
    );
    return data.data;
  },
};

// ─── AI (UC47–UC48) ───────────────────────────────────────────────────────────
export const aiService = {
  analyzeCode: async (inputCode: string, language: string) => {
    const { data } = await apiClient.post<ApiResponse<AIHistoryLog>>(
      '/ai/recommendation',
      { inputCode, language },
      { timeout: 120000 } // AI inference can take up to ~1min, especially right after a server restart
    );
    return data.data;
  },
  getHistory: async () => {
    const { data } = await apiClient.get<ApiResponse<AIHistoryLog[]>>('/ai/history');
    return data.data;
  },
  getHistoryById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<AIHistoryLog>>(`/ai/history/${id}`);
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
    const { data } = await apiClient.get<ApiResponse<User[]>>(
      `/admin/students?page=${page}&limit=${limit}`
    );
    const meta = data.meta;

    return {
      items: data.data ?? [],
      total: meta?.total ?? data.data?.length ?? 0,
      page: meta?.page ?? page,
      limit: meta?.limit ?? limit,
      totalPages: meta?.totalPages ?? 1,
    } satisfies PaginatedResponse<User>;
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
