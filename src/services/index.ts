import { apiClient } from './apiClient';
import type {
  ApiResponse,
  PaginatedApiResponse,
  Course,
  Certificate,
  CourseCreatePayload,
  CourseFilters,
  CourseReview,
  Lesson,
  Quiz,
  QuizAttempt,
  SubmitAttemptPayload,
  Comment,
  Bookmark,
  Note,
  Notification,
  LeaderboardEntry,
  AIHistoryLog,
  PlatformStats,
  Enrollment,
  UserStats,
  User,
  AdminDashboardStatisticsResponse,
  AdminStudent,
  AdminStudentCreateRequest,
  AdminStudentListQuery,
  AdminStudentListResponse,
  AdminStudentUpdateRequest,
} from '../types';

const normalizePaginated = <T>(payload: any) => {
  const data = payload.data;
  const meta = payload.meta ?? {};
  if (Array.isArray(data)) {
    return {
      items: data as T[],
      total: meta.total ?? data.length,
      page: meta.page ?? 1,
      limit: meta.limit ?? data.length,
      totalPages: meta.totalPages ?? 1,
    };
  }
  return data as {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

const normalizeComment = (comment: any): Comment => ({
  ...comment,
  lessonId: comment.lessonId ?? (comment.targetType === 'LESSON' ? comment.targetId : undefined),
  userId: typeof comment.userId === 'object' ? comment.userId?._id : comment.userId,
  user:
    typeof comment.userId === 'object'
      ? {
          _id: comment.userId._id,
          name: comment.userId.fullName || comment.userId.name || 'User',
          avatarUrl: comment.userId.avatarUrl,
        }
      : comment.user,
  likes: comment.likes ?? [],
});

// ─── Courses (UC15–UC25, UC60) ────────────────────────────────────────────────
export const coursesService = {
  list: async (filters: CourseFilters = {}) => {
    const { data } = await apiClient.get<any>('/courses', {
      params: filters,
    });
    return normalizePaginated<Course>(data);
  },
  search: async (filters: CourseFilters = {}) => {
    const { data } = await apiClient.get<any>('/courses/search', {
      params: filters,
    });
    return normalizePaginated<Course>(data);
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<{ course: Course; sections: any[]; lessons: Lesson[] }>>(
      `/courses/${id}`
    );
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
  uploadThumbnail: async (id: string, file: File) => {
    const form = new FormData();
    form.append('thumbnail', file);
    const { data } = await apiClient.post<ApiResponse<{ thumbnailUrl: string; course: Course }>>(
      `/courses/${id}/thumbnail`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data.data;
  },
  setVisibility: async (id: string, status: 'published' | 'hidden' | 'draft') => {
    const { data } = await apiClient.patch<ApiResponse<Course>>(`/courses/${id}/publish`, { status });
    return data.data;
  },
  delete: async (id: string) => {
    const { data } = await apiClient.delete<ApiResponse<Course>>(`/courses/${id}`);
    return data.data;
  },
  restore: async (id: string) => {
    const { data } = await apiClient.post<ApiResponse<Course>>(`/courses/${id}/restore`);
    return data.data;
  },
  getReviews: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<CourseReview[]>>(`/courses/${id}/reviews`);
    return data.data;
  },
  review: async (id: string, payload: { rating: number; content?: string }) => {
    const { data } = await apiClient.post<ApiResponse<CourseReview>>(`/courses/${id}/reviews`, payload);
    return data.data;
  },
};

// ─── Sections (UC54) ──────────────────────────────────────────────────────────
export const sectionsService = {
  listByCourse: async (courseId: string) => {
    const { data } = await apiClient.get<ApiResponse<any[]>>('/sections', { params: { courseId } });
    return data.data;
  },
  create: async (payload: { courseId: string; title: string; orderIndex?: number; description?: string }) => {
    const { data } = await apiClient.post<ApiResponse<any>>('/sections', payload);
    return data.data;
  },
  update: async (id: string, payload: { title?: string; orderIndex?: number; description?: string; isPublished?: boolean }) => {
    const { data } = await apiClient.patch<ApiResponse<any>>(`/sections/${id}`, payload);
    return data.data;
  },
  remove: async (id: string) => {
    const { data } = await apiClient.delete<ApiResponse<any>>(`/sections/${id}`);
    return data.data;
  },
  reorder: async (courseId: string, items: { id: string; orderIndex: number }[]) => {
    const { data } = await apiClient.post<ApiResponse<any[]>>('/sections/reorder', { courseId, items });
    return data.data;
  },
};

// ─── Lessons (UC19–UC22, UC25, UC60c) ────────────────────────────────────────
export const lessonsService = {
  getByCourse: async (courseId: string) => {
    const { data } = await apiClient.get<ApiResponse<Lesson[]>>('/lessons', {
      params: { courseId },
    });
    return data.data;
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<Lesson>>(`/lessons/${id}`);
    return data.data;
  },
  checkAccess: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<{ canView: boolean; reason: string }>>(
      `/lessons/${id}/access-check`
    );
    return data.data;
  },
  listVersions: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<any[]>>(`/lessons/${id}/versions`);
    return data.data;
  },
  create: async (payload: Partial<Lesson> & { courseId: string; title: string }) => {
    const { data } = await apiClient.post<ApiResponse<Lesson>>('/lessons', payload);
    return data.data;
  },
  update: async (id: string, payload: Partial<Lesson>) => {
    const { data } = await apiClient.put<ApiResponse<Lesson>>(`/lessons/${id}`, payload);
    return data.data;
  },
  uploadAttachment: async (id: string, file: File) => {
    const form = new FormData();
    form.append('attachment', file);
    const { data } = await apiClient.post<ApiResponse<Lesson>>(
      `/lessons/${id}/attachment`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data.data;
  },
  setLock: async (id: string, locked: boolean) => {
    const { data } = await apiClient.patch<ApiResponse<Lesson>>(`/lessons/${id}/lock`, { locked });
    return data.data;
  },
  delete: async (id: string) => {
    const { data } = await apiClient.delete<ApiResponse<{ id: string }>>(`/lessons/${id}`);
    return data.data;
  },
  complete: async (id: string) => {
    const { data } = await apiClient.post<ApiResponse<any>>(`/lessons/${id}/complete`);
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
  getMyCourse: async (courseId: string) => {
    const { data } = await apiClient.get<ApiResponse<Enrollment | null>>(`/enrollments/me/${courseId}`);
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

// ─── Quiz (UC26–UC29, UC41–UC43, UC49) ───────────────────────────────────────
export const quizService = {
  getByLesson: async (lessonId: string) => {
    const { data } = await apiClient.get<ApiResponse<Quiz>>(
      `/quiz?lessonId=${lessonId}`
    );
    return data.data;
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<Quiz>>(`/quiz/${id}`);
    return data.data;
  },
  create: async (payload: Partial<Quiz>) => {
    const { data } = await apiClient.post<ApiResponse<Quiz>>('/quiz', payload);
    return data.data;
  },
  submit: async (payload: SubmitAttemptPayload) => {
    const { data } = await apiClient.post<ApiResponse<QuizAttempt>>(
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
    const { data } = await apiClient.get<ApiResponse<Comment[]>>(
      '/comments',
      { params: { targetType: 'LESSON', targetId: lessonId } }
    );
    return (data.data ?? []).map(normalizeComment);
  },
  create: async (payload: { lessonId: string; content: string; parentId?: string }) => {
    const { data } = await apiClient.post<ApiResponse<Comment>>('/comments', {
      targetType: 'LESSON',
      targetId: payload.lessonId,
      content: payload.content,
      parentId: payload.parentId,
    });
    return normalizeComment(data.data);
  },
  update: async (id: string, content: string) => {
    const { data } = await apiClient.patch<ApiResponse<Comment>>(`/comments/${id}`, {
      content,
    });
    return normalizeComment(data.data);
  },
  delete: async (id: string) => {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/comments/${id}`);
    return data;
  },
};

// ─── Bookmarks (UC38–UC39) ────────────────────────────────────────────────────
export const bookmarksService = {
  getAll: async () => {
    const { data } = await apiClient.get<ApiResponse<Bookmark[]>>('/bookmarks/me');
    return data.data;
  },
  toggle: async (lessonId: string) => {
    const { data } = await apiClient.post<ApiResponse<{ bookmarked: boolean }>>(
      '/bookmarks/toggle',
      { targetType: 'LESSON', targetId: lessonId, title: 'Lesson bookmark' }
    );
    return data.data;
  },
  update: async (id: string, payload: Partial<Bookmark>) => {
    const { data } = await apiClient.patch<ApiResponse<Bookmark>>(`/bookmarks/${id}`, payload);
    return data.data;
  },
  remove: async (id: string) => {
    const { data } = await apiClient.delete<ApiResponse<{ deleted: boolean }>>(`/bookmarks/${id}`);
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
  unreadCount: async () => {
    const { data } = await apiClient.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
    return data.data?.count ?? 0;
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
    const { data } = await apiClient.get<ApiResponse<Array<Partial<LeaderboardEntry>>>>(
      `/leaderboard?limit=${limit}`
    );
    return (data.data ?? []).map((entry, index): LeaderboardEntry => {
      const xp = Number(entry.xp) || 0;
      return {
        rank: Number(entry.rank) || index + 1,
        userId: String(entry.userId ?? ''),
        name: entry.name?.trim() || entry.displayName?.trim() || 'Student',
        avatarUrl: entry.avatarUrl,
        xp,
        level: Number(entry.level) || Math.floor(xp / 1000) + 1,
      };
    });
  },
  getMyRank: async () => {
    const { data } = await apiClient.get<ApiResponse<{ rank: number; xp: number }>>(
      '/leaderboard/me'
    );
    return data.data;
  },
};

// ─── Gamification (UC44–UC45) ─────────────────────────────────────────────────
export const gamificationService = {
  getStats: async () => {
    const { data } = await apiClient.get<ApiResponse<any>>('/gamification/stats');
    const stats = data.data ?? {};
    return {
      userId: String(stats.userId ?? ''),
      xp: Number(stats.xp) || 0,
      level: Number(stats.level) || 1,
      streak: Number(stats.streak ?? stats.currentStreak) || 0,
      lastActivityAt: stats.lastActivityAt ?? stats.lastActiveDate,
      totalQuizzesPassed: Number(stats.totalQuizzesPassed ?? stats.quizzesCompleted) || 0,
      totalLessonsCompleted: Number(stats.totalLessonsCompleted) || 0,
    } satisfies UserStats;
  },
};

export const certificatesService = {
  mine: async () => {
    const { data } = await apiClient.get<ApiResponse<Certificate[]>>('/certificates/me');
    return data.data;
  },
  verify: async (code: string) => {
    const { data } = await apiClient.get<ApiResponse<Certificate>>(`/certificates/verify/${code}`);
    return data.data;
  },
};

// ─── AI (UC47–UC48) ───────────────────────────────────────────────────────────
export const aiService = {
  requestCourseRecommendation: async (payload: { courseId: string }) => {
    const { data } = await apiClient.post<ApiResponse<AIHistoryLog>>(
      '/ai/recommendation',
      payload
    );
    return data.data;
  },
  getHistory: async () => {
    const { data } = await apiClient.get<ApiResponse<AIHistoryLog[]>>('/ai/recommendation');
    return data.data;
  },
  recommendCode: async (payload: {
    lessonId?: string;
    courseId?: string;
    codeExecutionId?: string;
    inputCode: string;
    language: string;
  }) => {
    const { data } = await apiClient.post<ApiResponse<AIHistoryLog>>('/ai/recommend', payload);
    return data.data;
  },
  feedback: async (id: string, feedbackRating: number) => {
    const { data } = await apiClient.post<ApiResponse<AIHistoryLog>>(`/ai/history/${id}/feedback`, {
      feedbackRating,
    });
    return data.data;
  },
};

export const codeExecutionService = {
  run: async (payload: {
    sourceCode: string;
    language: string;
    stdin?: string;
    courseId?: string;
    lessonId?: string;
  }) => {
    const { data } = await apiClient.post<ApiResponse<any>>('/code-execution/run', payload);
    return data.data;
  },
  history: async (lessonId?: string) => {
    const { data } = await apiClient.get<ApiResponse<any[]>>('/code-execution/history', {
      params: lessonId ? { lessonId } : undefined,
    });
    return data.data;
  },
};

// ─── Exercises (UC66 — Coding Exercise + Test Cases) ─────────────────────────
export const exercisesService = {
  listByLesson: async (lessonId: string) => {
    const { data } = await apiClient.get<ApiResponse<any[]>>('/exercises', { params: { lessonId } });
    return data.data;
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<any>>(`/exercises/${id}`);
    return data.data;
  },
  create: async (payload: {
    lessonId: string;
    title: string;
    description?: string;
    starterCode?: string;
    language: string;
    testCases?: { input?: string; expectedOutput: string; isHidden?: boolean; points?: number }[];
    timeLimitMs?: number;
  }) => {
    const { data } = await apiClient.post<ApiResponse<any>>('/exercises', payload);
    return data.data;
  },
  update: async (id: string, payload: Partial<{ title: string; description: string; starterCode: string; language: string; testCases: any[]; timeLimitMs: number }>) => {
    const { data } = await apiClient.patch<ApiResponse<any>>(`/exercises/${id}`, payload);
    return data.data;
  },
  remove: async (id: string) => {
    const { data } = await apiClient.delete<ApiResponse<{ id: string }>>(`/exercises/${id}`);
    return data.data;
  },
  submit: async (id: string, sourceCode: string) => {
    const { data } = await apiClient.post<ApiResponse<{
      exerciseId: string;
      verdict: 'PASS' | 'PARTIAL' | 'FAIL' | 'ERROR';
      passedCases: number;
      totalCases: number;
      earnedPoints: number;
      totalPoints: number;
      score: number;
      testResults: { index: number; passed: boolean; isHidden: boolean; input?: string; expectedOutput?: string; actualOutput?: string; points: number; runtime?: string; stderr?: string }[];
    }>>(`/exercises/${id}/submit`, { sourceCode });
    return data.data;
  },
};

// ─── Admin (UC10–UC14) ────────────────────────────────────────────────────────
export const adminService = {
  getDashboardStatistics: async () => {
    const { data } = await apiClient.get<ApiResponse<AdminDashboardStatisticsResponse>>(
      '/admin/stats'
    );
    return data.data;
  },

  getStats: async (): Promise<PlatformStats> => adminService.getDashboardStatistics(),

  listStudents: async (query: AdminStudentListQuery = {}) => {
    const { data } = await apiClient.get<ApiResponse<AdminStudentListResponse>>(
      '/admin/students',
      { params: query }
    );
    return data.data;
  },

  listUsers: async (page = 1, limit = 20) => {
    const { data } = await apiClient.get<PaginatedApiResponse<User>>(
      '/admin/users',
      { params: { page, limit } }
    );
    return data.data;
  },

  createStudent: async (payload: AdminStudentCreateRequest) => {
    const { data } = await apiClient.post<ApiResponse<AdminStudent>>(
      '/admin/students',
      payload
    );
    return data.data;
  },

  updateStudent: async (id: string, payload: AdminStudentUpdateRequest) => {
    const { data } = await apiClient.patch<ApiResponse<AdminStudent>>(
      `/admin/students/${id}`,
      payload
    );
    return data.data;
  },

  updateUser: async (id: string, payload: Partial<User>) => {
    return adminService.updateStudent(id, payload as AdminStudentUpdateRequest);
  },

  lockStudent: async (id: string) => {
    const { data } = await apiClient.patch<ApiResponse<AdminStudent>>(
      `/admin/students/${id}/lock`
    );
    return data.data;
  },

  unlockStudent: async (id: string) => {
    const { data } = await apiClient.patch<ApiResponse<AdminStudent>>(
      `/admin/students/${id}/unlock`
    );
    return data.data;
  },

  toggleUserLock: async (id: string) => {
    return adminService.lockStudent(id);
  },

  // Course visibility + delete are exposed via `coursesService.setVisibility` /
  // `coursesService.delete` against /v1/courses/:id — no /admin prefix exists
  // on the backend, so these helpers were dead code and would 404.
};
