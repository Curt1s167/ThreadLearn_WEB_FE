import dynamic from 'next/dynamic';

const QuizAttemptDetailPage = dynamic(
  () => import('@/features/quiz/QuizAttemptDetailPage').then((module) => module.QuizAttemptDetailPage),
  {
    loading: () => (
      <div className="flex flex-col gap-4 max-w-2xl mx-auto">
        <div className="h-14 rounded-xl skeleton" />
        <div className="h-32 rounded-xl skeleton" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-20 rounded-xl skeleton" />
          <div className="h-20 rounded-xl skeleton" />
        </div>
        <div className="h-48 rounded-xl skeleton" />
      </div>
    ),
  }
);

export default function QuizAttemptDetail() {
  return <QuizAttemptDetailPage />;
}
