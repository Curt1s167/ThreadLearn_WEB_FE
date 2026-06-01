import { apiClient } from './apiClient';
import type {
  ApiResponse, PaginatedV2Response,
  Course, Lesson, Enrollment,
} from '../types';

export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export interface CourseListParams {
  q?:        string;
  level?:    CourseLevel;
  category?: string;
  tag?:      string;
  minPrice?: number;
  maxPrice?: number;
  page?:     number;
  limit?:    number;
}

export interface CourseDetailResp {
  course:     Course;
  lessons:    Lesson[];
  isEnrolled: boolean;
  progress:   number;
}

export const courseService = {
  // ─── UC23 / UC24 — public ──────────────────────────────────────────────────
  list: (params: CourseListParams = {}) =>
    apiClient.get<PaginatedV2Response<Course>>('/courses', { params }).then(r => r.data),

  search: (params: CourseListParams) =>
    apiClient.get<PaginatedV2Response<Course>>('/courses/search', { params }).then(r => r.data),

  detail: (id: string) =>
    apiClient.get<ApiResponse<CourseDetailResp>>(`/courses/${id}`).then(r => r.data),

  // ─── UC15 / UC16 / UC17 / UC18 — admin ─────────────────────────────────────
  create: (payload: Partial<Course>) =>
    apiClient.post<ApiResponse<Course>>('/courses', payload).then(r => r.data),

  update: (id: string, payload: Partial<Course>) =>
    apiClient.put<ApiResponse<Course>>(`/courses/${id}`, payload).then(r => r.data),

  togglePublish: (id: string, isPublished: boolean) =>
    apiClient.patch<ApiResponse<Course>>(`/courses/${id}/publish`, { isPublished }).then(r => r.data),

  remove: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/courses/${id}`).then(r => r.data),
};

export const lessonService = {
  // UC25
  detail: (id: string) =>
    apiClient.get<ApiResponse<Lesson>>(`/lessons/${id}`).then(r => r.data),

  byCourse: (courseId: string) =>
    apiClient.get<ApiResponse<Lesson[]>>(`/lessons/by-course/${courseId}`).then(r => r.data),

  // UC19 / UC20
  create: (payload: Partial<Lesson> & { courseId: string }) =>
    apiClient.post<ApiResponse<Lesson>>('/lessons', payload).then(r => r.data),

  update: (id: string, payload: Partial<Lesson>) =>
    apiClient.put<ApiResponse<Lesson>>(`/lessons/${id}`, payload).then(r => r.data),

  // UC21
  toggleLock: (id: string, isLocked: boolean) =>
    apiClient.patch<ApiResponse<Lesson>>(`/lessons/${id}/lock`, { isLocked }).then(r => r.data),

  // UC22
  remove: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/lessons/${id}`).then(r => r.data),

  // UC27
  complete: (id: string) =>
    apiClient.post<ApiResponse<{
      progress: number; totalLessons: number; completedLessons: number; courseCompleted: boolean;
    }>>(`/lessons/${id}/complete`).then(r => r.data),
};

export const enrollmentService = {
  // UC26
  enroll: (courseId: string) =>
    apiClient.post<ApiResponse<Enrollment>>('/enrollments', { courseId }).then(r => r.data),

  // UC28
  myEnrollments: () =>
    apiClient.get<ApiResponse<Enrollment[]>>('/enrollments/me').then(r => r.data),

  progress: (courseId: string) =>
    apiClient.get<ApiResponse<{
      enrollment: Enrollment;
      totalLessons: number;
      completedLessonIds: string[];
      completedCount: number;
      progress: number;
      completed: boolean;
    }>>(`/enrollments/me/progress/${courseId}`).then(r => r.data),
};
