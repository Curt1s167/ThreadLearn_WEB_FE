'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, ListTree, Rows3 } from 'lucide-react';
import {
  estimateReadMinutes,
  parseLessonOutline,
  splitLessonSections,
  type LessonOutlineItem,
} from './lessonContent';
import { LessonMarkdown } from './LessonMarkdown';

type ReadMode = 'sections' | 'full';

const proseClass =
  'prose prose-neutral max-w-none text-base leading-8 text-black/70 ' +
  '[&_a]:text-black [&_code]:rounded [&_code]:bg-black/[0.04] [&_code]:px-1.5 [&_code]:py-0.5 ' +
  '[&_h1]:scroll-mt-28 [&_h1]:text-3xl [&_h1]:font-light [&_h1]:tracking-tight [&_h1]:text-ink ' +
  '[&_h2]:scroll-mt-28 [&_h2]:mt-10 [&_h2]:border-b [&_h2]:border-black/10 [&_h2]:pb-2 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-ink ' +
  '[&_h3]:scroll-mt-28 [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-ink ' +
  '[&_li]:marker:text-black/40 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-black/10 ' +
  '[&_pre]:bg-[#111827] [&_pre]:p-4 [&_pre]:text-sm [&_pre]:leading-6 [&_pre]:text-[#d9f99d] ' +
  '[&_blockquote]:border-l-4 [&_blockquote]:border-[#d9f99d] [&_blockquote]:bg-black/[0.02] [&_blockquote]:py-1 [&_blockquote]:not-italic';

function OutlineNav({
  items,
  activeId,
  onSelect,
  compact,
}: {
  items: LessonOutlineItem[];
  activeId?: string;
  onSelect: (item: LessonOutlineItem) => void;
  compact?: boolean;
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-black/45">
        Chưa có tiêu đề `##` trong bài — thêm heading Markdown để sinh mục lục.
      </p>
    );
  }

  return (
    <nav aria-label="Mục lục bài học" className={compact ? 'space-y-0.5' : 'space-y-1'}>
      {items.map((item) => {
        const active = activeId === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item)}
            className={`block w-full rounded-md text-left transition ${
              item.level === 3 ? 'pl-4' : 'pl-2'
            } pr-2 py-1.5 text-sm ${
              active
                ? 'bg-black text-white'
                : 'text-black/65 hover:bg-black/[0.04] hover:text-ink'
            }`}
          >
            <span className={item.level === 3 ? 'font-normal' : 'font-medium'}>{item.text}</span>
          </button>
        );
      })}
    </nav>
  );
}

export function LessonReader({ content }: { content: string }) {
  const outline = useMemo(() => parseLessonOutline(content), [content]);
  const sections = useMemo(() => splitLessonSections(content), [content]);
  const readMinutes = useMemo(() => estimateReadMinutes(content), [content]);

  const [mode, setMode] = useState<ReadMode>('sections');
  const [sectionIndex, setSectionIndex] = useState(0);
  const [activeId, setActiveId] = useState<string | undefined>(outline[0]?.id);

  useEffect(() => {
    setSectionIndex(0);
    setActiveId(outline[0]?.id);
  }, [content, outline]);

  const current = sections[sectionIndex] ?? sections[0];
  const canPrev = sectionIndex > 0;
  const canNext = sectionIndex < sections.length - 1;

  const goToOutlineItem = (item: LessonOutlineItem) => {
    setActiveId(item.id);
    if (mode === 'sections') {
      setSectionIndex(Math.min(item.sectionIndex, Math.max(0, sections.length - 1)));
      return;
    }
    const el = document.getElementById(item.id);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      {/* TOC — desktop sticky */}
      <aside className="hidden lg:block">
        <div className="sticky top-24 space-y-4 rounded-lg border border-black/10 bg-[#fafafa] p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-black/40">Mục lục</p>
              <p className="mt-1 text-sm font-semibold text-ink">
                {outline.length} đề mục · ~{readMinutes} phút
              </p>
            </div>
            <ListTree size={18} className="text-black/40" />
          </div>

          <div className="flex rounded-full bg-black/[0.05] p-1">
            <button
              type="button"
              onClick={() => setMode('sections')}
              className={`flex flex-1 items-center justify-center gap-1 rounded-full px-2 py-1.5 text-xs font-medium ${
                mode === 'sections' ? 'bg-white text-ink shadow-sm' : 'text-black/50'
              }`}
            >
              <Rows3 size={13} />
              Từng phần
            </button>
            <button
              type="button"
              onClick={() => setMode('full')}
              className={`flex flex-1 items-center justify-center gap-1 rounded-full px-2 py-1.5 text-xs font-medium ${
                mode === 'full' ? 'bg-white text-ink shadow-sm' : 'text-black/50'
              }`}
            >
              <BookOpen size={13} />
              Toàn bài
            </button>
          </div>

          {mode === 'sections' ? (
            <div className="space-y-1 border-t border-black/10 pt-3">
              <p className="px-2 text-[11px] uppercase tracking-[0.14em] text-black/40">
                Phần {sectionIndex + 1}/{sections.length}
              </p>
              {sections.map((section, index) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => {
                    setSectionIndex(index);
                    setActiveId(section.id);
                  }}
                  className={`block w-full rounded-md px-2 py-1.5 text-left text-sm transition ${
                    index === sectionIndex
                      ? 'bg-black text-white'
                      : 'text-black/65 hover:bg-black/[0.04]'
                  }`}
                >
                  <span className="mr-1.5 text-xs opacity-60">{index + 1}.</span>
                  {section.title}
                </button>
              ))}
            </div>
          ) : (
            <div className="max-h-[55vh] overflow-y-auto border-t border-black/10 pt-3">
              <OutlineNav items={outline} activeId={activeId} onSelect={goToOutlineItem} />
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="min-w-0 space-y-4">
        {/* Mobile controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-black/10 bg-[#fafafa] px-3 py-2 lg:hidden">
          <div className="flex rounded-full bg-black/[0.05] p-1">
            <button
              type="button"
              onClick={() => setMode('sections')}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                mode === 'sections' ? 'bg-white shadow-sm' : 'text-black/50'
              }`}
            >
              Từng phần
            </button>
            <button
              type="button"
              onClick={() => setMode('full')}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                mode === 'full' ? 'bg-white shadow-sm' : 'text-black/50'
              }`}
            >
              Toàn bài
            </button>
          </div>
          <span className="text-xs text-black/45">
            {outline.length} đề mục · ~{readMinutes} phút đọc
          </span>
        </div>

        {mode === 'sections' && current ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-black/10 bg-white px-4 py-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-black/40">
                  Phần {sectionIndex + 1} / {sections.length}
                </p>
                <h2 className="mt-0.5 text-lg font-semibold text-ink">{current.title}</h2>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!canPrev}
                  onClick={() => setSectionIndex((i) => Math.max(0, i - 1))}
                  className="inline-flex items-center gap-1 rounded-full border border-black/10 px-3 py-1.5 text-sm disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Trước
                </button>
                <button
                  type="button"
                  disabled={!canNext}
                  onClick={() => setSectionIndex((i) => Math.min(sections.length - 1, i + 1))}
                  className="inline-flex items-center gap-1 rounded-full bg-black px-3 py-1.5 text-sm text-white disabled:opacity-40"
                >
                  Tiếp
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className={proseClass}>
              <LessonMarkdown content={current.markdown} />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-4">
              <button
                type="button"
                disabled={!canPrev}
                onClick={() => setSectionIndex((i) => Math.max(0, i - 1))}
                className="inline-flex items-center gap-1 text-sm text-black/55 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                {canPrev ? sections[sectionIndex - 1]?.title : 'Đầu bài'}
              </button>
              <button
                type="button"
                disabled={!canNext}
                onClick={() => setSectionIndex((i) => Math.min(sections.length - 1, i + 1))}
                className="inline-flex items-center gap-1 rounded-full bg-[#d9f99d] px-4 py-2 text-sm font-medium text-ink disabled:opacity-40"
              >
                {canNext ? `Tiếp: ${sections[sectionIndex + 1]?.title}` : 'Hết bài'}
                <ChevronRight size={16} />
              </button>
            </div>
          </>
        ) : (
          <div className={proseClass}>
            <LessonMarkdown content={content} />
          </div>
        )}

        {/* Mobile outline under content */}
        <details className="rounded-lg border border-black/10 bg-white p-4 lg:hidden">
          <summary className="cursor-pointer text-sm font-semibold text-ink">Mở mục lục đầy đủ</summary>
          <div className="mt-3 max-h-64 overflow-y-auto">
            <OutlineNav items={outline} activeId={activeId} onSelect={goToOutlineItem} compact />
          </div>
        </details>
      </div>
    </div>
  );
}
