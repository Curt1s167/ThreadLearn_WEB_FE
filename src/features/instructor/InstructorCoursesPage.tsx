'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, Clock3, Plus, Edit3 } from 'lucide-react';
import { coursesService } from '../../services';
import type { CourseStatus } from '../../types';

const statusClass = (status?: CourseStatus) => {
  if (status === 'published') return 'bg-emerald-100 text-emerald-800';
  if (status === 'hidden') return 'bg-amber-100 text-amber-800';
  if (status === 'archived') return 'bg-rose-100 text-rose-800';
  return 'bg-black/5 text-black/60';
};

export default function InstructorCoursesPage() {
  const coursesQuery = useQuery({
    queryKey: ['instructor-courses'],
    queryFn: () => coursesService.listMyInstructorCourses({ page: 1, limit: 100 }),
  });

  return (
    <main className="min-h-screen bg-canvas-cream px-6 py-10 text-ink md:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <Link href="/instructor" className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink">
            <ArrowLeft size={15} /> Instructor workspace
          </Link>
          <Link
            href="/instructor/courses/new"
            className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-black/80"
          >
            <Plus size={16} /> Create Course
          </Link>
        </div>

        <section className="mt-5 rounded-3xl border border-black/10 bg-white p-7 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">Authoring & Management</p>
          <h1 className="mt-2 text-3xl font-light tracking-tight">My Courses</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">
            Create new draft courses or edit sections and details for courses assigned to your instructor account.
          </p>
        </section>

        {coursesQuery.isLoading ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="h-44 animate-pulse rounded-2xl bg-white" />
            <div className="h-44 animate-pulse rounded-2xl bg-white" />
          </div>
        ) : null}

        {coursesQuery.isError ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
            Unable to load your assigned courses.
          </div>
        ) : null}

        {coursesQuery.data && coursesQuery.data.items.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-black/15 bg-white p-10 text-center">
            <BookOpen className="mx-auto text-black/35" />
            <h2 className="mt-3 font-medium">No assigned courses</h2>
            <p className="mt-1 text-sm text-ink-muted">You can create a new draft course or an Admin can assign one to you.</p>
            <Link
              href="/instructor/courses/new"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
            >
              <Plus size={15} /> Create Course
            </Link>
          </div>
        ) : null}

        {coursesQuery.data && coursesQuery.data.items.length > 0 ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {coursesQuery.data.items.map((course) => {
              const courseId = course.id ?? course._id;
              return (
                <article key={courseId} className="flex flex-col justify-between rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-lg font-medium">{course.title}</h2>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${statusClass(course.status)}`}>
                        {course.status ?? 'draft'}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-ink-muted">
                      {course.shortDescription || course.description}
                    </p>
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-black/5 pt-4">
                    <div className="flex items-center gap-3 text-xs text-black/50">
                      <span>{course.level}</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 size={13} />
                        {course.estimatedDuration ?? 0} min
                      </span>
                    </div>
                    <Link
                      href={`/instructor/courses/${courseId}/edit`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-black/5"
                    >
                      <Edit3 size={13} /> Edit & Sections
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </div>
    </main>
  );
}
