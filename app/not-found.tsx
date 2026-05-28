import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-center">
        <p className="font-mono font-bold text-[96px] text-white/5 leading-none">404</p>
        <h1 className="font-mono font-bold text-2xl text-gray-300 -mt-4">Page not found</h1>
        <p className="text-gray-600 font-mono text-sm mt-2">The page you are looking for does not exist.</p>
        <Link href="/dashboard" className="btn-primary mt-6 mx-auto inline-flex">
          Go home
        </Link>
      </div>
    </div>
  );
}
