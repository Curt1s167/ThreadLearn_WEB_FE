import dynamic from 'next/dynamic';

const LeaderboardPage = dynamic(
  () => import('@/features/leaderboard/LeaderboardPage').then((module) => module.LeaderboardPage),
  {
    loading: () => (
      <div className="flex flex-col gap-5 max-w-2xl mx-auto">
        <div className="h-20 rounded-xl skeleton" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-24 rounded-xl skeleton" />
          <div className="h-32 rounded-xl skeleton" />
          <div className="h-24 rounded-xl skeleton" />
        </div>
        <div className="h-96 rounded-xl skeleton" />
      </div>
    ),
  }
);

export default function Leaderboard() {
  return <LeaderboardPage />;
}
