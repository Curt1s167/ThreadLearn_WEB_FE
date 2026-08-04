'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, ClipboardCheck } from 'lucide-react';
import { instructorService } from '../../services/instructor.service';

export function InstructorDashboardPage() {
  const { data: courses = [], isLoading, isError } = useQuery({ queryKey: ['instructor-courses'], queryFn: instructorService.listCourses });
  const drafts = courses.filter((course) => course.status === 'draft' || course.status === 'hidden').length;
  return <section className="space-y-6">
    <div><p className="text-xs uppercase tracking-widest text-ink-faint">Instructor workspace</p><h1 className="mt-2 text-3xl font-semibold">Manage your courses</h1><p className="mt-2 text-sm text-ink-muted">Create and maintain lessons, quizzes, and code assignments only for courses assigned to you.</p></div>
    {isLoading ? <div className="h-36 animate-pulse rounded-xl bg-black/5" /> : isError ? <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">Unable to load your assigned courses.</p> : <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-xl border border-black/10 bg-white p-5"><BookOpen size={20}/><p className="mt-4 text-3xl font-semibold">{courses.length}</p><p className="text-sm text-ink-muted">Assigned courses</p></div>
      <div className="rounded-xl border border-black/10 bg-white p-5"><ClipboardCheck size={20}/><p className="mt-4 text-3xl font-semibold">{drafts}</p><p className="text-sm text-ink-muted">Editable courses</p></div>
    </div>}
    <Link href="/instructor/courses" className="inline-flex rounded-full bg-black px-4 py-2 text-sm font-medium text-white">Open my courses</Link>
  </section>;
}
