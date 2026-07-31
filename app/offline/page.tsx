import Link from 'next/link';

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f7f4] p-6 text-[#10231f]">
      <section className="w-full max-w-lg rounded-3xl border border-[#d9e4df] bg-white p-8 text-center shadow-sm">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#28735b]">
          ThreadLearn
        </p>
        <h1 className="text-2xl font-bold">You&apos;re offline</h1>
        <p className="mt-3 text-sm leading-6 text-[#526660]">
          We couldn&apos;t load this page without an internet connection. Reconnect, then try again.
        </p>
        <Link
          className="mt-6 inline-flex rounded-full bg-[#0f352d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#16483d]"
          href="/"
        >
          Try again
        </Link>
      </section>
    </main>
  );
}
