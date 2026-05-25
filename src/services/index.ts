import { apiClient } from './apiClient';
import type {
  ApiResponse,
  PaginatedApiResponse,
  Course,
  CourseCreatePayload,
  CourseFilters,
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
} from '../types';

// ─── Courses (UC15–UC25) ──────────────────────────────────────────────────────
export const coursesService = {
  list: async (filters: CourseFilters = {}) => {
    const { data } = await apiClient.get<PaginatedApiResponse<Course>>('/courses', {
      params: filters,
    });
    return data.data;
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<Course>>(`/courses/${id}`);
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
  uploadThumbnail: async (file: File) => {
    const form = new FormData();
    form.append('thumbnail', file);
    const { data } = await apiClient.post<ApiResponse<{ thumbnailUrl: string }>>(
      '/courses/thumbnail',
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
      `/comments?lessonId=${lessonId}`
    );
    return data.data;
  },
  create: async (payload: { lessonId: string; content: string; parentId?: string }) => {
    const { data } = await apiClient.post<ApiResponse<Comment>>('/comments', payload);
    return data.data;
  },
  update: async (id: string, content: string) => {
    const { data } = await apiClient.put<ApiResponse<Comment>>(`/comments/${id}`, {
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
    const { data } = await apiClient.get<ApiResponse<Bookmark[]>>('/bookmarks');
    return data.data;
  },
  toggle: async (lessonId: string) => {
    const { data } = await apiClient.post<ApiResponse<{ bookmarked: boolean }>>(
      '/bookmarks',
      { lessonId }
    );
    return data.data;
  },
};

// ─── Notes (UC40) ─────────────────────────────────────────────────────────────
export const notesService = {
  getByLesson: async (lessonId: string) => {
    const { data } = await apiClient.get<ApiResponse<Note>>(
      `/notes?lessonId=${lessonId}`
    );
    return data.data;
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
    const { data } = await apiClient.get<ApiResponse<{ rank: number; xp: number }>>(
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
      `/admin/users?page=${page}&limit=${limit}`
    );
    return data.data;
  },
  createStudent: async (payload: { name: string; email: string; password: string }) => {
    const { data } = await apiClient.post<ApiResponse<User>>(
      '/admin/users',
      payload
    );
    return data.data;
  },
  updateUser: async (id: string, payload: Partial<User>) => {
    const { data } = await apiClient.put<ApiResponse<User>>(
      `/admin/users/${id}`,
      payload
    );
    return data.data;
  },
  toggleUserLock: async (id: string) => {
    const { data } = await apiClient.patch<ApiResponse<User>>(
      `/admin/users/${id}/lock`
    );
    return data.data;
  },
  toggleCoursePublish: async (id: string) => {
    const { data } = await apiClient.patch<ApiResponse<Course>>(
      `/admin/courses/${id}/publish`
    );
    return data.data;
  },
  deleteCourse: async (id: string) => {
    const { data } = await apiClient.delete<ApiResponse<null>>(
      `/admin/courses/${id}`
    );
    return data;
  },
};
