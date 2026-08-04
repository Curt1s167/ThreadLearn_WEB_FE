'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { instructorService } from '../../services/instructor.service';

export default function InstructorCoursesPage() {
  const { data: courses = [], isLoading, isError } = useQuery({ queryKey: ['instructor-courses'], queryFn: instructorService.listCourses });
  if (isLoading) return <div className="h-48 animate-pulse rounded-xl bg-black/5" />;
  if (isError) return <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">Unable to load assigned courses.</p>;
  return <section><div className="mb-6"><p className="text-xs uppercase tracking-widest text-ink-faint">Instructor</p><h1 className="mt-2 text-3xl font-semibold">My courses</h1></div>{courses.length ? <div className="grid gap-4 md:grid-cols-2">{courses.map((course) => <Link key={course._id} href={`/instructor/courses/${course._id}/edit`} className="rounded-xl border border-black/10 bg-white p-5 transition hover:border-black/30"><p className="text-xs uppercase text-ink-faint">{course.status}</p><h2 className="mt-2 font-semibold">{course.title}</h2><p className="mt-2 line-clamp-2 text-sm text-ink-muted">{course.description}</p></Link>)}</div> : <p className="rounded-xl border border-black/10 bg-white p-5 text-sm text-ink-muted">No course has been assigned to you yet.</p>}</section>;
}
