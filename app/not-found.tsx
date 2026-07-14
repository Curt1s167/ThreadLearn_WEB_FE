import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas-cream px-4 text-ink">
      <div className="max-w-md text-center">
        <p className="text-[96px] font-light leading-none text-black/10">404</p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">Page not found</h1>
        <p className="mt-2 text-sm text-ink-muted">
          The page you are looking for does not exist.
        </p>
        <Link href="/dashboard" className="btn-primary mt-6 inline-flex">
          Go home
        </Link>
      </div>
    </div>
  );
}
