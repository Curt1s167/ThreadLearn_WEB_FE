import dynamic from 'next/dynamic';

const QuizPage = dynamic(
  () => import('@/features/quiz/QuizPage').then((module) => module.QuizPage),
  {
    loading: () => (
      <div className="flex flex-col gap-4 max-w-2xl mx-auto">
        <div className="h-16 rounded-xl skeleton" />
        <div className="h-36 rounded-xl skeleton" />
        <div className="h-36 rounded-xl skeleton" />
        <div className="h-36 rounded-xl skeleton" />
      </div>
    ),
  }
);

export default function Quiz() {
  return <QuizPage />;
}
