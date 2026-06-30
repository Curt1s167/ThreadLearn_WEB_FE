import dynamic from 'next/dynamic';

const QuizHistoryPage = dynamic(
  () => import('@/features/quiz/QuizHistoryPage').then((module) => module.QuizHistoryPage),
  {
    loading: () => (
      <div className="flex flex-col gap-5 max-w-2xl mx-auto">
        <div className="h-12 w-64 rounded-xl skeleton" />
        <div className="flex flex-col gap-2">
          <div className="h-16 rounded-xl skeleton" />
          <div className="h-16 rounded-xl skeleton" />
          <div className="h-16 rounded-xl skeleton" />
        </div>
      </div>
    ),
  }
);

export default function QuizHistory() {
  return <QuizHistoryPage />;
}
