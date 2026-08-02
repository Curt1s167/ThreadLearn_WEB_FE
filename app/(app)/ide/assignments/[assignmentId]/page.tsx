import { AssignmentWorkspace } from '@/features/assignments/AssignmentWorkspace';

export default async function AssignmentPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = await params;
  return <AssignmentWorkspace assignmentId={assignmentId} />;
}
