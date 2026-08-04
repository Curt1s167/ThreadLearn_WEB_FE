import { InstructorCourseDetailPage } from '@/features/instructor/InstructorCourseDetailPage';

export default async function InstructorCoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  return <InstructorCourseDetailPage courseId={courseId} />;
}
