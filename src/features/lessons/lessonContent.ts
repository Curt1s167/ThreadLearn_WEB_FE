/**
 * Lesson markdown helpers — outline + section split for guided reading.
 * Source of truth remains contentMarkdown (GFM). No HTML conversion needed.
 */

export type OutlineLevel = 2 | 3;

export interface LessonOutlineItem {
  id: string;
  level: OutlineLevel;
  text: string;
  /** 0-based index among H2 sections when this item is under an H2 */
  sectionIndex: number;
}

export interface LessonContentSection {
  id: string;
  title: string;
  /** Markdown body for this H2 block. The section heading is rendered by LessonReader. */
  markdown: string;
}

const HEADING_RE = /^(#{2,3})\s+(.+?)\s*$/;

/** Remove a leading Markdown H1 when the lesson page already renders that title. */
export function stripRepeatedLessonTitle(markdown: string, lessonTitle?: string): string {
  if (!lessonTitle) return markdown;

  const lines = markdown.replace(/^\uFEFF/, '').split(/\r?\n/);
  const firstContentIndex = lines.findIndex((line) => line.trim().length > 0);
  if (firstContentIndex < 0) return markdown;

  const match = lines[firstContentIndex].match(/^#(?!#)\s+(.+?)\s*$/);
  if (!match) return markdown;

  const markdownTitle = match[1].replace(/\s+#*\s*$/, '').trim();
  if (slugifyHeading(markdownTitle) !== slugifyHeading(lessonTitle)) return markdown;

  lines.splice(firstContentIndex, 1);
  while (lines[firstContentIndex]?.trim() === '') lines.splice(firstContentIndex, 1);
  return lines.join('\n').trim();
}

export function slugifyHeading(text: string): string {
  const base = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\u00c0-\u024f\s-]/gi, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);

  return base || 'section';
}

function uniqueId(text: string, used: Map<string, number>): string {
  const base = slugifyHeading(text);
  const count = used.get(base) ?? 0;
  used.set(base, count + 1);
  return count === 0 ? base : `${base}-${count + 1}`;
}

/** Build TOC from ## / ### headings in lesson markdown. */
export function parseLessonOutline(markdown: string): LessonOutlineItem[] {
  const used = new Map<string, number>();
  const items: LessonOutlineItem[] = [];
  let sectionIndex = -1;

  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(HEADING_RE);
    if (!match) continue;
    const level = match[1].length as OutlineLevel;
    const text = match[2].replace(/\s+#*\s*$/, '').trim();
    if (!text) continue;
    if (level === 2) sectionIndex += 1;
    items.push({
      id: uniqueId(text, used),
      level,
      text,
      sectionIndex: Math.max(0, sectionIndex),
    });
  }

  return items;
}

/**
 * Split lesson body into H2 sections for "read by part" mode.
 * Content before the first H2 becomes an intro section. The H2 line itself is
 * omitted because LessonReader renders the section title in its header.
 */
export function splitLessonSections(markdown: string): LessonContentSection[] {
  const lines = markdown.split(/\r?\n/);
  const used = new Map<string, number>();
  const sections: LessonContentSection[] = [];

  let currentTitle = 'Giới thiệu';
  let currentId = uniqueId(currentTitle, used);
  let buffer: string[] = [];
  let sawH2 = false;

  const flush = () => {
    const body = buffer.join('\n').trim();
    if (!body && sawH2 === false && sections.length === 0) return;
    if (!body) return;
    sections.push({ id: currentId, title: currentTitle, markdown: body });
  };

  for (const line of lines) {
    const match = line.match(/^(##)\s+(.+?)\s*$/);
    if (match) {
      flush();
      sawH2 = true;
      currentTitle = match[2].replace(/\s+#*\s*$/, '').trim() || 'Phần';
      currentId = uniqueId(currentTitle, used);
      buffer = [];
      continue;
    }
    buffer.push(line);
  }
  flush();

  if (sections.length === 0 && markdown.trim()) {
    return [{ id: 'content', title: 'Nội dung', markdown: markdown.trim() }];
  }

  return sections;
}

export function estimateReadMinutes(markdown: string): number {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}
