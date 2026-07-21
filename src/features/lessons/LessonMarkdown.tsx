'use client';

import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const SECTION_LABELS = new Set([
  'mục tiêu học tập',
  'cạm bẫy thường gặp',
  'tự kiểm tra',
  'checklist hoàn thành bài',
  'bước tiếp theo',
]);

/**
 * Older seeded lessons contain visual section labels as plain text instead of
 * Markdown headings. Preserve authored Markdown, while giving those lessons a
 * readable hierarchy until the content editor migrates them to proper Markdown.
 */
const normalizeLessonMarkdown = (content: string) => {
  let isInsideCodeFence = false;
  let activePlainTextSection = '';

  return content
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('```')) {
        isInsideCodeFence = !isInsideCodeFence;
        return line;
      }
      if (isInsideCodeFence || !trimmed) return line;
      if (/^(#{1,6}\s|[-*+]\s|\d+\.\s|>\s|\|)/.test(trimmed)) return line;

      const normalizedLabel = trimmed.replace(/:$/, '').toLocaleLowerCase('vi-VN');
      if (SECTION_LABELS.has(normalizedLabel) || /^(thời lượng gợi ý|về ide trên trang học)/i.test(trimmed)) {
        activePlainTextSection = normalizedLabel;
        return `## ${trimmed}`;
      }
      // Numbered prose in the current curriculum is a major concept, not an ordered-list item.
      if (/^\d+\.\s+.{8,}$/.test(trimmed)) {
        activePlainTextSection = '';
        return `## ${trimmed}`;
      }
      if (/^module\s+\d+:/i.test(trimmed) || /^(nhầm|cho rằng|tối ưu)\s/i.test(trimmed)) {
        return `- ${trimmed}`;
      }
      if (['mục tiêu học tập', 'cạm bẫy thường gặp', 'tự kiểm tra'].includes(activePlainTextSection)) {
        return `- ${trimmed}`;
      }
      return line;
    })
    .join('\n');
};

const markdownComponents: Components = {
  h1: ({ children }) => <h2 className="lesson-heading lesson-heading-1">{children}</h2>,
  h2: ({ children }) => <h2 className="lesson-heading lesson-heading-2">{children}</h2>,
  h3: ({ children }) => <h3 className="lesson-heading lesson-heading-3">{children}</h3>,
  p: ({ children }) => <p className="lesson-paragraph">{children}</p>,
  ul: ({ children }) => <ul className="lesson-list lesson-list-unordered">{children}</ul>,
  ol: ({ children }) => <ol className="lesson-list lesson-list-ordered">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  blockquote: ({ children }) => <blockquote className="lesson-callout">{children}</blockquote>,
  a: ({ children, href }) => <a href={href} className="lesson-link" target="_blank" rel="noreferrer">{children}</a>,
  code: ({ children, className }) => {
    const isBlock = Boolean(className?.includes('language-'));
    return isBlock ? <code className={className}>{children}</code> : <code className="lesson-inline-code">{children}</code>;
  },
  table: ({ children }) => <div className="lesson-table-wrap"><table>{children}</table></div>,
  th: ({ children }) => <th>{children}</th>,
  td: ({ children }) => <td>{children}</td>,
};

export function LessonMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {normalizeLessonMarkdown(content)}
    </ReactMarkdown>
  );
}
