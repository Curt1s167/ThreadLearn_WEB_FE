import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./apiClient', () => ({
  apiClient: {
    get: vi.fn(),
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
});
