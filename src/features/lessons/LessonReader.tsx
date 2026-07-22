'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, ListTree, Rows3 } from 'lucide-react';
import {
  estimateReadMinutes,
  parseLessonOutline,
  splitLessonSections,
  stripRepeatedLessonTitle,
  type LessonOutlineItem,
} from './lessonContent';
import { LessonMarkdown } from './LessonMarkdown';

type ReadMode = 'sections' | 'full';

const proseClass = 'guided-lesson-prose prose max-w-none';

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
      <p className="text-sm text-ink-faint">
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
            className={`guided-outline-item block w-full text-left ${
              item.level === 3 ? 'pl-4' : 'pl-2'
            } pr-2 ${active ? 'guided-outline-item-active' : ''}`}
          >
            <span className={item.level === 3 ? 'font-normal' : 'font-medium'}>{item.text}</span>
          </button>
        );
      })}
    </nav>
  );
}

export function LessonReader({
  content,
  lessonTitle,
  checklistStorageKey,
  onReadComplete,
}: {
  content: string;
  lessonTitle: string;
  checklistStorageKey?: string;
  onReadComplete?: () => void;
}) {
  const displayContent = useMemo(
    () => stripRepeatedLessonTitle(content, lessonTitle),
    [content, lessonTitle],
  );
  const outline = useMemo(() => parseLessonOutline(displayContent), [displayContent]);
  const sections = useMemo(() => splitLessonSections(displayContent), [displayContent]);
  const readMinutes = useMemo(() => estimateReadMinutes(displayContent), [displayContent]);

  const [mode, setMode] = useState<ReadMode>('sections');
  const [sectionIndex, setSectionIndex] = useState(0);
  const [activeId, setActiveId] = useState<string | undefined>(outline[0]?.id);

  useEffect(() => {
    setSectionIndex(0);
    setActiveId(outline[0]?.id);
  }, [displayContent, outline]);

  const current = sections[sectionIndex] ?? sections[0];
  const canPrev = sectionIndex > 0;
  const canNext = sectionIndex < sections.length - 1;

  const goToSection = (index: number) => {
    const nextIndex = Math.min(Math.max(index, 0), Math.max(0, sections.length - 1));
    setSectionIndex(nextIndex);
    setActiveId(sections[nextIndex]?.id);
    if (nextIndex === sections.length - 1) onReadComplete?.();
  };

  const goToOutlineItem = (item: LessonOutlineItem) => {
    setActiveId(item.id);
    if (mode === 'sections') {
      const firstH2 = outline.find((outlineItem) => outlineItem.level === 2);
      const firstH2SectionIndex = firstH2
        ? Math.max(0, sections.findIndex((section) => section.id === firstH2.id))
        : 0;
      goToSection(item.sectionIndex + firstH2SectionIndex);
      return;
    }
    const el = document.getElementById(item.id);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div
      className="guided-reader-grid notranslate grid gap-5 2xl:grid-cols-[minmax(13.5rem,15rem)_minmax(0,1fr)] 2xl:gap-6"
      translate="no"
    >
      {/* TOC — desktop sticky */}
      <aside className="hidden 2xl:block">
        <div className="guided-reader-surface sticky top-24 space-y-4 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-ink-faint">Mục lục</p>
              <p className="mt-1 text-sm font-semibold text-ink">
                {outline.length} đề mục · ~{readMinutes} phút
              </p>
            </div>
            <ListTree size={18} className="text-ink-faint" />
          </div>

          <div className="guided-segmented-control grid grid-cols-2 p-1">
            <button
              type="button"
              onClick={() => setMode('sections')}
              className={`guided-segment-button ${mode === 'sections' ? 'guided-segment-button-active' : ''}`}
            >
              <Rows3 size={13} />
              Từng phần
            </button>
            <button
              type="button"
              onClick={() => setMode('full')}
              className={`guided-segment-button ${mode === 'full' ? 'guided-segment-button-active' : ''}`}
            >
              <BookOpen size={13} />
              Toàn bài
            </button>
          </div>

          {mode === 'sections' ? (
            <div className="space-y-1 border-t border-black/10 pt-3">
              <p className="px-2 text-[11px] uppercase tracking-[0.14em] text-ink-faint">
                Phần {sectionIndex + 1}/{sections.length}
              </p>
              {sections.map((section, index) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => {
                    goToSection(index);
                  }}
                  className={`guided-outline-item block w-full px-2 text-left ${
                    index === sectionIndex ? 'guided-outline-item-active' : ''
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
        <div className="guided-reader-surface flex flex-wrap items-center justify-between gap-3 px-3 py-2 2xl:hidden">
          <div className="guided-segmented-control grid min-w-[13rem] flex-1 grid-cols-2 p-1 sm:flex-none">
            <button
              type="button"
              onClick={() => setMode('sections')}
              className={`guided-segment-button ${mode === 'sections' ? 'guided-segment-button-active' : ''}`}
            >
              Từng phần
            </button>
            <button
              type="button"
              onClick={() => setMode('full')}
              className={`guided-segment-button ${mode === 'full' ? 'guided-segment-button-active' : ''}`}
            >
              Toàn bài
            </button>
          </div>
          <span className="text-xs text-ink-faint">
            {outline.length} đề mục · ~{readMinutes} phút đọc
          </span>
        </div>

        {mode === 'sections' && current ? (
          <>
            <div className="guided-reader-surface flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-ink-faint">
                  Phần {sectionIndex + 1} / {sections.length}
                </p>
                <h2 className="mt-0.5 text-lg font-semibold text-ink">{current.title}</h2>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <button
                  type="button"
                  disabled={!canPrev}
                  onClick={() => goToSection(sectionIndex - 1)}
                  className="guided-secondary-button"
                >
                  <ChevronLeft size={16} />
                  Trước
                </button>
                <button
                  type="button"
                  disabled={!canNext}
                  onClick={() => goToSection(sectionIndex + 1)}
                  className="guided-primary-button"
                >
                  Tiếp
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className={proseClass}>
              <LessonMarkdown
                key={current.id}
                content={current.markdown}
                checklistStorageKey={checklistStorageKey}
              />
            </div>

          </>
        ) : (
          <div className={proseClass}>
            <LessonMarkdown content={displayContent} checklistStorageKey={checklistStorageKey} />
          </div>
        )}

        {/* Mobile outline under content */}
        <details className="guided-reader-surface p-4 2xl:hidden">
          <summary className="cursor-pointer text-sm font-semibold text-ink">Mở mục lục đầy đủ</summary>
          <div className="mt-3 max-h-64 overflow-y-auto">
            <OutlineNav items={outline} activeId={activeId} onSelect={goToOutlineItem} compact />
          </div>
        </details>
      </div>
    </div>
  );
}
