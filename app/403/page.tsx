import Link from 'next/link';

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas-cream px-4 text-ink">
      <div className="max-w-md text-center">
        <p className="text-[80px] font-light leading-none text-black/10">403</p>
        <p className="mt-2 text-xl font-semibold text-ink">Access denied</p>
        <p className="mt-2 text-sm text-ink-muted">
          You do not have permission to view this page.
        </p>
        <Link href="/dashboard" className="btn-primary mt-6 inline-flex">
          Go home
        </Link>
      </div>
    </div>
  );
}
