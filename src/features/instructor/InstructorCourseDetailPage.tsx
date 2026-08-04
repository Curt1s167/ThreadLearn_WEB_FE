'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { instructorService } from '../../services/instructor.service';

export function InstructorCourseDetailPage({ courseId }: { courseId: string }) {
  const { data, isLoading, isError } = useQuery({ queryKey: ['instructor-course', courseId], queryFn: () => instructorService.getCourse(courseId) });
  if (isLoading) return <div className="h-48 animate-pulse rounded-xl bg-black/5" />;
  if (isError || !data) return <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">Unable to load this assigned course.</p>;
  return <section className="space-y-6"><header><p className="text-xs uppercase tracking-widest text-ink-faint">Instructor course</p><h1 className="mt-2 text-3xl font-semibold">{data.course.title}</h1><p className="mt-2 text-ink-muted">{data.course.description}</p></header><div className="grid gap-4 md:grid-cols-3"><Link href="/instructor/assignments" className="rounded-xl border border-black/10 bg-white p-5 hover:border-black/30"><h2 className="font-semibold">Code assignments</h2><p className="mt-2 text-sm text-ink-muted">Create, edit, and review submissions for this course&apos;s lessons.</p></Link><Link href="/instructor/quizzes" className="rounded-xl border border-black/10 bg-white p-5 hover:border-black/30"><h2 className="font-semibold">Quizzes</h2><p className="mt-2 text-sm text-ink-muted">Manage quizzes and question banks for this course&apos;s lessons.</p></Link><div className="rounded-xl border border-black/10 bg-white p-5"><h2 className="font-semibold">Curriculum</h2><p className="mt-2 text-sm text-ink-muted">{data.sections.length} sections · {data.lessons.length} lessons. Content changes are available through the instructor API.</p></div></div></section>;
}
