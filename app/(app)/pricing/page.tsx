import dynamic from 'next/dynamic';

const PricingPage = dynamic(
  () => import('@/features/subscription/PricingPage').then((module) => module.PricingPage),
  {
    loading: () => (
      <div className="flex flex-col gap-5 max-w-4xl mx-auto">
        <div className="h-14 w-72 rounded-xl skeleton" />
        <div className="grid md:grid-cols-3 gap-4">
          <div className="h-72 rounded-xl skeleton" />
          <div className="h-72 rounded-xl skeleton" />
          <div className="h-72 rounded-xl skeleton" />
        </div>
      </div>
    ),
  }
);

export default function Pricing() {
  return <PricingPage />;
}
