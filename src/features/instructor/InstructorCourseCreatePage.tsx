'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { coursesService } from '../../services';

export default function InstructorCourseCreatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    shortDescription: '',
    language: 'javascript' as 'javascript' | 'java' | 'python',
    level: 'BEGINNER' as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
    category: '',
    estimatedDuration: 60,
    tagsInput: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Title and description are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tags = formData.tagsInput
        ? formData.tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

      const course = await coursesService.createMyInstructorCourse({
        title: formData.title,
        description: formData.description,
        shortDescription: formData.shortDescription || undefined,
        language: formData.language,
        level: formData.level,
        category: formData.category || undefined,
        estimatedDuration: Number(formData.estimatedDuration) || 0,
        tags,
      });

      const courseId = course.id ?? course._id;
      router.push(`/instructor/courses/${courseId}/edit`);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to create course.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-canvas-cream px-6 py-10 text-ink md:px-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/instructor/courses" className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={15} /> Back to My Courses
        </Link>

        <section className="mt-5 rounded-3xl border border-black/10 bg-white p-7 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">New Course</p>
          <h1 className="mt-2 text-3xl font-light tracking-tight">Create Draft Course</h1>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            Course will be created in draft mode and assigned to your instructor account.
          </p>

          {error ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-ink-muted">Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Master JavaScript ES6+"
                className="mt-1 w-full rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-ink-muted">Short Description</label>
              <input
                type="text"
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                placeholder="Brief summary of the course..."
                className="mt-1 w-full rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-ink-muted">Full Description *</label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed explanation of what students will learn..."
                className="mt-1 w-full rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-black"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-ink-muted">Language</label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value as any })}
                  className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm outline-none"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="java">Java</option>
                  <option value="python">Python</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-ink-muted">Level</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
                  className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm outline-none"
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-ink-muted">Est. Duration (mins)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.estimatedDuration}
                  onChange={(e) => setFormData({ ...formData, estimatedDuration: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm outline-none"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-ink-muted">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g. Web Development"
                  className="mt-1 w-full rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-ink-muted">Tags (comma separated)</label>
                <input
                  type="text"
                  value={formData.tagsInput}
                  onChange={(e) => setFormData({ ...formData, tagsInput: e.target.value })}
                  placeholder="react, frontend, javascript"
                  className="mt-1 w-full rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm outline-none"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-3 border-t border-black/10 pt-5">
              <Link
                href="/instructor/courses"
                className="rounded-xl border border-black/15 bg-white px-4 py-2 text-sm font-medium hover:bg-black/5"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-black px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-black/80 disabled:opacity-50"
              >
                <Save size={15} />
                {loading ? 'Creating...' : 'Create Course & Continue'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
