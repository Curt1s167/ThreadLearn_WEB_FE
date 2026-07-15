import dynamic from 'next/dynamic';

const ProfileGamificationPage = dynamic(
  () => import('@/features/profile/ProfileGamificationPage').then((module) => module.ProfileGamificationPage),
  {
    loading: () => (
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="h-80 rounded-lg skeleton" />
        <div className="flex flex-col gap-5">
          <div className="h-40 rounded-lg skeleton" />
          <div className="h-56 rounded-lg skeleton" />
        </div>
      </div>
    ),
  }
);

export default function Profile() {
  return <ProfileGamificationPage />;
}
