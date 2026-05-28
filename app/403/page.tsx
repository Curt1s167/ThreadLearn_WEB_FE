import Link from 'next/link';

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-center">
        <p className="font-mono font-bold text-[80px] text-white/5">403</p>
        <p className="font-mono text-gray-400 -mt-2">Access denied</p>
        <Link href="/dashboard" className="btn-primary mt-6 mx-auto inline-flex">
          Go home
        </Link>
      </div>
    </div>
  );
}
