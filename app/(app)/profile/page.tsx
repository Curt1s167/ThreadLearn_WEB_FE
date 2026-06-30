import dynamic from 'next/dynamic';

const ProfileGamificationPage = dynamic(
  () => import('@/features/profile/ProfileGamificationPage').then((module) => module.ProfileGamificationPage),
  {
    loading: () => (
      <div className="flex flex-col gap-5 max-w-2xl mx-auto">
        <div className="h-14 w-72 rounded-xl skeleton" />
        <div className="h-28 rounded-xl skeleton" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 rounded-xl skeleton" />
          <div className="h-24 rounded-xl skeleton" />
          <div className="h-24 rounded-xl skeleton" />
          <div className="h-24 rounded-xl skeleton" />
        </div>
      </div>
    ),
  }
);

export default function Profile() {
  return <ProfileGamificationPage />;
}
