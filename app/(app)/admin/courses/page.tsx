'use client';

import { BookOpen, Eye, FileEdit, UploadCloud } from 'lucide-react';

const courseActions = [
  ['Draft content', FileEdit],
  ['Publish control', Eye],
  ['Thumbnail upload', UploadCloud],
];

export default function AdminCourses() {
  return (
    <div className="space-y-6 text-ink">
      <section className="rounded-lg bg-white p-6 sm:p-8">
        <span className="inline-flex rounded-full bg-[#bfdbfe] px-3 py-1 text-xs font-medium text-black">
          Admin · UC15-UC22
        </span>
        <h1 className="mt-5 text-4xl font-light tracking-tight">Course management</h1>
        <p className="mt-3 max-w-2xl text-black/60">
          Placeholder surface for course authoring, lesson structure, publishing, and media management.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {courseActions.map(([label, Icon]) => (
          <div key={label as string} className="rounded-lg border border-black/10 bg-white p-5">
            <Icon size={22} />
            <p className="mt-4 font-semibold">{label as string}</p>
            <p className="mt-2 text-sm text-black/55">Ready for the owning dev to connect.</p>
          </div>
        ))}
      </div>

      <div className="accent-surface rounded-lg p-5">
        <BookOpen size={22} />
        <p className="mt-3 font-semibold">Student catalog and detail pages already keep the real course APIs.</p>
      </div>
    </div>
  );
}
