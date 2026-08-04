import InstructorCourseEditorPage from '@/features/instructor/InstructorCourseEditorPage';

export default async function Page({ params }: { params: Promise<{ courseId: string }> }) {
  const resolvedParams = await params;
  return <InstructorCourseEditorPage courseId={resolvedParams.courseId} />;
}
