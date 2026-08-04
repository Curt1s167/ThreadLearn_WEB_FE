import { apiClient } from './apiClient';
import type { ApiResponse, Course, CourseDetail } from '../types';

export const instructorService = {
  listCourses: async () => {
    const { data } = await apiClient.get<ApiResponse<Course[]>>('/instructor/courses');
    return data.data ?? [];
  },
  getCourse: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<{ course: CourseDetail }>>(`/instructor/courses/${id}`);
    return data.data.course;
  },
};
