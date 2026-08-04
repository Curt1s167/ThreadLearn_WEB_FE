import Link from 'next/link';
import { BookOpen } from 'lucide-react';

export default function InstructorHomePage() {
  return (
    <main className="min-h-screen bg-canvas-cream px-6 py-12 text-ink md:px-12">
      <section className="mx-auto max-w-3xl rounded-3xl border border-black/10 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">Instructor workspace</p>
        <h1 className="mt-3 text-3xl font-light tracking-tight">Welcome to your instructor workspace</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-ink-muted">
          Review the courses that an Admin has assigned to your Instructor account.
        </p>
        <Link href="/instructor/courses" className="mt-6 inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-black/90"><BookOpen size={16} />View my courses</Link>
      </section>
    </main>
  );
}
