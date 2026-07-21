'use client';

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { parseLessonOutline, slugifyHeading } from './lessonContent';

type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return extractText(node.props.children);
  }
  return '';
}

function makeHeading(Tag: HeadingTag, idMap: Map<string, string>) {
  return function Heading({ children }: { children?: React.ReactNode }) {
    const text = extractText(children).trim();
    const id = idMap.get(text) ?? slugifyHeading(text);
    return (
      <Tag id={id} className="scroll-mt-28 group">
        <a
          href={`#${id}`}
          className="no-underline text-inherit hover:underline decoration-black/20 underline-offset-4"
        >
          {children}
        </a>
      </Tag>
    );
  };
}

export function LessonMarkdown({ content }: { content: string }) {
  const idMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of parseLessonOutline(content)) {
      if (!map.has(item.text)) map.set(item.text, item.id);
    }
    // Also map H1 if present (not in outline)
    const h1 = content.match(/^#\s+(.+?)\s*$/m);
    if (h1) {
      const text = h1[1].replace(/\s+#*\s*$/, '').trim();
      if (text && !map.has(text)) map.set(text, slugifyHeading(text));
    }
    return map;
  }, [content]);

  const components = useMemo(
    () => ({
      h1: makeHeading('h1', idMap),
      h2: makeHeading('h2', idMap),
      h3: makeHeading('h3', idMap),
      h4: makeHeading('h4', idMap),
      a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
        <a href={href} target={href?.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
          {children}
        </a>
      ),
    }),
    [idMap],
  );

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={components}
    >
      {content}
    </ReactMarkdown>
  );
}
