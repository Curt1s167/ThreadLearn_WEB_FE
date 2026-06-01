import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  courseService, lessonService, enrollmentService,
  type CourseListParams,
} from '../services/course.service';

// ─── Courses ──────────────────────────────────────────────────────────────────

export function useCourses(params: CourseListParams = {}) {
  return useQuery({
    queryKey: ['courses', params],
    queryFn:  () => courseService.list(params),
    staleTime: 30_000,
  });
}

export function useCourseDetail(courseId: string) {
  return useQuery({
    queryKey: ['course', courseId],
    queryFn:  () => courseService.detail(courseId),
    enabled:  !!courseId,
  });
}

export function useCreateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: courseService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Đã tạo khóa học mới');
    },
    onError: () => toast.error('Không thể tạo khóa học'),
  });
}

export function useUpdateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof courseService.update>[1] }) =>
      courseService.update(id, payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['course', vars.id] });
      qc.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Đã cập nhật khóa học');
    },
    onError: () => toast.error('Không thể cập nhật khóa học'),
  });
}

export function useTogglePublish() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      courseService.togglePublish(id, isPublished),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['course', vars.id] });
      qc.invalidateQueries({ queryKey: ['courses'] });
      toast.success(vars.isPublished ? 'Đã công khai khóa học' : 'Đã ẩn khóa học');
    },
    onError: () => toast.error('Không thể đổi trạng thái khóa học'),
  });
}

export function useDeleteCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: courseService.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Đã xóa khóa học');
    },
    onError: () => toast.error('Không thể xóa khóa học'),
  });
}

// ─── Lessons ──────────────────────────────────────────────────────────────────

export function useLesson(lessonId: string) {
  return useQuery({
    queryKey: ['lesson', lessonId],
    queryFn:  () => lessonService.detail(lessonId),
    enabled:  !!lessonId,
  });
}

export function useLessonsByCourse(courseId: string) {
  return useQuery({
    queryKey: ['lessons', 'by-course', courseId],
    queryFn:  () => lessonService.byCourse(courseId),
    enabled:  !!courseId,
  });
}

export function useCreateLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: lessonService.create,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['lessons', 'by-course', vars.courseId] });
      qc.invalidateQueries({ queryKey: ['course', vars.courseId] });
      toast.success('Đã thêm bài học');
    },
    onError: () => toast.error('Không thể thêm bài học'),
  });
}

export function useUpdateLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof lessonService.update>[1] }) =>
      lessonService.update(id, payload),
    onSuccess: (resp) => {
      qc.invalidateQueries({ queryKey: ['lesson', (resp as any)?.data?._id] });
      qc.invalidateQueries({ queryKey: ['lessons'] });
      toast.success('Đã cập nhật bài học');
    },
    onError: () => toast.error('Không thể cập nhật bài học'),
  });
}

export function useToggleLessonLock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isLocked }: { id: string; isLocked: boolean }) =>
      lessonService.toggleLock(id, isLocked),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['lessons'] });
      qc.invalidateQueries({ queryKey: ['lesson', vars.id] });
      toast.success(vars.isLocked ? 'Đã khóa bài học' : 'Đã mở khóa bài học');
    },
    onError: () => toast.error('Không thể đổi trạng thái bài học'),
  });
}

export function useDeleteLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: lessonService.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lessons'] });
      toast.success('Đã xóa bài học');
    },
    onError: () => toast.error('Không thể xóa bài học'),
  });
}

export function useCompleteLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: lessonService.complete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enrollments'] });
      qc.invalidateQueries({ queryKey: ['progress'] });
      toast.success('Đã đánh dấu hoàn thành');
    },
    onError: () => toast.error('Không thể hoàn thành bài học'),
  });
}

// ─── Enrollments ──────────────────────────────────────────────────────────────

export function useEnroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: enrollmentService.enroll,
    onSuccess: (_, courseId) => {
      qc.invalidateQueries({ queryKey: ['enrollments'] });
      qc.invalidateQueries({ queryKey: ['course', courseId] });
      toast.success('Đăng ký khóa học thành công 🎓');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Không thể đăng ký');
    },
  });
}

export function useMyEnrollments() {
  return useQuery({
    queryKey: ['enrollments', 'me'],
    queryFn:  enrollmentService.myEnrollments,
  });
}

export function useCourseProgress(courseId: string) {
  return useQuery({
    queryKey: ['progress', courseId],
    queryFn:  () => enrollmentService.progress(courseId),
    enabled:  !!courseId,
  });
}
