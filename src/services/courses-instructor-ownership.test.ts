import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
  },
}));

import { apiClient } from './apiClient';
import { coursesService } from './index';

describe('course instructor ownership API client', () => {
  beforeEach(() => vi.clearAllMocks());

  it('uses the dedicated Admin endpoint for assign and unassign', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ data: { data: { id: 'course-1' } } });

    await coursesService.assignInstructor('course-1', { instructorId: null });

    expect(apiClient.patch).toHaveBeenCalledWith('/admin/courses/course-1/instructor', {
      instructorId: null,
    });
  });

  it('uses the read-only Instructor endpoint and drops ownership override fields', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } },
    });

    await coursesService.listMyInstructorCourses({
      page: 1,
      limit: 20,
      instructorId: 'instructor-b',
      includeDeleted: true,
    } as never);

    expect(apiClient.get).toHaveBeenCalledWith('/instructor/courses', {
      params: {
        page: 1,
        limit: 20,
        q: undefined,
        search: undefined,
        level: undefined,
        language: undefined,
        status: undefined,
      },
    });
  });

  it('uses POST /instructor/courses for instructor course creation', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { data: { id: 'course-1', title: 'New Course' } } });

    const result = await coursesService.createMyInstructorCourse({
      title: 'New Course',
      description: 'Desc',
    });

    expect(apiClient.post).toHaveBeenCalledWith('/instructor/courses', {
      title: 'New Course',
      description: 'Desc',
    });
    expect(result.id).toBe('course-1');
  });

  it('uses PUT /instructor/courses/:id for instructor course update', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({ data: { data: { id: 'course-1', title: 'Updated' } } });

    await coursesService.updateMyInstructorCourse('course-1', {
      title: 'Updated',
    });

    expect(apiClient.put).toHaveBeenCalledWith('/instructor/courses/course-1', {
      title: 'Updated',
    });
  });

  it('uses GET /instructor/courses/:id for instructor course detail', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { data: { course: { id: 'course-1' }, sections: [], lessons: [] } } });

    const result = await coursesService.getMyInstructorCourseById('course-1');

    expect(apiClient.get).toHaveBeenCalledWith('/instructor/courses/course-1');
    expect(result.course.id).toBe('course-1');
  });
});
