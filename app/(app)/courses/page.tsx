'use client';

import { Suspense } from 'react';
import { CoursesPage as CoursesPageComponent } from '@/features/courses/CoursesPage';

export default function Courses() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center"><div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <CoursesPageComponent />
    </Suspense>
  );
}
